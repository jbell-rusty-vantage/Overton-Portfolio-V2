/** Canonicals never trust a visitor's Host header. */
export const publicOrigin = process.env.LIBRARY_PUBLIC_ORIGIN || "https://overton-portfolio-v2.vercel.app";
