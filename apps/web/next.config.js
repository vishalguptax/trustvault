/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@trustvault/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
