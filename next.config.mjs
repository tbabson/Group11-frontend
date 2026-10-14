/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:4001';

const nextConfig = {
  // The browser calls /api/v1/* on this origin and Next forwards it to the backend,
  // so the API's CORS allowlist never gets in the way.
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
};

export default nextConfig;
