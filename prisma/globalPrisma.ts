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

// Type for blog post data used in sync operations
type BlogPostForSync = {
  id: string;
  summary: string;
  description: string;
  slug: string;
  title: string;
  readingTime: number | null;
  tags: string[];
};

// Helper function to validate and transform blog post for sync
function validateBlogPostForSync(blogPost: any): BlogPostForSync | null {
  if (!blogPost?.id || !blogPost?.summary) {
    console.warn("Blog post missing required fields for sync:", blogPost);
    return null;
  }

  return {
    id: blogPost.id,
    summary: blogPost.summary,
    description: blogPost.description || "",
    slug: blogPost.slug || "",
    title: blogPost.title || "",
    readingTime: blogPost.readingTime || null,
    tags: blogPost.tags || [],
  };
}

// Helper function to sync a single blog post with Pinecone
async function syncBlogPostToPinecone(blogPost: BlogPostForSync) {
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
      throw new Error(
        `Failed to generate embedding for blog post ${blogPost.id}`
      );
    }
  } catch (error) {
    console.error(`Error syncing blog post ${blogPost.id} to Pinecone:`, error);
    // Re-throw the error to ensure the calling operation knows about the failure
    throw error;
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
    // Re-throw the error to ensure the calling operation knows about the failure
    throw error;
  }
}

const prisma = new PrismaClient().$extends({
  name: "blogpostvector",
  model: {
    blogPost: {
      async returnPineconeResults(query: string, topK: number) {
        const results = await blogPostVecSearch(query, topK);

        // Deduplicate results by ID - keep only the first occurrence (highest score)
        const uniqueResults = new Map<string, (typeof results)[0]>();
        for (const result of results) {
          if (!uniqueResults.has(result._id)) {
            uniqueResults.set(result._id, result);
          }
        }

        // Extract unique IDs from deduplicated results
        const blogPostIds = Array.from(uniqueResults.keys());

        // Find blog posts by their IDs - only fetch what we need
        const blogPosts = await prisma.blogPost.findMany({
          where: { id: { in: blogPostIds } },
          select: {
            id: true,
            title: true,
            description: true,
            summary: true,
            slug: true,
            tags: true,
            readingTime: true,
            publishedAt: true,
            coverImage: true,
            isPublished: true,
          },
        });

        // Return deduplicated results with scores and blog post data
        return Array.from(uniqueResults.values())
          .map((result) => {
            const blogPost = blogPosts.find((post) => post.id === result._id);
            return {
              ...blogPost,
              score: result._score,
            };
          })
          .filter((result) => result.id); // Filter out any results where blog post wasn't found
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
          try {
            const validatedPost = validateBlogPostForSync(result);
            if (validatedPost) {
              await syncBlogPostToPinecone(validatedPost);
            }
          } catch (error) {
            console.error("Failed to sync to Pinecone after create:", error);
            // Optionally, you could rollback the Prisma operation here
            // throw error;
          }
        }

        return result;
      },

      // Intercept update operations
      async update({ model, operation, args, query }) {
        const result = await query(args);

        // Sync to Pinecone after successful update
        if (result) {
          try {
            const validatedPost = validateBlogPostForSync(result);
            if (validatedPost) {
              await syncBlogPostToPinecone(validatedPost);
            }
          } catch (error) {
            console.error("Failed to sync to Pinecone after update:", error);
            // Optionally, you could rollback the Prisma operation here
            // throw error;
          }
        }

        return result;
      },

      // Intercept upsert operations
      async upsert({ model, operation, args, query }) {
        const result = await query(args);

        // Sync to Pinecone after successful upsert
        if (result) {
          try {
            const validatedPost = validateBlogPostForSync(result);
            if (validatedPost) {
              await syncBlogPostToPinecone(validatedPost);
            }
          } catch (error) {
            console.error("Failed to sync to Pinecone after upsert:", error);
            // Optionally, you could rollback the Prisma operation here
            // throw error;
          }
        }

        return result;
      },

      // Intercept updateMany operations
      async updateMany({ model, operation, args, query }) {
        // Get the blog posts that will be updated BEFORE the update
        const postsToUpdate = await prisma.blogPost.findMany({
          where: args.where,
          select: {
            id: true,
            summary: true,
            description: true,
            slug: true,
            title: true,
            readingTime: true,
            tags: true,
          },
        });

        const result = await query(args);

        // Sync all updated posts to Pinecone
        if (result.count > 0 && postsToUpdate.length > 0) {
          // Apply the updates to our local copy for syncing
          const updatedPosts = postsToUpdate
            .map((post) => {
              const updatedPost = {
                ...post,
                ...args.data, // Apply the update data
              };
              return validateBlogPostForSync(updatedPost);
            })
            .filter(Boolean) as BlogPostForSync[];

          for (const post of updatedPosts) {
            try {
              await syncBlogPostToPinecone(post);
            } catch (error) {
              console.error(
                `Failed to sync post ${post.id} to Pinecone after updateMany:`,
                error
              );
              // Continue with other posts even if one fails
            }
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
          try {
            await deleteBlogPostFromPinecone(blogPostToDelete.id);
          } catch (error) {
            console.error(
              "Failed to delete from Pinecone after delete:",
              error
            );
            // Optionally, you could rollback the Prisma operation here
            // throw error;
          }
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
            try {
              await deleteBlogPostFromPinecone(post.id);
            } catch (error) {
              console.error(
                `Failed to delete post ${post.id} from Pinecone after deleteMany:`,
                error
              );
              // Continue with other posts even if one fails
            }
          }
        }

        return result;
      },
    },
  },
});

export default prisma;
