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
  // Set the output directory for the Firebase hosting
  distDir: 'out',
  // Allow pages to be exported as static HTML
  output: 'export',
  // Needed for static export with images
  images: {
    unoptimized: true,
  },
  // Configure static export exclusions
  outputFileTracingExcludes: {
    '*': ['./api/**/*']
  }
};

module.exports = nextConfig; 