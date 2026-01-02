/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to support Server Actions on Cloudflare Pages
  // Dynamic routes and Server Actions require Edge Runtime
};

export default nextConfig;
