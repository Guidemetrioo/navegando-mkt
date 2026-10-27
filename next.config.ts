import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{source:'/:path*',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Referrer-Policy',value:'no-referrer'},
      {key:'Permissions-Policy',value:'camera=(self), geolocation=(self), microphone=()'},
      {key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'},
    ]}];
  },
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ['192.168.15.104', 'localhost:3000'],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
