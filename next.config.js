/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // Supabase storage
      },
    ],
  },
  // Prevent pdf-parse test files from causing issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("pdf-parse");
    }
    return config;
  },
};

module.exports = nextConfig;
