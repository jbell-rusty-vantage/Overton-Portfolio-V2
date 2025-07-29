import prisma, { index, model, pc } from "./globalPrisma";

import dotenv from "dotenv";

dotenv.config();

if (!process.env.PINECONE_API_KEY) throw Error("Pinecone not set!");

// Seed functions

async function retrieveAllBlogPosts() {
  const blogPosts = await prisma.blogPost.findMany({});

  return blogPosts;
}

async function embedBlogPostsWithMeta() {
  const blogPosts = await retrieveAllBlogPosts();

  // Create a map to store blog post data by ID
  const blogPostMap = new Map<
    string,
    {
      id: string;
      summary: string;
      description: string;
      slug: string;
      title: string;
      readingTime: number | null;
      tags: string[];
    }
  >();

  blogPosts.forEach((post) => {
    blogPostMap.set(post.id, {
      id: post.id,
      summary: post.summary,
      description: post.description,
      slug: post.slug,
      title: post.title,
      readingTime: post.readingTime,
      tags: post.tags,
    });
  });

  // Extract summaries for embedding
  const summaries = Array.from(blogPostMap.values()).map(
    (post) => post.summary
  );

  const embeddings = await pc.inference.embed(model, summaries, {
    inputType: "passage",
    truncate: "END",
  });

  return {
    embeddings: embeddings.data,
    blogPosts: Array.from(blogPostMap.values()),
  };
}

async function storeEmbeddings() {
  const { embeddings, blogPosts } = await embedBlogPostsWithMeta();

  const records = [];

  for (let i = 0; i < blogPosts.length; i++) {
    const blogPost = blogPosts[i];
    const embedding = embeddings[i];

    // Check if embedding has values property (dense embedding)
    if ("values" in embedding) {
      records.push({
        id: blogPost.id,
        values: embedding.values,
        metadata: {
          description: blogPost.description,
          slug: blogPost.slug,
          title: blogPost.title,
          readingTime: blogPost.readingTime || 0,
          tags: blogPost.tags,
        },
      });
    }
  }

  if (records.length > 0) {
    const indexOperation = await index.upsert(records);
    console.log(`Successfully upserted ${records.length} blog post embeddings`);
    return indexOperation;
  } else {
    console.log("No valid embeddings to upsert");
    return null;
  }
}

// Test the search functionality
// blogPostVecSearch("Blogs About Web Development", 2).then((result) =>
//   console.log("Search results:", result)
// );
