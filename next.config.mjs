/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/form',
        destination: '/form',
        permanent: true,
      },
      {
        source: '/dashboard/requests/:id',
        destination: '/requests/:id',
        permanent: true,
      },
      {
        source: '/server/status',
        destination: '/status',
        permanent: true,
      },
      {
        source: '/admin/manage',
        destination: '/admin/attachments',
        permanent: true,
      },
      {
        source: '/admin/manage/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
