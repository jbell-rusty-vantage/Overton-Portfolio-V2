import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import ContactForm from "@/components/contact-form";
import ProjectsSection from "@/components/projects-section";
import TechStack from "@/components/tech-stack";
import AboutCard from "@/components/about-card";
import BooksSection from "@/components/books-section";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <span className="hidden font-bold sm:inline-block">
                Overton.Dev
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium text-foreground">
              <Link
                href="#about"
                className="transition-colors hover:text-foreground/80"
              >
                About
              </Link>
              <Link
                href="#projects"
                className="transition-colors hover:text-foreground/80"
              >
                Projects
              </Link>
              <Link
                href="#books"
                className="transition-colors hover:text-foreground/80"
              >
                Books
              </Link>
              <Link
                href="#contact"
                className="transition-colors hover:text-foreground/80"
              >
                Contact
              </Link>
            </nav>
          </div>
          <Link href="/current_resume.pdf" target="_blank">
            <Button variant="outline" className="ml-auto">
              Resume
            </Button>
          </Link>
        </div>
      </header>

      <main className="container px-4 md:px-6">
        <section id="about" className="text-primary py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-3xl text-primary font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  John Overton Bell
                </h1>
                <div className="space-x-4">
                  <Link href="https://github.com/Overton77" target="_blank">
                    <Button variant="outline" size="icon">
                      <Github className="h-4 w-4" />
                      <span className="sr-only">GitHub</span>
                    </Button>
                  </Link>
                  <Link
                    href="https://www.linkedin.com/in/john-overton-90863b373/"
                    target="_blank"
                  >
                    <Button variant="outline" size="icon">
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </Link>
                  <Link href="mailto:hello@example.com">
                    <Button variant="outline" size="icon">
                      <Mail className="h-4 w-4" />
                      <span className="sr-only">Email</span>
                    </Button>
                  </Link>
                </div>
              </div>
              <AboutCard />
            </div>
          </div>
        </section>

        <ProjectsSection />

        <BooksSection />

        <section className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
              Tech Stack
            </h2>
            <TechStack />
          </div>
        </section>

        <section id="contact" className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
                Get in Touch
              </h2>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 John.dev. All rights reserved.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link
              className="text-xs hover:underline underline-offset-4"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-xs hover:underline underline-offset-4"
              href="#"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
