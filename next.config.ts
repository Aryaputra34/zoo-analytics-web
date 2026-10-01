import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep the dev badge away from the sidebar's live-refresh button
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
