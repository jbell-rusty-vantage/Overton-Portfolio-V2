import PortfolioApp from "@/components/portfolio-app";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link href="/current_resume.pdf" target="_blank">
          <Button variant="outline" size="sm">
            Resume
          </Button>
        </Link>
        <ThemeToggle />
      </div>
      <PortfolioApp />
    </div>
  );
}
