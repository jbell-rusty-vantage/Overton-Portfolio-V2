import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: static shells + streamed dynamic holes (see node_modules/next/dist/docs).
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // MDX + inline images go through a Server Action; Vercel caps request bodies at 4.5 MB.
      // Large media (video, GLB) uses presigned client uploads straight to Blob instead.
      bodySizeLimit: "4mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
