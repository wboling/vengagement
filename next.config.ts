import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', '@neondatabase/serverless', 'pdf-parse', 'ws', 'dotenv', 'pdfkit', 'unzipper'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
