import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Brain, Lightbulb } from "lucide-react";

export default function AboutCard() {
  const aboutSections = [
    {
      title: "Full Stack Developer",
      description:
        "Utilizing an array of different web technologies and backend technologies",
      icon: Code,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "AI Engineer & LLM Engineer",
      description:
        "In training, writing advanced RAG applications and automations",
      icon: Brain,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Problem Solver",
      description:
        "An Engineer who wants to build useful products, services and systems",
      icon: Lightbulb,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {aboutSections.map((section, index) => {
        const IconComponent = section.icon;
        return (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow duration-300"
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <IconComponent className={`h-8 w-8 ${section.color}`} />
              </div>
              <CardTitle className="text-xl font-bold text-primary">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
