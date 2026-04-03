/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@trustilock/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
