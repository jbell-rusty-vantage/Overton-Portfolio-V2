import { BlogList } from "@/components/BlogPostList";

export default async function Page({ searchParams }) {
  return <BlogList searchParams={searchParams} />;
}
