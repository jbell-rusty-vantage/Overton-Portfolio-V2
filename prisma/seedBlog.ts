import prisma from "./globalPrisma";

const blogPosts = [
  {
    slug: "langchain-langgraph-langsmith-llm-orchestration",
    title:
      "LangChain, LangGraph, and LangSmith: The Complete LLM Orchestration Stack",
    description:
      "A comprehensive guide to building sophisticated LLM applications with the LangChain ecosystem",
    summary:
      "Explore how LangChain, LangGraph, and LangSmith work together to create production-ready LLM applications with proper orchestration, debugging, and monitoring capabilities.",
    tags: [
      "LLM",
      "LangChain",
      "LangGraph",
      "LangSmith",
      "AI",
      "Orchestration",
      "Development",
    ],
    publishedAt: new Date("2024-01-15"),
    coverImage: "/blog/langchain-ecosystem.jpg",
    mdxPath: "/blog/langchain-langgraph-langsmith.mdx",
    readingTime: 12,
    isPublished: true,
  },
  {
    slug: "llama-index-async-rag-workflows",
    title: "LlamaIndex Async Workflows: Revolutionizing RAG Applications",
    description:
      "Discover the new asynchronous paradigm in LlamaIndex for building scalable RAG applications",
    summary:
      "Learn how LlamaIndex's new async workflows are transforming RAG applications with improved performance, better resource utilization, and enhanced user experience.",
    tags: [
      "LlamaIndex",
      "RAG",
      "Async",
      "Vector Databases",
      "AI",
      "Search",
      "Performance",
    ],
    publishedAt: new Date("2024-01-20"),
    coverImage: "/blog/llama-index-async.jpg",
    mdxPath: "/blog/llama-index-async-rag.mdx",
    readingTime: 15,
    isPublished: true,
  },
  {
    slug: "nextjs-multivariate-web-development",
    title: "Next.js Multivariate Web Development: A Complete Paradigm Guide",
    description:
      "Master Next.js rendering strategies: SSR, SSG, ISR, and the new Partial Prerendering",
    summary:
      "Dive deep into Next.js rendering paradigms including Server-Side Rendering, Static Site Generation, Incremental Static Regeneration, and the revolutionary Partial Prerendering approach.",
    tags: [
      "Next.js",
      "React",
      "SSR",
      "SSG",
      "ISR",
      "Web Development",
      "Performance",
      "Rendering",
    ],
    publishedAt: new Date("2024-01-25"),
    coverImage: "/blog/nextjs-rendering.jpg",
    mdxPath: "/blog/nextjs-multivariate-development.mdx",
    readingTime: 18,
    isPublished: true,
  },
  {
    slug: "model-context-protocol-architecture",
    title:
      "Model Context Protocol: The New Standard for AI Application Architecture",
    description:
      "Understanding MCP: The revolutionary standard for AI application resources, prompts, tools, and connections",
    summary:
      "Explore the Model Context Protocol (MCP) architecture and how it's standardizing AI application development with unified resource management, prompt engineering, and tool integration.",
    tags: [
      "MCP",
      "AI Architecture",
      "Model Context Protocol",
      "AI Standards",
      "Development",
      "Integration",
    ],
    publishedAt: new Date("2024-01-30"),
    coverImage: "/blog/mcp-architecture.jpg",
    mdxPath: "/blog/model-context-protocol.mdx",
    readingTime: 14,
    isPublished: true,
  },
  {
    slug: "advanced-llm-engineering-patterns",
    title: "Advanced LLM Engineering Patterns: From Prototype to Production",
    description:
      "Essential patterns and best practices for building scalable, reliable LLM applications",
    summary:
      "Master advanced LLM engineering patterns including prompt engineering, error handling, rate limiting, caching strategies, and production deployment considerations.",
    tags: [
      "LLM Engineering",
      "AI",
      "Production",
      "Best Practices",
      "Architecture",
      "Scalability",
      "Reliability",
    ],
    publishedAt: new Date("2024-02-05"),
    coverImage: "/blog/llm-engineering-patterns.jpg",
    mdxPath: "/blog/advanced-llm-patterns.mdx",
    readingTime: 20,
    isPublished: true,
  },
  {
    slug: "langchain-custom-tools-agents",
    title: "Building Custom Tools and Agents with LangChain: A Deep Dive",
    description:
      "Create powerful custom tools and autonomous agents using LangChain's flexible architecture",
    summary:
      "Learn how to extend LangChain with custom tools, build intelligent agents, and implement complex reasoning workflows for specialized business applications.",
    tags: [
      "LangChain",
      "AI Agents",
      "Custom Tools",
      "Automation",
      "Python",
      "AI Development",
    ],
    publishedAt: new Date("2024-02-10"),
    coverImage: "/blog/langchain-custom-tools.jpg",
    mdxPath: "/blog/langchain-custom-tools-agents.mdx",
    readingTime: 16,
    isPublished: true,
  },
  {
    slug: "langgraph-state-management-workflows",
    title: "LangGraph State Management: Building Complex AI Workflows",
    description:
      "Master state-driven AI workflows with LangGraph's powerful graph-based architecture",
    summary:
      "Discover how to build sophisticated AI applications using LangGraph's state management system, including conditional flows, parallel processing, and error recovery mechanisms.",
    tags: [
      "LangGraph",
      "State Management",
      "AI Workflows",
      "Graph Architecture",
      "LangChain",
      "Orchestration",
    ],
    publishedAt: new Date("2024-02-15"),
    coverImage: "/blog/langgraph-state-workflows.jpg",
    mdxPath: "/blog/langgraph-state-management.mdx",
    readingTime: 14,
    isPublished: true,
  },
  {
    slug: "nextjs-14-server-components-optimization",
    title: "Next.js 14 Server Components: Performance Optimization Strategies",
    description:
      "Unlock the full potential of Next.js 14 Server Components for blazing-fast applications",
    summary:
      "Explore advanced optimization techniques for Next.js 14 Server Components, including streaming, selective hydration, and the new Turbopack bundler integration.",
    tags: [
      "Next.js 14",
      "Server Components",
      "Performance",
      "React",
      "Optimization",
      "Turbopack",
      "Streaming",
    ],
    publishedAt: new Date("2024-02-20"),
    coverImage: "/blog/nextjs14-server-components.jpg",
    mdxPath: "/blog/nextjs-14-server-components.mdx",
    readingTime: 13,
    isPublished: true,
  },
  {
    slug: "remix-vs-nextjs-modern-comparison",
    title: "Remix vs Next.js 2024: The Ultimate Framework Comparison",
    description:
      "A comprehensive comparison of Remix and Next.js for modern web development",
    summary:
      "Compare Remix and Next.js across performance, developer experience, deployment options, and use cases to choose the right framework for your next project.",
    tags: [
      "Remix",
      "Next.js",
      "Framework Comparison",
      "Web Development",
      "React",
      "Performance",
      "DX",
    ],
    publishedAt: new Date("2024-02-25"),
    coverImage: "/blog/remix-vs-nextjs.jpg",
    mdxPath: "/blog/remix-vs-nextjs-comparison.mdx",
    readingTime: 17,
    isPublished: true,
  },
  {
    slug: "openai-gpt4-turbo-integration-guide",
    title: "OpenAI GPT-4 Turbo Integration: Complete Developer Guide",
    description:
      "Master GPT-4 Turbo integration with advanced features, function calling, and best practices",
    summary:
      "Learn how to integrate OpenAI's GPT-4 Turbo into your applications with function calling, JSON mode, vision capabilities, and cost optimization strategies.",
    tags: [
      "OpenAI",
      "GPT-4 Turbo",
      "API Integration",
      "Function Calling",
      "AI Development",
      "JSON Mode",
    ],
    publishedAt: new Date("2024-03-01"),
    coverImage: "/blog/openai-gpt4-turbo.jpg",
    mdxPath: "/blog/openai-gpt4-turbo-guide.mdx",
    readingTime: 15,
    isPublished: true,
  },
  {
    slug: "anthropic-claude-3-opus-development",
    title: "Anthropic Claude 3 Opus: Advanced AI Development Techniques",
    description:
      "Leverage Claude 3 Opus for sophisticated AI applications with enhanced reasoning",
    summary:
      "Explore Claude 3 Opus capabilities including advanced reasoning, code generation, document analysis, and building conversational AI with constitutional AI principles.",
    tags: [
      "Anthropic",
      "Claude 3",
      "AI Development",
      "Constitutional AI",
      "Reasoning",
      "Code Generation",
    ],
    publishedAt: new Date("2024-03-05"),
    coverImage: "/blog/claude-3-opus.jpg",
    mdxPath: "/blog/anthropic-claude-3-development.mdx",
    readingTime: 18,
    isPublished: true,
  },
  {
    slug: "aws-serverless-nextjs-deployment",
    title: "AWS Serverless Next.js: Complete Deployment and Optimization Guide",
    description:
      "Deploy and optimize Next.js applications on AWS using serverless architecture",
    summary:
      "Master AWS serverless deployment for Next.js applications using Lambda, CloudFront, S3, and DynamoDB with cost optimization and performance tuning strategies.",
    tags: [
      "AWS",
      "Serverless",
      "Next.js",
      "Lambda",
      "CloudFront",
      "Deployment",
      "Cloud Computing",
    ],
    publishedAt: new Date("2024-03-10"),
    coverImage: "/blog/aws-serverless-nextjs.jpg",
    mdxPath: "/blog/aws-serverless-nextjs.mdx",
    readingTime: 22,
    isPublished: true,
  },
  {
    slug: "azure-cloud-native-development",
    title: "Azure Cloud-Native Development: Modern Architectures and Patterns",
    description:
      "Build scalable cloud-native applications on Microsoft Azure with modern patterns",
    summary:
      "Learn cloud-native development on Azure using Container Apps, Functions, Cosmos DB, and Service Bus with microservices architecture and DevOps integration.",
    tags: [
      "Azure",
      "Cloud Native",
      "Microservices",
      "Container Apps",
      "DevOps",
      "Cosmos DB",
      "Cloud Computing",
    ],
    publishedAt: new Date("2024-03-15"),
    coverImage: "/blog/azure-cloud-native.jpg",
    mdxPath: "/blog/azure-cloud-native-development.mdx",
    readingTime: 19,
    isPublished: true,
  },
  {
    slug: "solidity-smart-contracts-defi",
    title: "Solidity Smart Contracts for DeFi: Advanced Development Patterns",
    description:
      "Master Solidity development for DeFi applications with security and gas optimization",
    summary:
      "Build secure and efficient DeFi protocols using advanced Solidity patterns, including liquidity pools, yield farming, flash loans, and gas optimization techniques.",
    tags: [
      "Solidity",
      "Smart Contracts",
      "DeFi",
      "Blockchain",
      "Ethereum",
      "Security",
      "Gas Optimization",
    ],
    publishedAt: new Date("2024-03-20"),
    coverImage: "/blog/solidity-defi-contracts.jpg",
    mdxPath: "/blog/solidity-smart-contracts-defi.mdx",
    readingTime: 25,
    isPublished: true,
  },
  {
    slug: "web3-dapp-development-guide",
    title: "Web3 DApp Development: From Frontend to Blockchain Integration",
    description:
      "Complete guide to building decentralized applications with modern web technologies",
    summary:
      "Learn to build full-stack DApps using React, ethers.js, IPFS, and smart contracts with wallet integration, transaction handling, and decentralized storage.",
    tags: [
      "Web3",
      "DApp",
      "React",
      "Ethers.js",
      "IPFS",
      "Blockchain",
      "Decentralized",
    ],
    publishedAt: new Date("2024-03-25"),
    coverImage: "/blog/web3-dapp-development.jpg",
    mdxPath: "/blog/web3-dapp-development.mdx",
    readingTime: 21,
    isPublished: true,
  },
  {
    slug: "biohacking-sleep-optimization-tech",
    title: "Biohacking Sleep Optimization: Technology-Driven Approaches",
    description:
      "Leverage technology and data analytics to optimize sleep quality and recovery",
    summary:
      "Discover evidence-based biohacking techniques for sleep optimization using wearables, environmental controls, supplementation tracking, and data analysis for peak performance.",
    tags: [
      "Biohacking",
      "Sleep Optimization",
      "Wearables",
      "Data Analytics",
      "Health Tech",
      "Recovery",
      "Performance",
    ],
    publishedAt: new Date("2024-03-30"),
    coverImage: "/blog/biohacking-sleep.jpg",
    mdxPath: "/blog/biohacking-sleep-optimization.mdx",
    readingTime: 16,
    isPublished: true,
  },
  {
    slug: "nutrition-tracking-ai-personalization",
    title: "AI-Powered Nutrition Tracking: Personalized Health Optimization",
    description:
      "Build intelligent nutrition tracking systems with AI-powered personalization",
    summary:
      "Create personalized nutrition optimization systems using computer vision for food recognition, AI for meal planning, and biomarker analysis for individualized recommendations.",
    tags: [
      "Nutrition",
      "AI",
      "Computer Vision",
      "Health Tech",
      "Biohacking",
      "Personalization",
      "Biomarkers",
    ],
    publishedAt: new Date("2024-04-05"),
    coverImage: "/blog/ai-nutrition-tracking.jpg",
    mdxPath: "/blog/nutrition-tracking-ai.mdx",
    readingTime: 14,
    isPublished: true,
  },
  {
    slug: "modern-react-patterns-hooks",
    title: "Modern React Patterns: Advanced Hooks and State Management",
    description:
      "Master advanced React patterns with custom hooks, context optimization, and state strategies",
    summary:
      "Explore advanced React patterns including custom hooks, compound components, render props evolution, concurrent features, and modern state management approaches.",
    tags: [
      "React",
      "Hooks",
      "State Management",
      "Patterns",
      "Performance",
      "Concurrent",
      "Modern Development",
    ],
    publishedAt: new Date("2024-04-10"),
    coverImage: "/blog/modern-react-patterns.jpg",
    mdxPath: "/blog/modern-react-patterns.mdx",
    readingTime: 17,
    isPublished: true,
  },
  {
    slug: "typescript-advanced-type-system",
    title: "TypeScript Advanced Type System: Generic Constraints and Utilities",
    description:
      "Master TypeScript's advanced type system for bulletproof applications",
    summary:
      "Deep dive into TypeScript's advanced features including conditional types, mapped types, template literals, generic constraints, and building type-safe APIs.",
    tags: [
      "TypeScript",
      "Type System",
      "Generics",
      "Advanced Types",
      "Type Safety",
      "Development",
    ],
    publishedAt: new Date("2024-04-15"),
    coverImage: "/blog/typescript-advanced.jpg",
    mdxPath: "/blog/typescript-advanced-types.mdx",
    readingTime: 20,
    isPublished: true,
  },
  {
    slug: "serverless-functions-optimization",
    title: "Serverless Functions Optimization: Performance and Cost Strategies",
    description:
      "Optimize serverless functions for performance, cost, and scalability across cloud providers",
    summary:
      "Learn advanced optimization techniques for serverless functions including cold start mitigation, memory tuning, connection pooling, and multi-cloud deployment strategies.",
    tags: [
      "Serverless",
      "Optimization",
      "Performance",
      "AWS Lambda",
      "Vercel",
      "Cold Start",
      "Cost Optimization",
    ],
    publishedAt: new Date("2024-04-20"),
    coverImage: "/blog/serverless-optimization.jpg",
    mdxPath: "/blog/serverless-functions-optimization.mdx",
    readingTime: 18,
    isPublished: true,
  },
  {
    slug: "remix-fullstack-progressive-enhancement",
    title: "Remix Full-Stack Development: Progressive Enhancement Mastery",
    description:
      "Build resilient web applications with Remix's progressive enhancement philosophy",
    summary:
      "Master Remix's full-stack capabilities including nested routing, data loading strategies, form handling, progressive enhancement, and deployment optimization.",
    tags: [
      "Remix",
      "Full-Stack",
      "Progressive Enhancement",
      "Forms",
      "Nested Routing",
      "Web Standards",
      "Resilience",
    ],
    publishedAt: new Date("2024-04-25"),
    coverImage: "/blog/remix-fullstack.jpg",
    mdxPath: "/blog/remix-fullstack-enhancement.mdx",
    readingTime: 19,
    isPublished: true,
  },
  {
    slug: "blockchain-layer2-scaling-solutions",
    title: "Blockchain Layer 2 Scaling: Polygon, Arbitrum, and Optimism Guide",
    description:
      "Navigate Layer 2 scaling solutions for efficient blockchain development",
    summary:
      "Compare and implement Layer 2 scaling solutions including Polygon, Arbitrum, and Optimism with deployment strategies, cost analysis, and development best practices.",
    tags: [
      "Blockchain",
      "Layer 2",
      "Scaling",
      "Polygon",
      "Arbitrum",
      "Optimism",
      "Ethereum",
    ],
    publishedAt: new Date("2024-04-30"),
    coverImage: "/blog/layer2-scaling.jpg",
    mdxPath: "/blog/blockchain-layer2-scaling.mdx",
    readingTime: 23,
    isPublished: true,
  },
];

async function seedBlogPosts() {
  console.log("🌱 Starting blog posts seeding...");

  try {
    // Clear existing blog posts
    await prisma.blogPost.deleteMany({});
    console.log("🗑️  Cleared existing blog posts");

    // Insert new blog posts
    for (const post of blogPosts) {
      await prisma.blogPost.create({
        data: post,
      });
      console.log(`✅ Created blog post: ${post.title}`);
    }

    console.log("🎉 Blog posts seeding completed successfully!");
    console.log(`📊 Total blog posts created: ${blogPosts.length}`);
  } catch (error) {
    console.error("❌ Error seeding blog posts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedBlogPosts()
  .then(() => {
    console.log("🚀 Database seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
