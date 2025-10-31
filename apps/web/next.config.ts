import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["socket.io-client"] = path.resolve(
      __dirname,
      "./src/stubs/socket-io-client"
    );

    return config;
  },
};

export default nextConfig;
