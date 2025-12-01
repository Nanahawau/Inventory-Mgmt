/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // If you need env at build/runtime:
  // env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL },
};

export default nextConfig;