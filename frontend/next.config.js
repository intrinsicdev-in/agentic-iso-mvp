/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@agentic-iso/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3003/api/:path*',
      },
    ]
  },
  // Disable strict mode for development
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    // Fix for any PDF-related canvas module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig