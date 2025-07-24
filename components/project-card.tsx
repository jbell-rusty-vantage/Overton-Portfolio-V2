import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Tag, Code, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  name: string;
  description: string;
  extendedDescription?: string;
  technologies: string[];
  features: string[];
  tags: string[];
  url: string;
  liveUrl?: string | null;
  images: string[];
}

export default function ProjectCard({
  name,
  description,
  extendedDescription,
  technologies,
  features,
  tags,
  url,
  liveUrl,
  images,
}: ProjectCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Code className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-xl leading-tight">{name}</h3>
          <div className="flex gap-2">
            <Link href={url} target="_blank">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Github className="h-4 w-4" />
                <span className="sr-only">View on GitHub</span>
              </Button>
            </Link>
            {liveUrl && (
              <Link href={liveUrl} target="_blank">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View Live</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {extendedDescription && (
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {extendedDescription}
            </p>
          </div>
        )}

        {technologies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Technologies
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {technologies.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {technologies.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{technologies.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {features.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Features
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {features.slice(0, 3).map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="default" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Link href={url} target="_blank" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Github className="h-4 w-4 mr-2" />
              View Code
            </Button>
          </Link>
          {liveUrl && (
            <Link href={liveUrl} target="_blank" className="flex-1">
              <Button size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Live Demo
              </Button>
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
