import { PrismaClient, Prisma } from "@/app/generated/prisma";
import dotenv from "dotenv";

import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

if (!process.env.PINECONE_API_KEY) throw Error("Pinecone not set!");

const indexName = "blogposts";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const model = "llama-text-embed-v2";

export const index = pc.index(indexName);

export async function blogPostVecSearch(query: string, topK: number) {
  const searchWithText = await index.searchRecords({
    query: {
      topK,
      inputs: { text: query },
    },
  });

  const results = searchWithText.result.hits;

  return results;
}

// Helper function to sync a single blog post with Pinecone
async function syncBlogPostToPinecone(blogPost: any) {
  try {
    console.log(`Syncing blog post ${blogPost.id} to Pinecone...`);

    // Generate embedding for the blog post summary
    const embedding = await pc.inference.embed(model, [blogPost.summary], {
      inputType: "passage",
      truncate: "END",
    });

    // Check if embedding has values property (dense embedding)
    if (embedding.data[0] && "values" in embedding.data[0]) {
      const record = {
        id: blogPost.id,
        values: embedding.data[0].values,
        metadata: {
          description: blogPost.description,
          slug: blogPost.slug,
          title: blogPost.title,
          readingTime: blogPost.readingTime || 0,
          tags: blogPost.tags,
        },
      };

      // Upsert the record (creates new or updates existing)
      await index.upsert([record]);
      console.log(`Successfully synced blog post ${blogPost.id} to Pinecone`);
    } else {
      console.error(
        `Failed to generate embedding for blog post ${blogPost.id}`
      );
    }
  } catch (error) {
    console.error(`Error syncing blog post ${blogPost.id} to Pinecone:`, error);
  }
}

// Helper function to delete a blog post from Pinecone
async function deleteBlogPostFromPinecone(blogPostId: string) {
  try {
    console.log(`Deleting blog post ${blogPostId} from Pinecone...`);
    await index.deleteOne(blogPostId);
    console.log(`Successfully deleted blog post ${blogPostId} from Pinecone`);
  } catch (error) {
    console.error(
      `Error deleting blog post ${blogPostId} from Pinecone:`,
      error
    );
  }
}

const prisma = new PrismaClient().$extends({
  name: "blogpostvector",
  model: {
    blogPost: {
      async returnPineconeResults(query: string, topK: number) {
        const results = await blogPostVecSearch(query, topK);

        // Extract IDs from Pinecone results
        const blogPostIds = results.map((result) => result._id);

        // Find blog posts by their IDs
        const blogPosts = await prisma.blogPost.findMany({
          where: { id: { in: blogPostIds } },
        });

        // Return results with scores and blog post data
        return results.map((result) => {
          const blogPost = blogPosts.find((post) => post.id === result._id);
          return {
            score: result._score,
            blogPost,
            metadata: result.fields,
          };
        });
      },
    },
  },
  query: {
    blogPost: {
      // Intercept create operations
      async create({ model, operation, args, query }) {
        const result = await query(args);

        // Sync to Pinecone after successful creation
        if (result) {
          await syncBlogPostToPinecone(result);
        }

        return result;
      },

      // Intercept update operations
      async update({ model, operation, args, query }) {
        const result = await query(args);

        // Sync to Pinecone after successful update
        if (result) {
          await syncBlogPostToPinecone(result);
        }

        return result;
      },

      // Intercept upsert operations
      async upsert({ model, operation, args, query }) {
        const result = await query(args);

        // Sync to Pinecone after successful upsert
        if (result) {
          await syncBlogPostToPinecone(result);
        }

        return result;
      },

      // Intercept updateMany operations
      async updateMany({ model, operation, args, query }) {
        const result = await query(args);

        // For updateMany, we need to fetch the updated posts and sync them
        if (result.count > 0 && args.where) {
          const updatedPosts = await prisma.blogPost.findMany({
            where: args.where,
          });

          // Sync all updated posts to Pinecone
          for (const post of updatedPosts) {
            await syncBlogPostToPinecone(post);
          }
        }

        return result;
      },

      // Intercept delete operations
      async delete({ model, operation, args, query }) {
        // Get the blog post ID before deletion
        const blogPostToDelete = await prisma.blogPost.findUnique({
          where: args.where,
          select: { id: true },
        });

        const result = await query(args);

        // Delete from Pinecone after successful deletion
        if (result && blogPostToDelete) {
          await deleteBlogPostFromPinecone(blogPostToDelete.id);
        }

        return result;
      },

      // Intercept deleteMany operations
      async deleteMany({ model, operation, args, query }) {
        // Get the blog post IDs before deletion
        const blogPostsToDelete = await prisma.blogPost.findMany({
          where: args.where,
          select: { id: true },
        });

        const result = await query(args);

        // Delete from Pinecone after successful deletion
        if (result.count > 0) {
          for (const post of blogPostsToDelete) {
            await deleteBlogPostFromPinecone(post.id);
          }
        }

        return result;
      },
    },
  },
});

export default prisma;
