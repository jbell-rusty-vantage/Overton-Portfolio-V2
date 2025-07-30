import { BlogList } from "@/components/BlogPostList";
import { Container } from "@/components/Container";

type BlogPageProps = {
  searchParams?: Promise<{
    query?: string;
    offset?: number;
    limit?: number;
    readingTime?: number;
    publishedAt?: string;
    tags?: string;
  }>;
};

export default async function Page({ searchParams }: BlogPageProps) {
  return (
    <Container>
      <BlogList searchParams={searchParams} />
    </Container>
  );
}
