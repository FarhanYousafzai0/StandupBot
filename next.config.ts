import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  /**
   * In dev, the browser only talks to Next (3000). /api is proxied to Express (5000),
   * avoiding CORS and ERR_CONNECTION_REFUSED when the user does not call :5000 directly.
   * In production builds, rewrites are off unless API_PROXY_TARGET is set (e.g. local `next start` + API).
   */
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    const target = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:5000";
    if (!isDev && !process.env.API_PROXY_TARGET) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
