export function formatEth(amount, token = "USDC") {
  return `${Number(amount ?? 0).toFixed(4)} ${token}`;
}

export function formatUsdc(amount) {
  return `${Number(amount ?? 0).toFixed(2)} USDC`;
}

export function formatDate(iso, opts) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(iso) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function daysUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const PROGRESS = {
  PENDING_FUNDING: 8,
  FUNDED: 25,
  IN_PROGRESS: 55,
  SUBMITTED: 82,
  REVISION_REQUESTED: 65,
  APPROVED: 95,
  RELEASED: 98,
  COMPLETED: 100,
  CANCELLED: 100,
};

export function statusProgress(status) {
  return PROGRESS[status] ?? 0;
}

export function truncateAddress(addr) {
  if (!addr) return "";
  if (addr.includes("...")) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// Human-readable next action per role/status, used for the dashboard
// project card's call-to-action and detail page's primary button.
export function nextActionLabel(status, role) {
  if (role === "CLIENT") {
    return (
      {
        PENDING_FUNDING: "Fund Escrow",
        FUNDED: "Awaiting Freelancer",
        IN_PROGRESS: "Monitor Work",
        SUBMITTED: "Review Submission",
        REVISION_REQUESTED: "Awaiting Resubmission",
        COMPLETED: "View Summary",
        CANCELLED: "View Summary",
      }[status] || "View Project"
    );
  }
  return (
    {
      PENDING_FUNDING: "Awaiting Funding",
      FUNDED: "Start Project",
      IN_PROGRESS: "Continue Work",
      SUBMITTED: "Awaiting Client Review",
      REVISION_REQUESTED: "Resubmit Work",
      COMPLETED: "View Summary",
      CANCELLED: "View Summary",
    }[status] || "View Project"
  );
}
