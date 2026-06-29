import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@fikiri/ui"],
  turbopack: {
    root: join(__dirname, "..", ".."),
  },
};

export default nextConfig;
