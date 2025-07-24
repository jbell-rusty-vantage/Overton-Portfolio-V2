import prisma from "./globalPrisma";

async function main() {
  console.log("🌱 Starting database seeding...");

  const projects = [
    {
      name: "portfoliosite",
      description: "Portfolio built with Next.js, deployed through Vercel",
      extendedDescription:
        "A modern, responsive portfolio website showcasing my development skills and projects. Built with Next.js 15, featuring server-side rendering, optimized performance, and seamless deployment through Vercel. The site includes smooth animations, dark/light mode theming, and a contact form with database integration. Demonstrates proficiency in React, TypeScript, and modern web development practices.",
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Vercel",
        "Prisma",
        "PostgreSQL",
      ],
      features: [
        "Responsive Design",
        "Dark/Light Mode",
        "Contact Form",
        "Database Integration",
        "SEO Optimized",
        "Performance Optimized",
      ],
      tags: ["portfolio", "nextjs", "fullstack", "deployment"],
      url: "https://github.com/Overton77/portfoliosite",
      liveUrl: null,
      images: [],
    },
    {
      name: "rehab-ingestion-py-ms",
      description:
        "Microservice for information ingestion and enhancement for providers for an LLM-assisted Rehab application",
      extendedDescription:
        "A sophisticated microservice architecture designed to handle data ingestion and processing for healthcare rehabilitation providers. This system integrates with LLM technology to enhance provider information, automate data processing, and improve patient care workflows. Built with Python, it features robust error handling, data validation, and scalable processing pipelines. The microservice demonstrates advanced understanding of healthcare data management, API design, and system integration.",
      technologies: [
        "Python",
        "FastAPI",
        "PostgreSQL",
        "Docker",
        "Kubernetes",
        "LLM Integration",
        "Healthcare APIs",
      ],
      features: [
        "Data Ingestion",
        "LLM Enhancement",
        "Provider Management",
        "Healthcare Integration",
        "Scalable Architecture",
        "Error Handling",
      ],
      tags: ["microservice", "healthcare", "llm", "python", "api"],
      url: "https://github.com/Overton77/rehab-ingestion-py-ms",
      liveUrl: null,
      images: [],
    },
    {
      name: "Rehab_Ingestion_Pipeline",
      description:
        "Backend Ingestion Pipeline for a Rehab search, admissions and resource application (Python, Docker, Supabase, Kafka)",
      extendedDescription:
        "A comprehensive backend data pipeline designed for rehabilitation facility management. This system handles search functionality, admissions processing, and resource allocation through a robust microservices architecture. Built with Python and Docker, it integrates Supabase for real-time database operations and Kafka for event streaming. The pipeline demonstrates advanced understanding of distributed systems, data processing workflows, and healthcare application architecture. Features include real-time data synchronization, automated admissions processing, and intelligent resource matching algorithms.",
      technologies: [
        "Python",
        "Docker",
        "Supabase",
        "Kafka",
        "PostgreSQL",
        "FastAPI",
        "Celery",
        "Redis",
      ],
      features: [
        "Data Pipeline",
        "Real-time Processing",
        "Admissions Management",
        "Resource Allocation",
        "Search Functionality",
        "Event Streaming",
      ],
      tags: ["backend", "pipeline", "healthcare", "microservices", "kafka"],
      url: "https://github.com/Overton77/Rehab_Ingestion_Pipeline",
      liveUrl: null,
      images: [],
    },
    {
      name: "ResearchAgent",
      description: "Research agent project",
      extendedDescription:
        "An intelligent research automation system that leverages AI to streamline information gathering and analysis processes. This agent can autonomously conduct research tasks, synthesize information from multiple sources, and generate comprehensive reports. Built with modern AI/ML technologies, it demonstrates advanced capabilities in natural language processing, data analysis, and automated research workflows. The system includes features for source validation, citation management, and customizable research parameters.",
      technologies: [
        "Python",
        "LangChain",
        "OpenAI",
        "Vector Databases",
        "Web Scraping",
        "NLP",
        "Machine Learning",
      ],
      features: [
        "Automated Research",
        "Source Validation",
        "Report Generation",
        "Citation Management",
        "Multi-source Analysis",
        "Customizable Workflows",
      ],
      tags: ["ai", "research", "automation", "nlp", "machine-learning"],
      url: "https://github.com/Overton77/ResearchAgent",
      liveUrl: null,
      images: [],
    },
    {
      name: "BioHackAgent",
      description:
        "LLM-integrated application that extracts useful data from biohackers like Dave Asprey's YouTube channel (LangChain, LangGraph, Gemini, Pinecone, Streamlit)",
      extendedDescription:
        "A sophisticated AI-powered application that analyzes and extracts valuable insights from biohacking content creators. The system processes YouTube videos, podcasts, and articles from prominent biohackers like Dave Asprey, using advanced NLP to identify actionable health and wellness information. Built with LangChain and LangGraph for complex reasoning workflows, integrated with Google's Gemini for content analysis, and Pinecone for vector storage. Features a Streamlit interface for easy data exploration and insight discovery.",
      technologies: [
        "Python",
        "LangChain",
        "LangGraph",
        "Gemini",
        "Pinecone",
        "Streamlit",
        "YouTube API",
        "NLP",
      ],
      features: [
        "Content Analysis",
        "Insight Extraction",
        "Vector Search",
        "Interactive Dashboard",
        "Multi-source Processing",
        "Health Data Mining",
      ],
      tags: ["ai", "biohacking", "content-analysis", "health", "nlp"],
      url: "https://github.com/Overton77/BioHackAgent",
      liveUrl: null,
      images: [],
    },
    {
      name: "simple_pdf_app_gen_ai",
      description: "Simple app showing minimal RAG usage",
      extendedDescription:
        "A streamlined demonstration of Retrieval-Augmented Generation (RAG) implementation for document processing and question answering. This application showcases the fundamental concepts of RAG architecture, including document ingestion, vector embedding, similarity search, and AI-powered response generation. Built for educational purposes, it provides a clean, minimal implementation that can be easily understood and extended. The app demonstrates proficiency in modern AI development practices and document processing workflows.",
      technologies: [
        "Python",
        "LangChain",
        "Vector Databases",
        "PDF Processing",
        "OpenAI",
        "Streamlit",
      ],
      features: [
        "PDF Ingestion",
        "Vector Embedding",
        "Similarity Search",
        "Question Answering",
        "Document Processing",
        "RAG Implementation",
      ],
      tags: ["rag", "ai", "pdf", "document-processing", "education"],
      url: "https://github.com/Overton77/simple_pdf_app_gen_ai",
      liveUrl: null,
      images: [],
    },
    {
      name: "Amazon_Price_Tracker",
      description:
        "Simple Amazon product price tracker. Simply enter the product url of an amazon product.",
      extendedDescription:
        "A practical web application that monitors Amazon product prices and alerts users to price changes. Built with TypeScript and modern web technologies, the app features a clean user interface for easy product URL input and price tracking. The system includes automated price monitoring, email notifications for price drops, and historical price tracking. Demonstrates understanding of web scraping, API integration, and user experience design. Perfect for savvy shoppers looking to optimize their purchasing decisions.",
      technologies: [
        "TypeScript",
        "React",
        "Node.js",
        "Web Scraping",
        "Email Notifications",
        "Database",
      ],
      features: [
        "Price Monitoring",
        "Email Alerts",
        "Historical Tracking",
        "User Dashboard",
        "Product Search",
        "Price History Charts",
      ],
      tags: [
        "price-tracking",
        "ecommerce",
        "automation",
        "typescript",
        "web-scraping",
      ],
      url: "https://github.com/Overton77/Amazon_Price_Tracker",
      liveUrl: null,
      images: [],
    },
    {
      name: "Yelp_Camp_App",
      description:
        "Campground searching/creating application from Udemy course",
      extendedDescription:
        "A full-stack web application for discovering and reviewing campgrounds, built as part of the comprehensive Udemy Web Developer Bootcamp. Features user authentication, campground creation and management, review system, and interactive maps. The application demonstrates proficiency in full-stack development, database design, and user interface creation. Includes features like image uploads, geolocation services, and a responsive design that works across all devices. A great example of building a complete, production-ready web application from concept to deployment.",
      technologies: [
        "JavaScript",
        "Node.js",
        "Express",
        "MongoDB",
        "Bootstrap",
        "Mapbox API",
        "Cloudinary",
      ],
      features: [
        "User Authentication",
        "Campground CRUD",
        "Review System",
        "Interactive Maps",
        "Image Upload",
        "Responsive Design",
      ],
      tags: ["fullstack", "camping", "reviews", "maps", "udemy-project"],
      url: "https://github.com/Overton77/Yelp_Camp_App",
      liveUrl: null,
      images: [],
    },
    {
      name: "Minimal_Slack_Clone",
      description:
        "Minimal Slack clone using HTML, CSS, JavaScript, Node and Socket.io",
      extendedDescription:
        "A real-time messaging application that replicates core Slack functionality with a minimal, focused approach. Built with vanilla JavaScript and Socket.io for real-time communication, the app features instant messaging, user presence indicators, and channel management. Demonstrates understanding of WebSocket technology, real-time data synchronization, and modern web development practices. The clean, responsive interface showcases strong frontend development skills and attention to user experience design.",
      technologies: [
        "HTML",
        "CSS",
        "JavaScript",
        "Node.js",
        "Socket.io",
        "Express",
      ],
      features: [
        "Real-time Messaging",
        "User Presence",
        "Channel Management",
        "Instant Notifications",
        "Responsive Design",
        "WebSocket Communication",
      ],
      tags: [
        "real-time",
        "messaging",
        "socket.io",
        "vanilla-js",
        "communication",
      ],
      url: "https://github.com/Overton77/Minimal_Slack_Clone",
      liveUrl: null,
      images: [],
    },
    {
      name: "100_Days_Python_Blog_Site",
      description:
        "Blog website created with Python, utilizing Flask and SQLite",
      extendedDescription:
        "A personal blog platform built during the 100 Days of Python coding challenge, showcasing the learning journey and technical growth. Built with Flask framework and SQLite database, the blog features user authentication, post creation and management, and a clean, responsive design. The project demonstrates solid understanding of Python web development, database operations, and full-stack application architecture. Includes features like post categories, search functionality, and admin panel for content management.",
      technologies: ["Python", "Flask", "SQLite", "HTML", "CSS", "Bootstrap"],
      features: [
        "Blog Posts",
        "User Authentication",
        "Admin Panel",
        "Search Functionality",
        "Responsive Design",
        "Content Management",
      ],
      tags: ["python", "flask", "blog", "learning-project", "web-development"],
      url: "https://github.com/Overton77/100_Days_Python_Blog_Site",
      liveUrl: null,
      images: [],
    },
    {
      name: "React_Quiz",
      description:
        "Well-structured React Quiz application, built with vite, utilizing the Context API",
      extendedDescription:
        "An interactive quiz application built with React and Vite, demonstrating modern React development practices and state management. The app features a comprehensive quiz system with multiple question types, scoring mechanisms, and progress tracking. Built using React Context API for state management, the application showcases clean component architecture and efficient data flow. Includes features like timer functionality, score persistence, and a responsive design that provides an engaging user experience.",
      technologies: ["React", "Vite", "Context API", "JavaScript", "CSS"],
      features: [
        "Multiple Question Types",
        "Timer Functionality",
        "Score Tracking",
        "Progress Indicators",
        "Responsive Design",
        "State Management",
      ],
      tags: ["react", "quiz", "context-api", "vite", "interactive"],
      url: "https://github.com/Overton77/React_Quiz",
      liveUrl: null,
      images: [],
    },
    {
      name: "Natours_Design",
      description:
        "Non-utilitarian application created using atomic design and BEM methodology",
      extendedDescription:
        "A sophisticated frontend project showcasing advanced CSS architecture and design systems. Built using atomic design principles and BEM (Block Element Modifier) methodology, this project demonstrates mastery of modern CSS practices, responsive design, and scalable styling approaches. The application features complex animations, advanced layout techniques, and a focus on user experience design. Perfect example of building maintainable, scalable CSS architecture for large-scale applications.",
      technologies: [
        "HTML",
        "SCSS",
        "CSS3",
        "BEM Methodology",
        "Atomic Design",
      ],
      features: [
        "Advanced Animations",
        "Responsive Design",
        "CSS Architecture",
        "Design System",
        "Performance Optimized",
        "Cross-browser Compatible",
      ],
      tags: ["css", "design-system", "bem", "atomic-design", "frontend"],
      url: "https://github.com/Overton77/Natours_Design",
      liveUrl: null,
      images: [],
    },
    {
      name: "JSMasterClass",
      description:
        "Class projects being uploaded for testing and deployment purposes",
      extendedDescription:
        "A comprehensive collection of JavaScript projects developed during advanced JavaScript coursework. This repository serves as a testing ground for various JavaScript concepts, deployment strategies, and development workflows. Projects range from basic DOM manipulation to advanced ES6+ features, async programming, and modern JavaScript frameworks. Demonstrates continuous learning and practical application of JavaScript concepts in real-world scenarios.",
      technologies: [
        "JavaScript",
        "ES6+",
        "DOM Manipulation",
        "Async Programming",
        "Modern JS Features",
      ],
      features: [
        "Multiple Projects",
        "Testing Environment",
        "Deployment Examples",
        "Learning Progress",
        "Code Examples",
        "Best Practices",
      ],
      tags: ["javascript", "learning", "projects", "es6", "dom"],
      url: "https://github.com/Overton77/JSMasterClass",
      liveUrl: null,
      images: [],
    },
    {
      name: "NatoursApp_Api",
      description: "Nature tour application API from Node.js Bootcamp",
      extendedDescription:
        "A robust RESTful API for a nature tour booking application, built as part of an intensive Node.js bootcamp. The API features comprehensive tour management, user authentication, booking systems, and payment processing. Built with Express.js and MongoDB, it demonstrates advanced understanding of API design, database modeling, and backend development best practices. Includes features like geospatial queries, file uploads, email notifications, and comprehensive error handling. A production-ready API that showcases full-stack development capabilities.",
      technologies: [
        "Node.js",
        "Express",
        "MongoDB",
        "JWT",
        "Stripe",
        "SendGrid",
        "Multer",
      ],
      features: [
        "RESTful API",
        "User Authentication",
        "Tour Management",
        "Booking System",
        "Payment Processing",
        "Email Notifications",
      ],
      tags: ["nodejs", "api", "mongodb", "express", "backend"],
      url: "https://github.com/Overton77/NatoursApp_Api",
      liveUrl: null,
      images: [],
    },
  ];

  console.log(`📝 Inserting ${projects.length} projects...`);

  for (const project of projects) {
    try {
      const createdProject = await prisma.githubprojects.create({
        data: project,
      });
      console.log(`✅ Created project: ${createdProject.name}`);
    } catch (error) {
      console.error(`❌ Error creating project ${project.name}:`, error);
    }
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
