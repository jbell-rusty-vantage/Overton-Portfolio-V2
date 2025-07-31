import React from "react";

import localFont from "next/font/local";
import { twMerge } from "tailwind-merge";

// Font files can be colocated inside of `app`
const CalSans = localFont({
  src: [{ path: "../fonts/CalSans-SemiBold.woff2" }],
  display: "swap",
});

type HeadingProps = {
  className?: string;
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export const Heading = ({ className, children, as = "h1" }: HeadingProps) => {
  const baseClasses = twMerge(
    CalSans.className,
    "text-base md:text-xl lg:text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary",
    className
  );

  switch (as) {
    case "h1":
      return <h1 className={baseClasses}>{children}</h1>;
    case "h2":
      return <h2 className={baseClasses}>{children}</h2>;
    case "h3":
      return <h3 className={baseClasses}>{children}</h3>;
    case "h4":
      return <h4 className={baseClasses}>{children}</h4>;
    case "h5":
      return <h5 className={baseClasses}>{children}</h5>;
    case "h6":
      return <h6 className={baseClasses}>{children}</h6>;
    default:
      return <h1 className={baseClasses}>{children}</h1>;
  }
};
