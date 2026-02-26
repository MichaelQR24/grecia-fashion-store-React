import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // Prevents clickjacking
          { key: 'X-XSS-Protection', value: '1; mode=block' }, // Enables XSS filtering in older browsers
          { key: 'X-Content-Type-Options', value: 'nosniff' }, // Disables MIME sniffing
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, // Protects referrer info
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' }
        ],
      },
    ]
  },
};

export default nextConfig;
