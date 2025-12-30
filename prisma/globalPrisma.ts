import { PrismaClient } from "@/app/generated/prisma";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

if (!process.env.PINECONE_API_KEY) throw new Error("Pinecone not set!");

const indexName = "blogposts";
const model = "llama-text-embed-v2";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const index = pc.index(indexName);

/**
 * ---- Pinecone Search ----
 */
export async function blogPostVecSearch(query: string, topK: number) {
  const searchWithText = await index.searchRecords({
    query: {
      topK,
      inputs: { text: query },
    },
  });

  return searchWithText.result.hits ?? [];
}

/**
 * ---- Types ----
 */
type BlogPostForSync = {
  id: string;
  summary: string;
  description: string;
  slug: string;
  title: string;
  readingTime: number | null;
  tags: string[];
};

function validateBlogPostForSync(blogPost: any): BlogPostForSync | null {
  if (!blogPost?.id || !blogPost?.summary) {
    // summary is required for embedding
    return null;
  }

  return {
    id: blogPost.id,
    summary: blogPost.summary,
    description: blogPost.description ?? "",
    slug: blogPost.slug ?? "",
    title: blogPost.title ?? "",
    readingTime: blogPost.readingTime ?? null,
    tags: blogPost.tags ?? [],
  };
}

/**
 * ---- Pinecone Sync Helpers ----
 */
async function syncBlogPostToPinecone(blogPost: BlogPostForSync) {
  const textToEmbed = [
    blogPost.title,
    blogPost.tags.join(", "),
    blogPost.summary,
    blogPost.description,
  ]
    .filter(Boolean)
    .join("\n\n");
  const embedding = await pc.inference.embed(model, [textToEmbed], {
    inputType: "passage",
    truncate: "END",
  });

  const vec = embedding.data?.[0];
  if (!vec || !("values" in vec)) {
    throw new Error(`Failed embedding for blog post ${blogPost.id}`);
  }

  const record = {
    id: blogPost.id,
    values: vec.values,
    metadata: {
      description: blogPost.description,
      slug: blogPost.slug,
      title: blogPost.title,
      readingTime: blogPost.readingTime ?? 0,
      tags: blogPost.tags,
    },
  };

  await index.upsert([record]);
}

async function deleteBlogPostFromPinecone(blogPostId: string) {
  await index.deleteOne(blogPostId);
}

/**
 * ---- Prisma Client Setup ----
 * IMPORTANT: Use basePrisma inside middleware/extends to avoid recursion.
 */
const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  name: "blogpostvector",
  model: {
    blogPost: {
      /**
       * Vector search + DB hydrate
       */
      async returnPineconeResults(query: string, topK: number) {
        const hits = await blogPostVecSearch(query, topK);

        // Deduplicate by ID, keep best score (highest)
        const bestById = new Map<string, (typeof hits)[0]>();
        for (const hit of hits) {
          const existing = bestById.get(hit._id);
          if (!existing || hit._score > existing._score) {
            bestById.set(hit._id, hit);
          }
        }

        const ids = Array.from(bestById.keys());

        // Fetch posts from DB
        const posts = await basePrisma.blogPost.findMany({
          where: { id: { in: ids } },
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

        const postsById = new Map(posts.map((p) => [p.id, p]));

        // Preserve ranking order by Pinecone score
        const ranked = Array.from(bestById.values())
          .sort((a, b) => b._score - a._score)
          .map((hit) => {
            const post = postsById.get(hit._id);
            if (!post) return null;
            return {
              ...post,
              score: hit._score,
            };
          })
          .filter(Boolean);

        return ranked;
      },
    },
  },

  query: {
    blogPost: {
      async create({ args, query }) {
        const result = await query(args);

        const validated = validateBlogPostForSync(result);
        if (validated) {
          try {
            await syncBlogPostToPinecone(validated);
          } catch (err) {
            console.error("Pinecone sync failed after create:", err);
          }
        }

        return result;
      },

      async update({ args, query }) {
        const result = await query(args);

        const validated = validateBlogPostForSync(result);
        if (validated) {
          try {
            await syncBlogPostToPinecone(validated);
          } catch (err) {
            console.error("Pinecone sync failed after update:", err);
          }
        }

        return result;
      },

      async upsert({ args, query }) {
        const result = await query(args);

        const validated = validateBlogPostForSync(result);
        if (validated) {
          try {
            await syncBlogPostToPinecone(validated);
          } catch (err) {
            console.error("Pinecone sync failed after upsert:", err);
          }
        }

        return result;
      },

      /**
       * updateMany: safest is fetch after update, because args.data may contain operations
       */
      async updateMany({ args, query }) {
        const result = await query(args);

        if (result.count > 0) {
          try {
            const updated = await basePrisma.blogPost.findMany({
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

            for (const post of updated) {
              const validated = validateBlogPostForSync(post);
              if (!validated) continue;
              try {
                await syncBlogPostToPinecone(validated);
              } catch (err) {
                console.error(`Pinecone sync failed for ${post.id}:`, err);
              }
            }
          } catch (err) {
            console.error("Pinecone sync failed after updateMany:", err);
          }
        }

        return result;
      },

      async delete({ args, query }) {
        // Fetch ID first
        const toDelete = await basePrisma.blogPost.findUnique({
          where: args.where,
          select: { id: true },
        });

        const result = await query(args);

        if (toDelete) {
          try {
            await deleteBlogPostFromPinecone(toDelete.id);
          } catch (err) {
            console.error("Pinecone delete failed after delete:", err);
          }
        }

        return result;
      },

      async deleteMany({ args, query }) {
        // Fetch IDs first
        const toDelete = await basePrisma.blogPost.findMany({
          where: args.where,
          select: { id: true },
        });

        const result = await query(args);

        if (result.count > 0 && toDelete.length > 0) {
          for (const post of toDelete) {
            try {
              await deleteBlogPostFromPinecone(post.id);
            } catch (err) {
              console.error(`Pinecone delete failed for ${post.id}:`, err);
            }
          }
        }

        return result;
      },
    },
  },
});

export default prisma;
