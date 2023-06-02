/** @type {import('next').NextConfig} */

// const withTM = require('next-transpile-modules')([
//   '@fullcalendar/common',
//   '@babel/preset-react',
//   '@fullcalendar/common',
//   '@fullcalendar/daygrid',
//   '@fullcalendar/interaction',
//   '@fullcalendar/react',
//   '@fullcalendar/timegrid',
//   '@fullcalendar/list',
//   '@fullcalendar/timeline'
// ]);

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
    async redirects() {
    return [
      {
        source: '/',
        destination: '/apps',
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;


// {
//   nextConfig,
//   async redirects() {
//     return [
//       {
//         source: '/',
//         destination: '/auth/signIn',
//         permanent: true
//       }
//     ];
//   }
// };
