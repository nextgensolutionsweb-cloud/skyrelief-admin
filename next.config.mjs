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
  async redirects() {
    return [
      {
        source: '/payments',
        destination: '/more-collection/campaigns',
        permanent: false,
      },
      {
        source: '/admin/payment-requests',
        destination: '/more-collection/payment-requests',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
