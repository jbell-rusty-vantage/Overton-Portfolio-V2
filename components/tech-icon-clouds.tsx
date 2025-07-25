import { IconCloud } from "@/components/magicui/icon-cloud";

const techCategories = [
  {
    name: "Frontend",
    defaultDescription:
      "Modern frameworks and UI technologies for building interactive web applications.",
    slugs: [
      "react",
      "nextdotjs",
      "typescript",
      "javascript",
      "html5",
      "css3",
      "tailwindcss",
      "redux",
      "graphql",
      "flutter",
    ],
  },
  {
    name: "Backend",
    defaultDescription:
      "Robust server-side technologies and databases for scalable applications.",
    slugs: [
      "nodedotjs",
      "express",
      "python",
      "django",
      "postgresql",
      "mongodb",
      "prisma",
      "firebase",
    ],
  },
  {
    name: "DevOps",
    defaultDescription:
      "Tools and platforms for deployment, automation, and infrastructure management.",
    slugs: [
      "docker",
      "amazonaws",
      "nginx",
      "vercel",
      "git",
      "github",
      "gitlab",
      "linux",
      "ci",
    ],
  },
  {
    name: "Tools",
    defaultDescription:
      "Productivity and development tools that streamline the workflow.",
    slugs: [
      "visualstudiocode",
      "figma",
      "postman",
      "jest",
      "cypress",
      "testinglibrary",
      "jira",
      "androidstudio",
      "sonarqube",
    ],
  },
  {
    name: "AI & ML",
    defaultDescription:
      "Technologies and frameworks for artificial intelligence and machine learning.",
    slugs: [
      "python",
      "tensorflow",
      "pytorch",
      "scikitlearn",
      "openai",
      "huggingface",
      "pandas",
      "numpy",
    ],
  },
];

function IconCloudCategory({ slugs }: { slugs: string[] }) {
  const images = slugs.map(
    (slug) => `https://cdn.simpleicons.org/${slug}/${slug}`
  );
  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden min-h-[200px]">
      <IconCloud images={images} />
    </div>
  );
}

interface TechIconCloudsProps {
  descriptions?: Record<string, string>;
}

export default function TechIconClouds({ descriptions }: TechIconCloudsProps) {
  return (
    <div className="grid gap-12 md:grid-cols-2">
      {techCategories.map((cat) => (
        <div key={cat.name} className="flex flex-col items-center gap-4">
          <h3 className="text-xl font-bold text-primary">{cat.name}</h3>
          <p className="text-muted-foreground text-center text-sm mb-2 max-w-md">
            {descriptions?.[cat.name] || cat.defaultDescription}
          </p>
          <IconCloudCategory slugs={cat.slugs} />
        </div>
      ))}
    </div>
  );
}
