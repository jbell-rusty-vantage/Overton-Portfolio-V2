"use client";
import { Paragraph } from "@/components/Paragraph";
import Image from "next/image";

import { motion } from "framer-motion";

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
          My name is John Overton Bell, and I'm a mostly self-taught software
          engineer based in West Palm Beach, Florida. With a deep commitment to
          mastering full-stack development, I thrive at the intersection of
          digital marketing, data analysis, internal tool creation, and agile
          deployment methodologies. My passion lies not only in building
          comprehensive web solutions but also in understanding and streamlining
          the DevOps processes that bring these solutions to life.
        </Paragraph>
        <Paragraph className=" mt-4">
          Alongside full-stack development, my journey is deeply intertwined
          with the fascinating world of artificial intelligence. I'm
          particularly captivated by advanced AI application techniques such as
          Retrieval-Augmented Generation (RAG), fine-tuning models, prompt
          engineering, tool calling, quantization, agent orchestration
          workflows, and the innovative Model Context Protocol (MCP).
        </Paragraph>

        <Paragraph className=" mt-4">
          Currently, I am preparing to become an AWS Certified Solutions
          Architect Associate, which complements my ongoing projects. Among
          these exciting initiatives are an AI-powered BioHacking portal that
          leverages intelligent agents and a comprehensive rehab searching and
          admissions application with integrated AI assistant support.
        </Paragraph>
        <Paragraph className=" mt-4">
          I love BioHacking, and my favorite podcast is the "Human Upgrade" by
          Dave Asprey. I also have a "Favorite Books" section in my portfolio
          that I encourage visitors to check out. Beyond coding and development,
          I have a great passion for soccer. When I'm not at my computer, you'll
          likely find me on the pitch or watching my favorite player, Lionel
          Messi, dazzle on the field.
        </Paragraph>
        <Paragraph className=" mt-4">
          I've recently started a blog on my portfolio website, where I'll share
          insights, guides, and tutorials aimed at helping fellow developers
          navigate complex topics and enhance their technical skills. I implore
          all new developers, whether in a formal program or on a self-teaching
          journey, to actively build useful applications—be an engineer. Aim for
          that flow state where challenge perfectly meets skill, constantly
          challenge yourself to apply the concepts and languages you learn.
          Remember, tutorial hell is real—keep creating!
        </Paragraph>
        <Paragraph className=" mt-4">
          Join me on this journey of bytes and narratives, logic and creativity,
          code and prose. Together, we can explore the boundless possibilities
          of technology and storytelling, all while reveling in the sheer beauty
          of thoughtful design.
        </Paragraph>
        <Paragraph className=" mt-4">
          I'm so glad you've come to join me. Be on the look out for new
          features. Coming soon are an "Invest With Me" AI-assistant integrated
          dashboard, A Biohacking product and treatment feature as well as
          Notifications of my Prototypes (Applications I am building)
        </Paragraph>
      </div>
    </div>
  );
}
