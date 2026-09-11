import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatEth } from "../utils/format.js";

export default function StreamingMeter({
  agreement,
  isFreelancer,
  onClaim,
  claiming,
}) {
  const [liveEarned, setLiveEarned] = useState(agreement?.earnedAmount || 0);

  const budget = agreement?.budget || 0;
  const ratePerSec = Number(agreement?.ratePerSecond || 0);
  const totalWithdrawn = Number(agreement?.totalWithdrawn || 0);
  const sessionStatus = agreement?.session?.status || "IDLE";
  const isSessionRunning = sessionStatus === "RUNNING";
  const isStreaming = isSessionRunning && agreement?.status === "IN_PROGRESS";
  const isPaused = agreement?.status === "PAUSED" || sessionStatus === "PAUSED";
  const isCompleted = agreement?.status === "COMPLETED";

  useEffect(() => {
    setLiveEarned(agreement?.earnedAmount || 0);

    if (!isStreaming || ratePerSec <= 0) return;

    const interval = setInterval(() => {
      setLiveEarned((prev) => {
        const next = prev + ratePerSec;
        return Math.min(budget, Math.round(next * 1000000) / 1000000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agreement?.earnedAmount, isStreaming, ratePerSec, budget]);

  const liveAvailable = Math.max(0, Math.round((liveEarned - totalWithdrawn) * 10000) / 10000);
  const claimedPercent = budget > 0 ? Math.min(100, Math.round((totalWithdrawn / budget) * 100)) : 0;
  const availablePercent = budget > 0 ? Math.min(100 - claimedPercent, Math.round((liveAvailable / budget) * 100)) : 0;
  const remainingPercent = Math.max(0, 100 - claimedPercent - availablePercent);

  const ratePerHr = ratePerSec * 3600;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#141414] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white relative overflow-hidden shadow-sm dark:shadow-2xl">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#6366F1]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4 flex-wrap mb-4 font-mono">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {isStreaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isStreaming
                  ? "bg-emerald-500"
                  : isPaused
                  ? "bg-amber-500"
                  : isCompleted
                  ? "bg-[#6366F1]"
                  : "bg-slate-400"
              }`}
            />
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
            {isStreaming
              ? "Live Work Tracking & Stream Active"
              : isPaused
              ? "Stream Paused"
              : isCompleted
              ? "Stream Fully Settled"
              : "Stream Standby (Timer is Idle)"}
          </span>
        </div>

        <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] px-3 py-1 rounded-full">
          Flow Rate: <span className="text-slate-900 dark:text-white font-medium">{ratePerSec > 0 ? `${formatEth(ratePerHr)}/hr` : "0.0000 USDC/hr"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 pt-2 font-mono">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Accrued (Earned)</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatEth(liveEarned)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            of <span className="text-slate-700 dark:text-slate-300 font-mono">{formatEth(budget)}</span> total deposit
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Claimable Available</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatEth(liveAvailable)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">ready for instant withdrawal</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Already Withdrawn</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-700 dark:text-slate-300">
            {formatEth(totalWithdrawn)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">settled to wallet</p>
        </div>
      </div>

      {/* Visual Multi-segment Progress Bar */}
      <div className="space-y-2 mt-4 font-mono">
        <div className="h-2.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden flex border border-slate-200 dark:border-transparent">
          <div
            style={{ width: `${claimedPercent}%` }}
            className="bg-sky-500 transition-all duration-500"
            title={`Claimed: ${claimedPercent}%`}
          />
          <div
            style={{ width: `${availablePercent}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Available: ${availablePercent}%`}
          />
          <div
            style={{ width: `${remainingPercent}%` }}
            className="bg-slate-200 dark:bg-white/15 transition-all duration-500"
            title={`Remaining in Vault: ${remainingPercent}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Settled ({claimedPercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Claimable ({availablePercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-white/30" /> In Vault ({remainingPercent}%)
          </span>
        </div>
      </div>

      {/* Claim Action for Freelancer */}
      {isFreelancer && liveAvailable > 0.0001 && (
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
            You have <strong className="text-emerald-600 dark:text-emerald-400">{formatEth(liveAvailable)}</strong> accrued that can be claimed on-chain now.
          </p>
          <button
            onClick={() => onClaim(liveAvailable)}
            disabled={claiming}
            className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20"
          >
            {claiming ? "Mining Claim Tx..." : `Claim ${formatEth(liveAvailable)}`}
          </button>
        </div>
      )}
    </div>
  );
}
