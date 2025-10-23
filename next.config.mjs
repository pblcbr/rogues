/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [],
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
