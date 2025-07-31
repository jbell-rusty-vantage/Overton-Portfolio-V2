import prisma from "./globalPrisma";

async function main() {
  console.log("🌱 Starting database seeding...");

  await prisma.githubprojects.deleteMany();

  const projects = [
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
      name: "rehab-ingestion-py-ms",
      description:
        "Microservice for information ingestion and enhancement for providers for an llm-assisted Rehab application",
      extendedDescription:
        "A sophisticated microservice architecture designed to handle data ingestion and processing for healthcare rehabilitation providers. This system integrates with LLM technology to enhance provider information, automate data processing, and improve patient care workflows. Built with Python and FastAPI, it features robust error handling, data validation, and scalable processing pipelines. The microservice demonstrates advanced understanding of healthcare data management, API design, and system integration.",
      technologies: [
        "Python",
        "FastAPI",
        "PostgreSQL",
        "Docker",
        "Supabase",
        "Kafka",
        "REST API",
        "Data Ingestion",
        "AI/ML",
      ],
      features: [
        "NPI Data Ingestion",
        "CSV Processing Pipeline",
        "API Integration",
        "Data Deduplication",
        "Real-time Search",
        "AI Assistant Integration",
        "Provider Database Management",
        "Health Monitoring",
        "Background Task Processing",
      ],
      tags: [
        "microservice",
        "healthcare",
        "llm",
        "python",
        "api",
        "data-ingestion",
      ],
      url: "https://github.com/Overton77/rehab-ingestion-py-ms",
      liveUrl: null,
      images: [],
    },
    {
      name: "Yelp_Camp_App",
      description:
        "A campground searching, creating application built for the udemy course 'The Web Developer BootCamp 2023' by instructor Colt Steele",
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
        "A minimal slack clone built using html, css, javascript, node and socket.io",
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
      name: "React_Quiz",
      description:
        "A well-structured React Quiz application, built with vite, utilizing the Context API",
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
      name: "NatoursApp_Api",
      description:
        "An amazing nature tour application created for the Node JS Bootcamp by Jonas Schmedtmann",
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
