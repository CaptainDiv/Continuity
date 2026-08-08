'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected, address } = useAccount();

  // Tab State
  const [currentTab, setCurrentTab] = useState<'overview' | 'protection' | 'underwriting' | 'activity' | 'sandbox'>('overview');
  // Activity Sub-tab: 'list' (Screen 5) or 'detail' (Screen 4)
  const [activitySubTab, setActivitySubTab] = useState<'list' | 'detail'>('list');

  // Simulator / Mock State
  const [isCviVerified, setIsCviVerified] = useState<boolean>(true);
  const [poolReserves, setPoolReserves] = useState<number>(250000);
  const [outstandingCoverage, setOutstandingCoverage] = useState<number>(135000);
  const [policyStatus, setPolicyStatus] = useState<'ACTIVE' | 'TRIGGERED' | 'EXPIRED'>('ACTIVE');

  // Staking Positions
  const [userDeposit, setUserDeposit] = useState<number>(12500);
  const [userEarnings, setUserEarnings] = useState<number>(450);
  const [userWithdrawable, setUserWithdrawable] = useState<number>(12950);
  const [userShare, setUserShare] = useState<number>(5.00);

  // Modals
  const [protectModalOpen, setProtectModalOpen] = useState<boolean>(false);
  const [activeLoanId, setActiveLoanId] = useState<number | null>(null);
  const [activeLoanBalance, setActiveLoanBalance] = useState<number>(0);
  const [inputCoverage, setInputCoverage] = useState<number>(20000);

  const [underwriteModalOpen, setUnderwriteModalOpen] = useState<boolean>(false);
  const [undActionType, setUndActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [inputUnderwriteAmount, setInputUnderwriteAmount] = useState<string>('');

  // Dynamically computed metrics
  const availableCapital = poolReserves - outstandingCoverage;
  const solvencyRatio = outstandingCoverage > 0 ? Math.round((poolReserves / outstandingCoverage) * 100) : 9999;

  const calculatePremiumQuote = () => {
    return (inputCoverage * 2.5) / 100;
  };

  // Format Helpers
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatCVA = (val: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  // Static Mock Audit Logs (Screen 5)
  const mockAuditLogs = [
    {
      time: "2023-10-27 14:32:01",
      title: "Policy #104 purchased",
      icon: "assignment",
      iconColor: "text-purple-700",
      addr1: "0x71C...3E9",
      addr2: "0xab12...c3d4",
      amount: null,
      type: "purchase"
    },
    {
      time: "2023-10-27 12:15:44",
      title: "CVI status verified",
      icon: "verified_user",
      iconColor: "text-[#2E7D32]",
      addr1: "Institutional Lender Alpha",
      addr2: "0x9876...5432",
      amount: null,
      type: "status"
    },
    {
      time: "2023-10-26 09:41:12",
      title: "CVI revoked",
      icon: "warning",
      iconColor: "text-red-600",
      addr1: "0x82...A91",
      addr2: "0xeef12...69ab",
      amount: null,
      type: "revocation"
    },
    {
      time: "2023-10-25 16:55:00",
      title: "Compliance trigger confirmed",
      icon: "notifications_active",
      iconColor: "text-purple-700",
      addr1: "Oracle Node #4",
      addr2: "0x5544...3322",
      amount: null,
      type: "trigger"
    },
    {
      time: "2023-10-25 17:01:22",
      title: "Payout sent to lender",
      icon: "payments",
      iconColor: "text-[#2E7D32]",
      addr1: "Institutional Lender Alpha",
      addr2: "0xeccbb...aa99",
      amount: "$20,000.00",
      type: "payout"
    }
  ];

  // Actions
  const handleOpenProtectModal = (loanId: number, balance: number) => {
    setActiveLoanId(loanId);
    setActiveLoanBalance(balance);
    setInputCoverage(20000);
    setProtectModalOpen(true);
  };

  const confirmProtection = () => {
    const cover = inputCoverage;
    if (cover <= 0) return alert("Please enter a valid coverage amount.");
    if (cover > activeLoanBalance) return alert(`Coverage cannot exceed outstanding balance of ${formatUSD(activeLoanBalance)}.`);

    setProtectModalOpen(false);
    setOutstandingCoverage(prev => prev + cover);
    setPolicyStatus('ACTIVE');
    setCurrentTab('overview');
    alert("Transaction complete: Policy purchased successfully!");
  };

  const handleOpenUnderwriteAction = (type: 'deposit' | 'withdraw') => {
    setUndActionType(type);
    setInputUnderwriteAmount('');
    setUnderwriteModalOpen(true);
  };

  const submitUnderwriteAction = () => {
    const amount = parseFloat(inputUnderwriteAmount) || 0;
    if (amount <= 0) return alert('Please enter a valid amount.');

    if (undActionType === 'deposit') {
      const nextReserves = poolReserves + amount;
      const nextDeposit = userDeposit + amount;
      setPoolReserves(nextReserves);
      setUserDeposit(nextDeposit);
      setUserWithdrawable(nextDeposit + userEarnings);
      setUserShare((nextDeposit / nextReserves) * 100);
    } else {
      if (amount > userWithdrawable) return alert('Insufficient balance.');
      if ((poolReserves - amount) < outstandingCoverage) {
        return alert('Reverted: Solvency limit violated. You cannot unlock capital actively pledged to active policies.');
      }
      const nextReserves = poolReserves - amount;
      const nextDeposit = userDeposit - amount;
      setPoolReserves(nextReserves);
      setUserDeposit(nextDeposit);
      setUserWithdrawable(nextDeposit + userEarnings);
      setUserShare(nextReserves > 0 ? (nextDeposit / nextReserves) * 100 : 0);
    }
    setUnderwriteModalOpen(false);
  };

  // Sandbox Triggers
  const toggleBorrowerCvi = () => {
    setIsCviVerified(prev => !prev);
  };

  const triggerPayoutSim = () => {
    if (policyStatus !== 'ACTIVE') return alert('No active protection to payout.');
    if (isCviVerified) {
      return alert('Compliance Oracle Check: Payout cannot execute while Borrower CVI is still verified. Revoke Borrower credential in Sandbox first.');
    }
    setPoolReserves(prev => prev - 20000);
    setOutstandingCoverage(prev => prev - 20000);
    setPolicyStatus('TRIGGERED');
    setCurrentTab('activity');
    setActivitySubTab('detail');
    alert("Claim paid out successfully! $20,000 sent to Lender. Pool acquires subrogated debt claim.");
  };

  const triggerExpirySim = () => {
    if (policyStatus !== 'ACTIVE') return alert('No active protection to expire.');
    setOutstandingCoverage(prev => prev - 20000);
    setPolicyStatus('EXPIRED');
    setCurrentTab('overview');
    alert("Loan fully repaid. Policy expired and locked capital released back to underwriters.");
  };

  // Theme Helpers
  const getDesktopNavClass = (tabId: typeof currentTab) => {
    if (tabId === 'sandbox') {
      return currentTab === 'sandbox'
        ? "text-purple-700 bg-purple-100 font-bold transition-colors px-3 py-2 rounded-lg flex items-center gap-1 border border-purple-300"
        : "text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors px-3 py-2 rounded-lg flex items-center gap-1 border border-purple-200";
    }
    return currentTab === tabId
      ? "text-primary-dark font-bold bg-slate-50 transition-colors px-3 py-2 rounded-lg cursor-pointer"
      : "text-on-surface-variant hover:bg-slate-50 hover:text-primary-dark transition-colors px-3 py-2 rounded-lg cursor-pointer";
  };

  const getMobileNavClass = (tabId: typeof currentTab) => {
    return currentTab === tabId
      ? "flex flex-col items-center justify-center text-primary-dark p-2 w-16 cursor-pointer bg-slate-50/50 rounded-lg"
      : "flex flex-col items-center justify-center text-tertiary-dark p-2 w-16 cursor-pointer";
  };

  let heroTitle = "";
  let heroSubtitle = "";
  if (currentTab === 'overview') {
    heroTitle = "Compliance risk, underwritten.";
    heroSubtitle = "Protect lending positions against the financial impact of verified compliance events.";
  } else if (currentTab === 'protection') {
    heroTitle = "Protection Portfolio";
    heroSubtitle = "Protect a verified lending position against compliance-event risk.";
  } else if (currentTab === 'underwriting') {
    heroTitle = "Underwriting Staking";
    heroSubtitle = "Provide liquidity to underwrite compliance-event risk and earn premium yields.";
  }

  return (
    <>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-white border-b border-outline-variant shadow-sm animate-fade-in">
        <div className="flex items-center cursor-pointer" onClick={() => setCurrentTab('overview')}>
          <img alt="Continuity Logo" className="h-14 md:h-16 w-auto max-h-none py-1.5 transition-transform hover:scale-102" src="/image.png"/>
        </div>
        <div className="flex items-center gap-stack-md hidden md:flex text-on-surface-variant font-semibold text-sm tracking-wide">
          <a className={getDesktopNavClass('overview')} onClick={() => setCurrentTab('overview')}>Overview</a>
          <a className={getDesktopNavClass('protection')} onClick={() => setCurrentTab('protection')}>Protection</a>
          <a className={getDesktopNavClass('underwriting')} onClick={() => setCurrentTab('underwriting')}>Underwriting</a>
          <a className={getDesktopNavClass('activity')} onClick={() => { setCurrentTab('activity'); setActivitySubTab('list'); }}>Activity Feed</a>
          <a className={getDesktopNavClass('sandbox')} onClick={() => setCurrentTab('sandbox')}>
            <span className="material-symbols-outlined text-sm">construction</span> Sandbox Demo
          </a>
        </div>
        <div className="flex items-center gap-stack-sm scale-90 md:scale-100">
          <ConnectButton showBalance={false} />
          {isCviVerified ? (
            <div className="flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-full border border-[#C8E6C9]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">CVI Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-200">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">CVI REVOKED</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Containers */}
      <main className="pt-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-stack-lg pb-12">
        {/* Dynamic Header */}
        {currentTab !== 'activity' && currentTab !== 'sandbox' && (
          <section className="mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-2 tracking-tight">{heroTitle}</h1>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl">{heroSubtitle}</p>
          </section>
        )}

        {/* Tab 1: Overview */}
        {currentTab === 'overview' && (
          <div className="space-y-stack-lg animate-fade-in">
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <span className="text-xs uppercase font-semibold text-tertiary-dark mb-2">Pool Reserves</span>
                <span className="text-3xl font-bold text-primary-dark">{formatUSD(poolReserves)}</span>
              </div>
              <div className="glass-card p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <span className="text-xs uppercase font-semibold text-tertiary-dark mb-2">Active Coverage</span>
                <span className="text-3xl font-bold text-primary-dark">{formatUSD(outstandingCoverage)}</span>
              </div>
              <div className="glass-card p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <span className="text-xs uppercase font-semibold text-tertiary-dark mb-2">Available Capital</span>
                <span className="text-3xl font-bold text-primary-dark">{formatUSD(availableCapital)}</span>
              </div>
              <div className="bg-primary-dark text-white p-5 rounded-xl flex flex-col justify-between shadow-md relative overflow-hidden">
                <span className="text-xs uppercase font-semibold opacity-75 mb-2 z-10">Solvency Ratio</span>
                <span className="text-3.5xl font-bold z-10">{solvencyRatio}%</span>
                <div className="absolute right-2 bottom-0 opacity-10 pointer-events-none text-8xl leading-none">
                  <span className="material-symbols-outlined text-6xl">analytics</span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-primary-dark pb-1">Active Monitoring</h2>
                <div className="glass-card rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs uppercase text-tertiary-dark block">Watched Borrower</span>
                      <span className="text-lg font-bold text-primary-dark">0x82...A91</span>
                    </div>
                    {isCviVerified ? (
                      <div className="flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-sm border border-[#C8E6C9]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></div>
                        <span className="text-xs font-bold uppercase tracking-wider">CVI Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-sm border border-red-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                        <span className="text-xs font-bold uppercase tracking-wider">REVOKED</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded border border-outline-variant">
                    <div>
                      <span className="text-[11px] uppercase text-outline font-bold tracking-wide block">Trigger Event</span>
                      <span className="text-sm font-semibold text-primary-dark">CVI Revocation</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-outline font-bold tracking-wide block">Current Status</span>
                      {isCviVerified ? (
                        <span className="text-sm font-semibold text-primary-dark flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#2E7D32] animate-spin">radar</span>
                          Active Monitoring
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-primary-dark flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-red-600">error</span>
                          Default Triggered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                <h2 className="text-xl font-bold text-primary-dark pb-1">Featured Policy</h2>
                <div className="glass-card rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant flex justify-between items-center">
                    <span className="text-sm font-bold text-primary-dark">Policy #0042</span>
                    {policyStatus === 'ACTIVE' ? (
                      <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">ACTIVE</span>
                    ) : policyStatus === 'TRIGGERED' ? (
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">TRIGGERED</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border">EXPIRED</span>
                    )}
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark">Lending Loan</span>
                      <span className="font-semibold text-primary-dark">#104</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark">Outstanding Balance</span>
                      <span className="font-semibold text-primary-dark">$25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark">Protected Amount</span>
                      <span className="font-semibold text-primary-dark">$20,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark">Coverage Ratio</span>
                      <span className="font-semibold text-primary-dark">80%</span>
                    </div>
                    <div className="flex justify-between border-t pt-3 mt-1">
                      <span className="text-primary-dark font-bold">Premium Paid</span>
                      <span className="text-md font-bold text-primary-dark">$400 CVA</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Tab 2: Protection */}
        {currentTab === 'protection' && (
          <div className="space-y-stack-lg animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-primary-dark pb-1">Insurable Loans</h2>
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-tertiary-dark uppercase font-semibold">Loan Record</span>
                        <h3 className="text-lg font-bold text-primary-dark">Loan #104</h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
                        80% Insurable Limit
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-medium">
                      <div>
                        <span className="text-xs text-tertiary-dark block">Borrower Address</span>
                        <span className="font-mono text-xs font-semibold">0x82...A91</span>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary-dark block">Outstanding Balance</span>
                        <span className="font-semibold font-mono text-sm">$25,000</span>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary-dark block">Protective Limit</span>
                        <span className="font-semibold text-sm">$20,000</span>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary-dark block">Protection Status</span>
                        {policyStatus === 'ACTIVE' ? (
                          <span className="font-semibold text-sm text-[#2E7D32] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span> Protected
                          </span>
                        ) : policyStatus === 'TRIGGERED' ? (
                          <span className="font-semibold text-sm text-red-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Claim Triggered
                          </span>
                        ) : (
                          <span className="font-semibold text-sm text-slate-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Expired (Repaid)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      {policyStatus === 'ACTIVE' ? (
                        <button disabled className="bg-surface-container border border-outline-variant text-[#6B7280] font-bold text-xs py-2.5 px-4 rounded-lg cursor-not-allowed">
                          Protected
                        </button>
                      ) : (
                        <button onClick={() => handleOpenProtectModal(104, 25000)} className="bg-primary-dark hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer">
                          Protect Loan
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-5 shadow-sm space-y-4 opacity-90">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-tertiary-dark uppercase font-semibold">Loan Record</span>
                        <h3 className="text-lg font-bold text-primary-dark">Loan #095</h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                        Protected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-medium">
                      <div>
                        <span className="text-xs text-tertiary-dark block">Borrower Address</span>
                        <span className="font-mono text-xs font-semibold">0x3A...BD2</span>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary-dark block">Outstanding Balance</span>
                        <span className="font-semibold font-mono text-sm">$12,500</span>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary-dark block">Coverage Active</span>
                        <span className="font-semibold text-sm">$12,500</span>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary-dark block">Protection Status</span>
                        <span className="font-semibold text-sm text-[#2E7D32] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span> Protected
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button disabled className="bg-surface-container border border-outline-variant text-[#6B7280] font-bold text-xs py-2.5 px-4 rounded-lg cursor-not-allowed">
                        Fully Insured
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                <h2 className="text-xl font-bold text-primary-dark pb-1 font-semibold">Protection Details</h2>
                <div className="glass-card rounded-xl p-5 shadow-sm space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark font-medium">Coverage Ratio</span>
                      <span className="font-semibold text-primary-dark">80% of loan balance</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark font-medium">Premium Rate</span>
                      <span className="font-semibold text-primary-dark">2.5% of coverage (Annual)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark font-medium">Waiting Cooldown</span>
                      <span className="font-semibold text-primary-dark">14 Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark font-medium">Policy Activation</span>
                      <span className="font-semibold text-primary-dark">Immediate</span>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-sm text-slate-500 mt-0.5">info</span>
                    <span>Coverage is capped by the loan's contract-verified outstanding balance.</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Tab 3: Underwriting */}
        {currentTab === 'underwriting' && (
          <div className="space-y-stack-lg animate-fade-in">
            <h2 className="text-xl font-bold text-primary-dark pb-1">Underwriting Pool</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-4">
                <div className="glass-card rounded-xl p-6 shadow-sm space-y-5">
                  <h3 className="text-lg font-bold text-primary-dark pb-1">Global Pool Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-surface-container-low p-4 rounded-lg border">
                      <span className="text-xs uppercase text-tertiary-dark font-semibold">Total Reserves</span>
                      <span className="text-2xl font-bold text-primary-dark block mt-1">{formatUSD(poolReserves)} CVA</span>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-lg border">
                      <span className="text-xs uppercase text-tertiary-dark font-semibold">Active Coverage</span>
                      <span className="text-2xl font-bold text-primary-dark block mt-1">{formatUSD(outstandingCoverage)} CVA</span>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-lg border border-l-4 border-l-[#2E7D32]">
                      <span className="text-xs uppercase text-tertiary-dark font-semibold">Solvency Ratio</span>
                      <span className="text-2xl font-bold text-[#2E7D32] block mt-1">{solvencyRatio}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-[#FFF8E1] p-3 rounded-lg border border-[#FFE082] text-xs text-[#E65100]">
                    <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                    <span>Withdrawals are restricted when they would cause pool reserves to fall below required covered liabilities.</span>
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                <div className="glass-card rounded-xl p-5 shadow-sm space-y-5">
                  <h3 className="text-lg font-bold text-primary-dark pb-1">Your Position</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark font-medium">Deposited CVA</span>
                      <span className="font-mono font-bold text-primary-dark">{formatCVA(userDeposit)} CVA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark font-medium">Pool Share</span>
                      <span className="font-semibold text-primary-dark">{userShare.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-dark font-medium">Premium Earnings</span>
                      <span className="font-semibold text-[#2E7D32] font-semibold">+{formatCVA(userEarnings)} CVA</span>
                    </div>
                    <div className="flex justify-between border-t pt-3 font-semibold">
                      <span className="text-primary-dark">Withdrawable</span>
                      <span className="font-mono font-bold text-primary-dark">{formatCVA(userWithdrawable)} CVA</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenUnderwriteAction('deposit')} className="bg-primary-dark hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer">
                      Deposit CVA
                    </button>
                    <button onClick={() => handleOpenUnderwriteAction('withdraw')} className="bg-white border border-outline hover:bg-slate-50 text-primary-dark font-bold text-xs py-2.5 rounded-lg cursor-pointer">
                      Withdraw
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Tab 4: Activity Feed (Screens 4 & 5) */}
        {currentTab === 'activity' && (
          <div className="space-y-6 animate-fade-in">
            {activitySubTab === 'list' ? (
              // Screen 5: Institutional Activity
              <div className="space-y-5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-bold text-primary-dark tracking-tight">Institutional Activity</h2>
                  <p className="text-sm text-tertiary-dark">Real-time audit log of platform events and transactions.</p>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {mockAuditLogs.map((log, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (log.type === 'payout' || log.type === 'revocation' || log.type === 'trigger') {
                          setActivitySubTab('detail');
                        }
                      }}
                      className="glass-card rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow flex items-start justify-between border border-slate-100"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center ${log.iconColor}`}>
                          <span className="material-symbols-outlined text-lg leading-none">{log.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-tertiary-dark font-bold uppercase tracking-wider">{log.time}</span>
                          <span className="text-sm font-bold text-primary-dark mt-0.5">{log.title}</span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
                            <span>{log.addr1}</span>
                            <span>-</span>
                            <span>{log.addr2}</span>
                          </div>
                        </div>
                      </div>
                      
                      {log.amount && (
                        <div className="flex flex-col items-end justify-center">
                          <span className="text-sm font-bold text-primary-dark">{log.amount}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Value</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Screen 4: Compliance Event Triggered
              <div className="space-y-6 max-w-xl mx-auto">
                <button
                  onClick={() => setActivitySubTab('list')}
                  className="flex items-center gap-1.5 text-xs text-primary-dark font-bold bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back to Activity Logs
                </button>

                <div className="glass-card rounded-xl p-5 border border-slate-150 shadow-md bg-white space-y-6">
                  {/* Custom Banner Header */}
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm tracking-tight text-primary-dark">link</span>
                        <span className="font-extrabold text-sm tracking-tight text-primary-dark uppercase">Continuity</span>
                      </div>
                      <span className="text-[9px] bg-red-150 text-red-700 font-extrabold tracking-wider border border-red-200 rounded px-1.5 py-0.5 leading-none">
                        Hackathon Demo Environment
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-600 scale-105">
                        <span className="material-symbols-outlined text-2xl font-bold">warning</span>
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-xl md:text-2xl font-extrabold text-red-600 mb-1 tracking-tight">Compliance Event Triggered</h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Demonstrating the automated policy enforcement and subrogation process upon CVI revocation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Red Identity Block */}
                  <div className="bg-red-50/70 border border-red-200/90 rounded-xl p-4 flex gap-4 items-start">
                    <div className="p-2 bg-red-650 text-white rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">block</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-xs font-black uppercase text-red-700 tracking-wider">CVI REVOKED</h4>
                        <p className="text-[10px] text-red-600 font-semibold mt-0.5">Identity verification failed. Sanctions check triggered.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="bg-white border border-red-200/70 rounded px-2.5 py-1 text-center flex items-center gap-1.5 shadow-sm">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Status</span>
                          <span className="text-[10.5px] font-black text-slate-800">Loan FROZEN</span>
                        </div>
                        <div className="bg-white border border-red-200/70 rounded px-2.5 py-1 text-center flex items-center gap-1.5 shadow-sm">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Action</span>
                          <span className="text-[10.5px] font-black text-slate-800">Policy TRIGGERED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stepper block */}
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 text-center">Policy Lifecycle Execution</h3>
                    
                    <div className="relative pl-10 space-y-5 text-xs font-bold text-slate-500">
                      {/* Vertical line indicator */}
                      <div className="absolute left-[17px] top-[14px] bottom-[14px] w-[2px] border-l-2 border-dashed border-slate-200"></div>

                      <div className="relative flex items-center gap-3">
                        <div className="absolute -left-[35px] w-[34px] h-[34px] bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined text-base">shopping_cart</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-slate-700">Policy Purchased</span>
                      </div>

                      <div className="relative flex items-center gap-3">
                        <div className="absolute -left-[35px] w-[34px] h-[34px] bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                          <span className="material-symbols-outlined text-base">hourglass_empty</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-slate-700">Waiting Period</span>
                      </div>

                      <div className="relative flex items-center gap-3">
                        <div className="absolute -left-[35px] w-[34px] h-[34px] bg-slate-800 rounded-full border border-slate-900 flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-base">verified_user</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-slate-800">Protection Active</span>
                      </div>

                      <div className="relative flex items-center gap-3">
                        <div className="absolute -left-[35px] w-[34px] h-[34px] bg-red-600 rounded-full border border-red-700 flex items-center justify-center text-white shadow-md animate-pulse">
                          <span className="material-symbols-outlined text-base">directions_run</span>
                        </div>
                        <span className="text-[11.5px] font-black text-red-600">CVI Revoked / Trigger Confirmed</span>
                      </div>

                      <div className="relative flex items-center gap-3">
                        <div className="absolute -left-[35px] w-[34px] h-[34px] bg-slate-800 rounded-full border border-slate-900 flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-base">gps_fixed</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-slate-800">Loan Frozen</span>
                      </div>

                      <div className="relative flex items-center gap-3">
                        <div className="absolute -left-[35px] w-[34px] h-[34px] bg-[#E8F5E9] border border-outline-variant rounded-lg flex items-center justify-center text-[#2E7D32]">
                          <span className="material-symbols-outlined text-base">wallet</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-slate-800">Payout Triggered</span>
                      </div>

                      <div className="relative flex items-center gap-3">
                        <div className="absolute -left-[35px] w-[34px] h-[34px] bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined text-base">account_balance</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-slate-700">Subrogation Recorded</span>
                      </div>
                    </div>
                  </div>

                  {/* Lender reimbursement processed card */}
                  <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-1">
                    <span className="text-[10px] text-tertiary-dark uppercase font-extrabold tracking-wider">Lender Reimbursement Processed</span>
                    <h3 className="text-3xl font-extrabold text-slate-850">$20,000 PAID</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold pt-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">check_circle</span>
                      <span>Funds successfully routed via Oracle</span>
                    </div>
                  </div>

                  {/* Console container */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-[11px] text-tertiary-dark font-extrabold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-base">terminal</span>
                      <span>Real-time Oracle Feed</span>
                    </div>
                    <div className="bg-slate-950 text-red-500 p-4 rounded-xl font-mono text-[11px] leading-relaxed shadow-inner space-y-1.5 select-all border border-slate-850">
                      <div className="text-red-400/90 font-bold">&gt; CVI_STATUS_TEST : ACTIVE (for 0x82...)</div>
                      <div className="text-red-400/90 font-bold">&gt; TRIGGER_EVAL : TRUE</div>
                      <div className="text-red-400/90 font-bold">&gt; EXECUTION SMART CONTRACT : RESOLVE ... OK</div>
                      <div className="text-red-400/90 font-bold">&gt; SUBROGATIVE TRANSFER : $20,000 CVA</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Sandbox (demo triggers) */}
        {currentTab === 'sandbox' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in select-none">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-lg">
              <span className="material-symbols-outlined text-purple-750">science</span>
              <span>Hackathon Simulator & Admin Engine</span>
            </div>
            <p className="text-purple-700 text-sm font-medium">Use this dashboard to run mock simulations. Switch compliance states or simulate a borrower default/recovery to test on-chain logic visual effects.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-white p-4 rounded-lg border border-purple-100 space-y-4">
                <h3 className="font-bold text-primary-dark text-sm">1. CVI Identity Oracle simulation</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-tertiary-dark uppercase font-semibold">Borrower Wallet (0x82...A91)</span>
                    <div className="flex items-center gap-1 mt-1">
                      {isCviVerified ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></div>
                          <span className="text-xs font-bold text-[#2E7D32] uppercase">Verified</span>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                          <span className="text-xs font-bold text-red-600 uppercase">Revocation Triggered</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={toggleBorrowerCvi} className={isCviVerified ? "bg-red-650 hover:bg-red-750 text-white font-bold text-xs py-2 px-3 rounded shadow-sm cursor-pointer" : "bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-2 px-3 rounded shadow-sm cursor-pointer"}>
                    {isCviVerified ? 'Revoke Borrower Credential' : 'Restore Borrower CVI'}
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-purple-100 space-y-4">
                <h3 className="font-bold text-primary-dark text-sm">2. Claims Payout & Expiry Trigger</h3>
                <div className="space-y-2">
                  <button
                    disabled={policyStatus !== 'ACTIVE'}
                    onClick={triggerPayoutSim}
                    className={policyStatus === 'ACTIVE' ? "w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer" : "w-full bg-slate-300 text-slate-500 font-bold text-xs py-2.5 rounded cursor-not-allowed flex items-center justify-center gap-1"}
                  >
                    <span className="material-symbols-outlined text-sm">notifications_active</span> Trigger Oracle Payout (Policy #0042)
                  </button>
                  <button
                    disabled={policyStatus !== 'ACTIVE'}
                    onClick={triggerExpirySim}
                    className={policyStatus === 'ACTIVE' ? "w-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer" : "w-full bg-slate-300 text-slate-500 font-bold text-xs py-2.5 rounded cursor-not-allowed flex items-center justify-center gap-1"}
                  >
                    <span className="material-symbols-outlined text-sm">schedule_send</span> Repay Loan & Expire Policy (#0042)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-white border-t border-outline-variant py-2 shadow-lg select-none px-4">
        <a id="mob-overview" onClick={() => setCurrentTab('overview')} className={getMobileNavClass('overview')}>
          <span className="material-symbols-outlined !text-lg">grid_view</span>
          <span className="text-[9px] font-bold mt-0.5">Overview</span>
        </a>
        <a id="mob-protection" onClick={() => setCurrentTab('protection')} className={getMobileNavClass('protection')}>
          <span className="material-symbols-outlined !text-lg">shield</span>
          <span className="text-[9px] font-bold mt-0.5">Protection</span>
        </a>
        <a id="mob-underwriting" onClick={() => setCurrentTab('underwriting')} className={getMobileNavClass('underwriting')}>
          <span className="material-symbols-outlined !text-lg">edit_note</span>
          <span className="text-[9px] font-bold mt-0.5">Underwrite</span>
        </a>
        <a id="mob-activity" onClick={() => { setCurrentTab('activity'); setActivitySubTab('list'); }} className={getMobileNavClass('activity')}>
          <span className="material-symbols-outlined !text-lg">history</span>
          <span className="text-[9px] font-bold mt-0.5">Activity</span>
        </a>
      </nav>

      {/* Modals */}
      {protectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-primary-dark">Purchase Protection</h3>
            <p className="text-sm text-tertiary-dark">You are purchasing a Parametric Credit Default protection for Loan ID <span className="font-bold text-primary-dark">#{activeLoanId}</span>.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase text-tertiary-dark font-bold mb-1">Max Insurable Cover</label>
                <div className="relative rounded-lg border bg-slate-50 p-2.5 font-bold font-mono text-primary-dark">
                  $20,000 / {formatUSD(activeLoanBalance)} USD
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase text-tertiary-dark font-bold mb-1">Enter Requested Coverage</label>
                <input
                  type="number"
                  value={inputCoverage}
                  onChange={(e) => setInputCoverage(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-outline focus:border-purple-600 focus:ring-1 focus:ring-purple-600 block p-2.5 font-mono"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-tertiary-dark font-medium">Est. Premium (2.5%):</span>
                  <span className="font-semibold text-primary-dark">{formatUSD(calculatePremiumQuote())} CVA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary-dark font-medium">Waiting Period:</span>
                  <span className="font-semibold text-primary-dark">14 days</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setProtectModalOpen(false)} className="bg-white border hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmProtection} className="bg-primary-dark hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {underwriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-primary-dark">
              {undActionType === 'deposit' ? 'Deposit CVA' : 'Withdraw CVA'}
            </h3>
            <div>
              <label className="block text-xs uppercase text-tertiary-dark font-bold mb-1">CVA Amount</label>
              <input
                type="number"
                placeholder="Enter amount..."
                value={inputUnderwriteAmount}
                onChange={(e) => setInputUnderwriteAmount(e.target.value)}
                className="w-full rounded-lg border border-outline p-2.5 font-mono"
              />
            </div>
            {undActionType === 'withdraw' && (
              <div className="flex gap-2 bg-[#FFF8E1] p-3 rounded-lg border border-[#FFE082] text-xs text-[#E65100]">
                <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                <span>Unstaking is restricted if it causes pool Reserves to drop below active liabilities.</span>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setUnderwriteModalOpen(false)} className="bg-white border hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={submitUnderwriteAction} className="bg-primary-dark hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
