/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable eslint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 