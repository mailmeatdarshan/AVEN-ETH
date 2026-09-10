function Node({ label, sub, active, isVault }) {
  const isImageUrl =
    typeof label === "string" &&
    (label.startsWith("http://") ||
      label.startsWith("https://") ||
      label.startsWith("data:image/") ||
      label.includes("dicebear.com"));

  function getFallbackInitials() {
    if (typeof label === "string" && label.length <= 3) return label;
    if (sub && typeof sub === "string") {
      const parts = sub.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return sub.slice(0, 2).toUpperCase();
    }
    return "SK";
  }

  return (
    <div className="flex flex-col items-center gap-1.5 text-center w-28 shrink-0">
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center text-xs font-mono font-bold border transition-all overflow-hidden ${
          active
            ? isVault
              ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/15"
              : "border-[#6366F1] text-[#6366F1] dark:text-white bg-indigo-50 dark:bg-[#6366F1]/20 shadow-lg shadow-indigo-500/20"
            : "border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#141414]"
        }`}
      >
        {isVault ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 dark:text-emerald-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : isImageUrl ? (
          <img src={label} alt={sub || "Avatar"} className="h-full w-full object-cover" />
        ) : sub ? (
          <img
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(sub)}&backgroundColor=6366f1,4f46e5,4338ca`}
            alt={sub}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="uppercase font-semibold tracking-wider">{getFallbackInitials()}</span>
        )}
      </div>
      <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium leading-tight truncate max-w-[100px]">{sub}</span>
    </div>
  );
}

function StreamArrow() {
  return (
    <div className="flex items-center text-[#6366F1] dark:text-[#818CF8] shrink-0 drop-shadow-[0_0_8px_rgba(99,102,241,0.9)]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8]"
      >
        <line x1="4" y1="12" x2="20" y2="12" />
        <polyline points="13 5 20 12 13 19" />
      </svg>
    </div>
  );
}

function ArrowConnector({ amount, active }) {
  return (
    <div className="flex-1 min-w-[130px] max-w-[220px] flex flex-col items-center gap-2 font-mono">
      <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#141414] px-3 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.08] shadow-sm whitespace-nowrap">
        {amount}
      </span>
      
      {/* 100% Smooth Continuous Infinite Stream Conveyor */}
      <div className="relative w-full h-6 flex items-center justify-center overflow-hidden stream-track-mask">
        {/* Base Track Line */}
        <div className="w-full h-[2px] bg-slate-200 dark:bg-white/[0.1] rounded-full absolute inset-x-0 top-1/2 -translate-y-1/2" />

        {active ? (
          <div className="absolute inset-0 flex items-center stream-conveyor-continuous pointer-events-none">
            {/* Group 1 */}
            <div className="flex items-center justify-around w-1/2 px-2 shrink-0">
              <StreamArrow />
              <StreamArrow />
              <StreamArrow />
            </div>

            {/* Group 2 (Identical clone for 60fps unbroken infinite continuous flow) */}
            <div className="flex items-center justify-around w-1/2 px-2 shrink-0">
              <StreamArrow />
              <StreamArrow />
              <StreamArrow />
            </div>
          </div>
        ) : (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EscrowFlow({ fromLabel, fromName, toLabel, toName, amount, active = true }) {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 py-3.5 px-3 sm:px-6 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-slate-200 dark:border-white/[0.06] overflow-x-auto shadow-sm dark:shadow-none">
      <Node label={fromLabel} sub={fromName} active={active} />
      <ArrowConnector amount={amount} active={active} />
      <Node label="VAULT" sub="Smart Vault" active={active} isVault />
      <ArrowConnector amount={amount} active={active} />
      <Node label={toLabel} sub={toName} active={active} />
    </div>
  );
}
