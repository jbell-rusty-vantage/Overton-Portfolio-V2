export type Blog = {
  title: string;
  description: string;
  summary?: string;
  readingTime?: number;
  publishedAt?: string;
  date: string;
  slug: string;
  image?: string;
  tags?: string[];
  mdxPath?: string;
  // rest
  [key: string]: any;
};
