import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";

import { UpcomingProjects } from "@/components/UpcomingProjects";
import { TechStack } from "@/components/TechStack";
import Image from "next/image";

export default function Home() {
  return (
    <Container>
      <span className="text-4xl">💻</span>
      <Heading className="font-black">
        Hello there! I&apos;m John Overton
      </Heading>
      <Paragraph className="max-w-xl mt-4">
        I&apos;m a Full Stack Developer and AI and Dev Ops Engineer in training.
        I love
        <Highlight>engineering solutions</Highlight> and I hope to create web,
        mobile and desktop apps that change people' lives
        <Highlight>And The World</Highlight>
      </Paragraph>
      <Paragraph className="max-w-xl mt-4">
        I'm currently a software bootcamp student and a self-taught Software
        Engineer.
        <Highlight>
          I have about 1 year of experience building application
        </Highlight>
        I am rapidly improving my skills. I am developing prototypes ,
        practicing my development skills and charging forward in the Agentic Age
        of AI.
      </Paragraph>
      <Heading
        as="h2"
        className="font-black text-lg md:text-lg lg:text-lg mt-20 mb-4"
      >
        What I&apos;ve been working on
      </Heading>
      <UpcomingProjects />
      <TechStack />
    </Container>
  );
}
