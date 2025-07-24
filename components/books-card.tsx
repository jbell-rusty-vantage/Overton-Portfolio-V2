import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Hash } from "lucide-react";
import Image from "next/image";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    description?: string | null;
    publishedDate?: string | null;
    pageCount?: number | null;
    thumbnail?: string | null;
    categories: string[];
    authors: {
      name: string;
    };
  };
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="aspect-[3/4] relative overflow-hidden rounded-lg mb-4">
          {book.thumbnail ? (
            <Image
              src={book.thumbnail}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {book.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground font-medium">
          by {book.authors.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {book.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {book.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {book.categories.slice(0, 3).map((category, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
          {book.categories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{book.categories.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {book.publishedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{book.publishedDate}</span>
            </div>
          )}
          {book.pageCount && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              <span>{book.pageCount} pages</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
