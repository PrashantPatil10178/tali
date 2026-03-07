import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tali/gemini', '@tali/types'],
};

export default nextConfig;