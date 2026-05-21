import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '172.19.0.0/16',  
  ],
};

export default nextConfig;
