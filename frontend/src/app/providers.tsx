'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

const queryClient = new QueryClient();

// Use a mock walletconnect project ID for demo purposes
const config = getDefaultConfig({
  appName: 'Continuity',
  projectId: 'a29b4eaf189c4ad1b78297b830d1d69d',
  chains: [monadTestnet],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({
          accentColor: '#0B1222',
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}>
          {mounted ? children : <div className="min-h-screen bg-background-custom"></div>}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
