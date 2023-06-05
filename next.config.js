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
  webpack(config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack },) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    config.ignoreWarnings =  [{
      message: /Serializing big strings/,
    },
    (warning) => false  ,

  ]
    return config;
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


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,

    org: "talentorg",
    project: "aifactory",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
);
