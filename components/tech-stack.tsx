import TechIconClouds from "@/components/tech-icon-clouds";

export default function TechStack() {
  return (
    <div className="flex flex-col gap-12">
      <TechIconClouds
        descriptions={{
          Frontend:
            "I have a deep understanding of modern frontend frameworks and libraries, including React and Next.js. I excel at building responsive, accessible, and performant user interfaces using TypeScript and TailwindCSS. My experience includes state management with Redux, API integration with GraphQL, and delivering pixel-perfect designs.",
          Backend:
            "My backend expertise covers Node.js, Express, and Python/Django, allowing me to architect scalable REST and GraphQL APIs. I am proficient in database design and optimization with PostgreSQL and MongoDB, and I use Prisma ORM for type-safe data access. I focus on security, maintainability, and performance in all backend systems.",
          DevOps:
            "I am skilled in deploying and managing applications using Docker, AWS, and modern CI/CD pipelines. My workflow includes infrastructure as code, automated testing, and continuous integration. I am comfortable with Linux server management, Nginx configuration, and leveraging platforms like Vercel for rapid deployment.",
          Tools:
            "I leverage a suite of productivity and development tools to streamline my workflow. This includes VS Code for coding, Figma for design collaboration, Postman for API testing, and Jest/Cypress for automated testing. I am adept at using Git, GitHub, and GitLab for version control and team collaboration.",
          "AI & ML":
            "I have hands-on experience with AI and machine learning frameworks such as TensorFlow, PyTorch, and scikit-learn. My work includes building and fine-tuning models, integrating OpenAI and HuggingFace APIs, and applying data science tools like Pandas and NumPy. I am passionate about leveraging AI to solve real-world problems and create intelligent applications.",
        }}
      />
    </div>
  );
}
