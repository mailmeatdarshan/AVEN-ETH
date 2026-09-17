const CONFIG = {
  PENDING_FUNDING: { label: "Pending Funding", tone: "warning" },
  FUNDED: { label: "Funded", tone: "accent" },
  IN_PROGRESS: { label: "In Progress", tone: "accent" },
  SUBMITTED: { label: "Awaiting Review", tone: "warning" },
  REVISION_REQUESTED: { label: "Revision Requested", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  RELEASED: { label: "Released", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  REJECTED: { label: "Rejected", tone: "danger" },
  PENDING_REVIEW: { label: "Pending Review", tone: "warning" },
  RUNNING: { label: "Running", tone: "success" },
  PAUSED: { label: "Paused", tone: "warning" },
  STOPPED: { label: "Stopped", tone: "neutral" },
  IDLE: { label: "Not Started", tone: "neutral" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  DISPUTED: { label: "Disputed Freeze", tone: "danger" },
  SETTLEMENT_OFFERED: { label: "Settlement Offered", tone: "accent" },
  REFUND_PENDING: { label: "Refund Challenging", tone: "warning" },
};

const TONE_CLASSES = {
  warning: "bg-amber-100 text-amber-900 border border-amber-300/90 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  accent: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-[#6366F1]/15 dark:text-[#818CF8] dark:border-indigo-500/30",
  success: "bg-emerald-50 text-emerald-800 border border-emerald-300/90 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  danger: "bg-rose-50 text-rose-800 border border-rose-300/90 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  neutral: "bg-slate-100 text-slate-800 border border-slate-300 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.12]",
};

export default function StatusBadge({ status, className = "" }) {
  const conf = CONFIG[status] || { label: status?.replace(/_/g, " ") || "Unknown", tone: "neutral" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold tracking-wide ${TONE_CLASSES[conf.tone]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {conf.label}
    </span>
  );
}
