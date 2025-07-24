/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "books.google.com",
        port: "",
        pathname: "/books/content/**",
      },
      {
        protocol: "http",
        hostname: "books.google.com",
        port: "",
        pathname: "/books/content/**",
      },
    ],
  },
};

export default nextConfig;
