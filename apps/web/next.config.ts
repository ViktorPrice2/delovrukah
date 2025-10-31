import path from "node:path";

import type { NextConfig } from "next";

const socketIoClientStubPath = path.resolve(
  __dirname,
  "./src/stubs/socket-io-client"
);

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "socket.io-client": socketIoClientStubPath,
    },
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["socket.io-client"] = socketIoClientStubPath;

    return config;
  },
};

export default nextConfig;
