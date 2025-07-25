import { Card } from "@/components/ui/card";

const techCategories = [
  {
    name: "Frontend",
    description:
      "I have a deep understanding of modern frontend frameworks and libraries, including React and Next.js. I excel at building responsive, accessible, and performant user interfaces using TypeScript and TailwindCSS. My experience includes state management with Redux, API integration with GraphQL, and delivering pixel-perfect designs.",
    skills: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "HTML5",
      "CSS3",
      "TailwindCSS",
      "Redux",
      "GraphQL",
      "Flutter",
    ],
  },
  {
    name: "Backend",
    description:
      "My backend expertise covers Node.js, Express, and Python/Django, allowing me to architect scalable REST and GraphQL APIs. I am proficient in database design and optimization with PostgreSQL and MongoDB, and I use Prisma ORM for type-safe data access. I focus on security, maintainability, and performance in all backend systems.",
    skills: [
      "Node.js",
      "Express",
      "Python",
      "Django",
      "PostgreSQL",
      "MongoDB",
      "Prisma",
      "Firebase",
    ],
  },
  {
    name: "DevOps",
    description:
      "I am skilled in deploying and managing applications using Docker, AWS, and modern CI/CD pipelines. My workflow includes infrastructure as code, automated testing, and continuous integration. I am comfortable with Linux server management, Nginx configuration, and leveraging platforms like Vercel for rapid deployment.",
    skills: [
      "Docker",
      "AWS",
      "Nginx",
      "Vercel",
      "Git",
      "GitHub",
      "GitLab",
      "Linux",
      "CI/CD",
    ],
  },
  {
    name: "Tools",
    description:
      "I leverage a suite of productivity and development tools to streamline my workflow. This includes VS Code for coding, Figma for design collaboration, Postman for API testing, and Jest/Cypress for automated testing. I am adept at using Git, GitHub, and GitLab for version control and team collaboration.",
    skills: [
      "VS Code",
      "Figma",
      "Postman",
      "Jest",
      "Cypress",
      "Testing Library",
      "Jira",
      "Android Studio",
      "SonarQube",
    ],
  },
  {
    name: "AI & ML",
    description:
      "I have hands-on experience with AI and machine learning frameworks such as TensorFlow, PyTorch, and scikit-learn. My work includes building and fine-tuning models, integrating OpenAI and HuggingFace APIs, and applying data science tools like Pandas and NumPy. I am passionate about leveraging AI to solve real-world problems and create intelligent applications.",
    skills: [
      "Python",
      "TensorFlow",
      "PyTorch",
      "scikit-learn",
      "OpenAI",
      "HuggingFace",
      "Pandas",
      "NumPy",
    ],
  },
];

export default function TechStack() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {techCategories.map((cat) => (
        <Card
          key={cat.name}
          className="p-6 flex flex-col gap-4 shadow-md border border-primary/10 bg-background/80"
        >
          <h3 className="text-2xl font-bold text-primary mb-2">{cat.name}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {cat.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            {cat.description}
          </p>
        </Card>
      ))}
    </div>
  );
}
