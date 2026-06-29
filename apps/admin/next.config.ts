import type { NextConfig } from "next";
import { join } from "node:path";

const apiUpstream =
  process.env.API_UPSTREAM_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:7540/api/v1";

const upstreamBase = apiUpstream.replace(/\/$/, "");
const upstreamOrigin = new URL(upstreamBase).origin;

const nextConfig: NextConfig = {
  transpilePackages: ["@fikiri/ui"],
  turbopack: {
    root: join(__dirname, "..", ".."),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${upstreamBase}/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${upstreamOrigin}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
