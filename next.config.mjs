/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to support Server Actions on Cloudflare Pages
  // Dynamic routes and Server Actions require Edge Runtime

  // Rewrites to proxy agent requests to the Worker during development
  // In production, this is handled by Cloudflare Worker Routes on the same domain
  async rewrites() {
    // Only apply rewrites in development
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    const workerUrl = process.env.WORKER_URL || 'http://localhost:8787';

    return [
      // Proxy agent WebSocket/HTTP connections
      {
        source: '/agents/:path*',
        destination: `${workerUrl}/agents/:path*`,
      },
      // Proxy the API key check endpoint
      {
        source: '/check-open-ai-key',
        destination: `${workerUrl}/check-open-ai-key`,
      },
    ];
  },
};

export default nextConfig;
