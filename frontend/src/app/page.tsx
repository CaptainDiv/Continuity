'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();
  const [currentTab, setCurrentTab] = useState<'overview' | 'protection' | 'underwriting' | 'activity' | 'sandbox'>('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-200 flex justify-between items-center px-6">
        <div className="font-bold text-slate-900">Continuity Protocol</div>
        <ConnectButton />
      </header>
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 font-sans tracking-tight">Compliance risk, underwritten.</h1>
        <p className="text-slate-500 mt-1 text-sm">Protect lending positions against compliance defaults.</p>
      </main>
    </div>
  );
}
