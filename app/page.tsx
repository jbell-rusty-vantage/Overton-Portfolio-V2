import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";

import { UpcomingProjects } from "@/components/UpcomingProjects";
import { TechStack } from "@/components/TechStack";

export default function Home() {
  return (
    <Container>
      <span className="text-4xl">💻</span>
      <Heading className="font-black">
        Hello there! I&apos;m John Overton
      </Heading>
      <Paragraph className="max-w-xl mt-4">
        I&apos;m a Full Stack Developer specializing in AI and DevOps
        engineering. I&apos;m passionate about
        <Highlight>engineering innovative solutions</Highlight> that solve
        real-world problems and building applications that
        <Highlight>make a meaningful impact</Highlight>.
      </Paragraph>
      <Paragraph className="max-w-xl mt-4">
        Currently advancing my expertise through intensive software development
        training while leveraging my self-taught foundation.
        <Highlight>
          With over a year of hands-on experience building applications
        </Highlight>
        , I focus on creating prototypes, refining my technical skills, and
        staying at the forefront of AI-driven development.
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
