import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@coinbase/cdp-sdk",
    "@base-org/account",
    "@safe-global/safe-gateway-typescript-sdk",
    "@walletconnect/ethereum-provider"
  ]
};

export default nextConfig;
