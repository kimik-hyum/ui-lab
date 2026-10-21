import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/upgrade-logs": ["../../docs/upgrade-logs/*.json"],
    "/upgrade-logs/*": ["../../docs/upgrade-logs/*.json"],
  },
};

export default nextConfig;
