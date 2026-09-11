import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";
import { formatEth } from "../utils/format.js";

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const current = data?.activeAgreements.find((a) => a.status === "IN_PROGRESS") || data?.activeAgreements[0];

  return (
    <AppLayout
      title={`Welcome to Sidekick`}
      subtitle="Track your real-time payment streams, work sessions, and verified on-chain reputation."
    >
      {/* 1. Top Git CLI Alert / Quick Connect Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-white/[0.05] border border-indigo-200 dark:border-white/[0.08] flex items-center justify-center text-[#6366F1] dark:text-[#818CF8] flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" x2="20" y1="19" y2="19" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Launch local CLI watcher to stream code commits and auto-mint EAS attestations.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Run <code className="text-[#6366F1] dark:text-[#818CF8] bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">sidekick watch</code> in your project repository
            </p>
          </div>
        </div>

        {current && (
          <Link
            to={`/agreements/${current.id}/work`}
            className="h-9 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 flex-shrink-0"
          >
            Launch Work Session &rarr;
          </Link>
        )}
      </div>

      {/* 2. 3 Bento Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Card 1: Work Sessions & Proof */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Time &amp; Proof</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] text-[10px] font-mono font-medium border border-indigo-200 dark:border-indigo-500/30">
                Live
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Stream Work Sessions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Record verified git diff intervals and claim micro-payments directly from smart contract escrow.
            </p>
          </div>
          <Link
            to="/work-sessions"
            className="mt-6 w-full h-9 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center shadow-md"
          >
            View Work Sessions
          </Link>
        </div>

        {/* Card 2: Wallet & Available Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-white/[0.06] text-emerald-600 dark:text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Liquid Vault</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium border border-emerald-200 dark:border-emerald-500/30">
                Connected
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Wallet &amp; Liquidity Hub</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Manage your wallet balances, claim accrued streaming earnings, or transfer funds.
            </p>
          </div>
          <Link
            to="/wallet"
            className="mt-6 w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center shadow-sm"
          >
            Open Wallet Hub
          </Link>
        </div>

        {/* Card 3: EAS Reputation Engine */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-white/[0.06] text-[#6366F1] dark:text-[#818CF8]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">EAS Identity</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-[10px] font-mono font-medium border border-slate-200 dark:border-white/[0.1]">
                Verified
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Reputation &amp; Attestations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              View your permanent on-chain credentials, verified work sessions, and client attestations.
            </p>
          </div>
          <Link
            to="/reputation"
            className="mt-6 w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center shadow-sm"
          >
            View Reputation
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-400 mb-6">
          Unable to load dashboard data: {error}
        </div>
      )}

      {!data && !error && <LoadingGrid count={5} kind="stat" />}

      {data && (
        <>
          {/* 3. Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Active Streams" value={data.stats.activeProjects} />
            <StatCard
              label="Claimable Stream"
              value={formatEth(data.stats.claimableStreamBalance || 0)}
              tone="success"
              hint="Ready to claim"
            />
            <StatCard label="Total Earned" value={formatEth(data.stats.totalEarned)} tone="accent" />
            <StatCard
              label="Reputation Score"
              value={`${data.stats.reputationScore || 0} pts`}
              tone="warning"
              hint="EAS Verified"
            />
            <StatCard
              label="Active Work Time"
              value={`${Math.round(data.stats.activeWorkSessionsTime || 0)} min`}
              tone="default"
            />
          </div>

          {/* 4. Active Payment Streams Header & Grid */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active Payment Streams</h2>
            <Link to="/agreements" className="text-xs font-mono text-[#6366F1] dark:text-[#818CF8] hover:underline">
              View all streams &rarr;
            </Link>
          </div>

          {data.activeAgreements.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
              <EmptyState
                title="No active payment streams"
                message="You don't have any active payment streams currently. When a client hires you, the agreement will appear here."
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.activeAgreements.map((a) => (
                <ProjectCard key={a.id} agreement={a} role="FREELANCER" />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
