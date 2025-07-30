"use client";

import Content from "./blockchain-layer2-scaling.mdx";
import { BlogLayout } from "../components/BlogLayout";

const meta = {
  title: "Blockchain Layer 2 Scaling: Polygon, Arbitrum, and Optimism Guide",
  description:
    "A comprehensive guide to Layer 2 scaling solutions including Polygon, Arbitrum, and Optimism with practical examples and best practices.",
  date: "2024-01-15",
  image: "/images/sidefolio-moonbeam-2.png",
  tags: ["blockchain", "ethereum", "layer2", "polygon", "arbitrum", "optimism"],
};

export default function BlockchainLayer2ScalingPost() {
  return (
    <BlogLayout meta={meta}>
      <Content />
    </BlogLayout>
  );
}
