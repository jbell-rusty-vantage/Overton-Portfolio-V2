"use client";

import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import ContactForm from "@/components/contact-form";
import ProjectsSectionClient from "@/components/projects-section-client";
import TechStack from "@/components/tech-stack";
import AboutCard from "@/components/about-card";
import BooksSectionClient from "@/components/books-section-client";

interface ContentRendererProps {
  selectedItem: string;
}

export function ContentRenderer({ selectedItem }: ContentRendererProps) {
  const renderContent = () => {
    switch (selectedItem) {
      case "about":
        return (
          <section className="text-primary py-12 md:py-12 lg:py-12">
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
        );
      case "projects":
        return <ProjectsSectionClient />;
      case "books":
        return <BooksSectionClient />;
      case "tech":
        return (
          <section className="py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
                Tech Stack
              </h2>
              <TechStack />
            </div>
          </section>
        );
      case "contact":
        return (
          <section className="py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
                  Get in Touch
                </h2>
                <ContactForm />
              </div>
            </div>
          </section>
        );
      default:
        return (
          <div className="space-y-4 p-6">
            <h1 className="text-3xl font-bold">Welcome</h1>
            <p className="text-muted-foreground">
              Select an item from the sidebar to get started.
            </p>
          </div>
        );
    }
  };

  return <div className="flex-1">{renderContent()}</div>;
}
