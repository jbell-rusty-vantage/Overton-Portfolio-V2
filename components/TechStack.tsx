import Image from "next/image";
import React from "react";
import { Heading } from "./Heading";
import { twMerge } from "tailwind-merge";

interface TechItem {
  title: string;
  src: string;
  className: string;
}

export const TechStack = () => {
  const techCategories: {
    [key: string]: {
      title: string;
      items: TechItem[];
    };
  } = {
    frontend: {
      title: "Frontend",
      items: [
        {
          title: "Next.js",
          src: "/images/logos/next.png",
          className: "h-10 w-14",
        },
        {
          title: "Tailwind",
          src: "/images/logos/tailwind.png",
          className: "h-10 w-24",
        },
        {
          title: "Figma",
          src: "/images/logos/figma.png",
          className: "h-10 w-8",
        },
        {
          title: "Framer Motion",
          src: "/images/logos/framer.webp",
          className: "h-10 w-10",
        },
      ],
    },
    backend: {
      title: "Backend",
      items: [
        {
          title: "Node.js",
          src: "/images/logos/node.png",
          className: "h-10 w-12",
        },
      ],
    },
    devops: {
      title: "DevOps & Tools",
      items: [
        {
          title: "AWS",
          src: "/images/logos/aws.webp",
          className: "h-10 w-10",
        },
        {
          title: "Vercel",
          src: "/images/logos/vercel.png",
          className: "h-10 w-24",
        },
      ],
    },
  };

  return (
    <div>
      <Heading
        as="h2"
        className="font-black text-lg md:text-lg lg:text-lg mt-20 mb-4"
      >
        Tech Stacks I am Learning and Using.
      </Heading>
      <div className="space-y-8">
        {Object.entries(techCategories).map(([key, category]) => (
          <div
            key={key}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3 uppercase tracking-wider">
              {category.title}
            </h3>
            <div className="flex flex-row flex-wrap gap-4">
              {category.items.map((item, index) => (
                <div
                  key={item.title}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 group hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Image
                    src={item.src}
                    width={200}
                    height={200}
                    alt={item.title}
                    className={twMerge("object-contain", item.className)}
                  />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors duration-200">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
