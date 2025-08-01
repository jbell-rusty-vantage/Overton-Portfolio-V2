"use client";
import { Paragraph } from "@/components/Paragraph";
import Image from "next/image";

import { motion } from "motion/react";

export default function About() {
  const images = [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwxfHx8ZW58MHx8fHx8&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwxfHx8ZW58MHx8fHx8&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwxfHx8ZW58MHx8fHx8&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1552318965-6e6be7484ada?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwxfHx8ZW58MHx8fHx8&auto=format&fit=crop&w=800&q=60",
  ];
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 my-10">
        {images.map((image, index) => (
          <motion.div
            key={image}
            initial={{
              opacity: 0,
              y: -50,
              rotate: 0,
            }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: index % 2 === 0 ? 3 : -3,
            }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <Image
              src={image}
              width={200}
              height={400}
              alt="about"
              className="rounded-md object-cover transform rotate-3 shadow-xl block w-full h-40 md:h-60 hover:rotate-0 transition duration-200"
            />
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl">
        <Paragraph className=" mt-4">
          I'm John Overton Bell, a full-stack software engineer based in West
          Palm Beach, Florida. As a largely self-taught developer, I've
          cultivated expertise at the intersection of modern web development, AI
          integration, and DevOps practices. My approach combines technical
          proficiency with strategic thinking to deliver comprehensive solutions
          that solve real-world problems.
        </Paragraph>

        <Paragraph className=" mt-4">
          My technical focus spans full-stack development and cutting-edge AI
          applications. I specialize in advanced techniques including
          Retrieval-Augmented Generation (RAG), model fine-tuning, prompt
          engineering, tool calling, and agent orchestration workflows.
          Currently, I'm pursuing AWS Solutions Architect Associate
          certification to strengthen my cloud infrastructure capabilities.
        </Paragraph>

        <Paragraph className=" mt-4">
          You can explore my active projects in the Projects section, which
          showcases both completed applications and upcoming initiatives.
          Notable current developments include an AI-powered BioHacking portal
          leveraging intelligent agents and a comprehensive rehab search and
          admissions platform with integrated AI assistant support.
        </Paragraph>

        <Paragraph className=" mt-4">
          Beyond development, I'm passionate about knowledge sharing and
          continuous learning. My Blog features technical insights, development
          tutorials, and industry perspectives designed to help fellow
          developers navigate complex challenges. Additionally, the Books
          section highlights my favorite reads that have shaped my approach to
          technology and personal development—I particularly recommend checking
          out the recommendations from thought leaders like Dave Asprey.
        </Paragraph>

        <Paragraph className=" mt-4">
          When I'm not coding, you'll find me pursuing biohacking optimization
          techniques or on the soccer field. I believe in maintaining the same
          precision and dedication in physical pursuits as I do in software
          development—whether that's following Lionel Messi's latest
          performances or optimizing my own health metrics.
        </Paragraph>

        <Paragraph className=" mt-4">
          I encourage aspiring developers to embrace the builder mindset: move
          beyond tutorials and create meaningful applications that challenge
          your skills. The intersection of theory and practice is where real
          growth happens, and I'm here to support that journey through shared
          knowledge and innovative solutions.
        </Paragraph>

        <Paragraph className=" mt-4">
          Stay tuned for exciting portfolio enhancements and new project
          launches. I'm actively developing an AI-integrated investment
          dashboard, expanding biohacking product features, and will be rolling
          out notifications for new prototype applications. The portfolio
          continues to evolve as a living showcase of emerging technologies and
          practical solutions.
        </Paragraph>
      </div>
    </div>
  );
}
