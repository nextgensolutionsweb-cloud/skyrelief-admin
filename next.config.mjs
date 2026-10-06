/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/agent-requests',
        destination: '/admin/agent-requests',
      },
      {
        source: '/requests',
        destination: '/admin/requests',
      },
      {
        source: '/sessions',
        destination: '/admin/sessions',
      },
    ];
  },
};

export default nextConfig;
