/** @type {import('next').NextConfig} */
const nextConfig = {
  // bcryptjs uses native Node.js crypto — must run in Node.js runtime, not Edge
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
};

export default nextConfig;
