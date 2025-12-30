import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";

import { UpcomingProjects } from "@/components/UpcomingProjects";
import { TechStack } from "@/components/TechStack";

export default function Home() {
  return (
    <Container>
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <span className="text-4xl">💻</span>
        <Heading className="font-black">
          Hello there! I&apos;m John Overton
        </Heading>

        <Paragraph className="max-w-xl mt-4">
          I&apos;m a full-stack engineer building modern, data-aware systems—
          cloud-native pipelines, reliable APIs, AI agents, and user-facing web
          apps. I&apos;m especially interested in LLM-assisted products that
          connect ingestion and automation to real workflows, transforming
          unstructured data into structured knowledge and actionable insights.
        </Paragraph>

        <Paragraph className="max-w-xl mt-4">
          With a background in analytics and digital marketing, I design
          software that&apos;s <Highlight>measurable</Highlight>,{" "}
          <Highlight>improvable</Highlight>, and{" "}
          <Highlight>built to ship</Highlight>.
        </Paragraph>
      </div>

      <div className="flex flex-col items-center mt-20">
        <Heading
          as="h2"
          className="font-black text-2xl md:text-lg lg:text-lg mb-4 text-center"
        >
          What I&apos;ve been working on
        </Heading>

        <UpcomingProjects />
      </div>

      <TechStack />
    </Container>
  );
}
