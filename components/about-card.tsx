import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Brain, Lightbulb } from "lucide-react";

export default function AboutCard() {
  const aboutSections = [
    {
      title: "Full Stack Developer",
      description:
        "I build robust, scalable, and maintainable web applications using a wide range of technologies. My experience spans frontend frameworks (React, Next.js), backend systems (Node.js, Prisma, PostgreSQL), and cloud infrastructure. I enjoy architecting solutions that are both user-friendly and technically sound, with a focus on performance and security.",
      icon: Code,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "AI Engineer & LLM Engineer",
      description:
        "I specialize in developing AI-powered applications, particularly with large language models (LLMs). My work includes building advanced Retrieval-Augmented Generation (RAG) systems, automating workflows, and integrating AI into real-world products. I am passionate about leveraging AI to solve complex problems and create intelligent, adaptive systems.",
      icon: Brain,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Problem Solver",
      description:
        "Driven by curiosity and a desire to make an impact, I approach engineering as a craft. I thrive on tackling challenging problems, designing useful products, and building systems that improve people's lives. My mindset is rooted in continuous learning, creative thinking, and a commitment to delivering value.",
      icon: Lightbulb,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  const texts = [
    "Confused",
    "Curious",
    "Learning",
    "Proficient",
    "Imposter",
    "Syndome",
    "Developer",
    "Engineer",
    "Master",
    "AI Agent",
    "Orchestrator",
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Name and HyperText */}
      <div className="flex flex-col items-center sm:items-start sm:flex-row sm:justify-between gap-2">
        <div className="flex flex-col items-center sm:items-start"></div>
      </div>
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {aboutSections.map((section, index) => {
          const IconComponent = section.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"
            >
              <CardHeader className="text-center flex flex-col items-center">
                <div className="flex justify-center mb-4">
                  <IconComponent className={`h-8 w-8 ${section.color}`} />
                </div>
                <CardTitle className="text-xl font-bold text-primary">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center flex-1 flex items-center justify-center">
                <p className="text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Morphing Text */}
    </div>
  );
}
