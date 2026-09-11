import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import TransactionCard from "../components/TransactionCard.jsx";
import TransactionDetailModal from "../components/TransactionDetailModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";
import { formatEth } from "../utils/format.js";

const FILTERS = [
  { key: "ALL", label: "All Events" },
  { key: "ESCROW", label: "Escrow Deposits", types: ["ESCROW_FUNDED", "WALLET_DEPOSIT"] },
  { key: "PAYMENTS", label: "Streams & Claims", types: ["PAYMENT_RELEASED", "STREAM_CLAIMED", "WALLET_TRANSFER"] },
  { key: "WORK", label: "Work & Proofs", types: ["WORK_SUBMITTED", "REVISION_REQUESTED"] },
  { key: "COMPLETED", label: "Settled", types: ["PROJECT_COMPLETED"] },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    api
      .transactions()
      .then((res) => setTransactions(res.transactions))
      .catch((err) => setError(err.message));
  }, []);

  const stats = useMemo(() => {
    if (!transactions) return { total: 0, volume: 0, deposits: 0, claims: 0 };
    const total = transactions.length;
    let volume = 0;
    let deposits = 0;
    let claims = 0;

    for (const t of transactions) {
      const amt = Number(t.amount || 0);
      volume += amt;
      if (t.type === "ESCROW_FUNDED" || t.type === "WALLET_DEPOSIT") deposits += amt;
      if (t.type === "STREAM_CLAIMED" || t.type === "PAYMENT_RELEASED") claims += amt;
    }

    return { total, volume, deposits, claims };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    let list = transactions;

    if (filter !== "ALL") {
      const conf = FILTERS.find((f) => f.key === filter);
      if (conf) list = list.filter((t) => conf.types.includes(t.type));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.projectTitle?.toLowerCase().includes(q) ||
          t.title?.toLowerCase().includes(q) ||
          t.simulatedTxHash?.toLowerCase().includes(q) ||
          t.fromName?.toLowerCase().includes(q) ||
          t.toName?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [transactions, filter, search]);

  return (
    <AppLayout
      title="Transactions"
      subtitle="Immutable on-chain event stream across all smart contracts, escrow deposits, and micropayment claims."
    >
      {/* 4-Bento Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-mono">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{stats.total}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Recorded on EVM localnet</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Total USDC Volume</p>
          <p className="text-2xl font-bold text-[#6366F1] dark:text-[#818CF8] mt-1.5">{formatEth(stats.volume)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Gross protocol flow</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Escrow Deposits</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{formatEth(stats.deposits)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Locked in stream vaults</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Claims Settled</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{formatEth(stats.claims)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Continuous worker payouts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-1 overflow-x-auto shadow-sm dark:shadow-lg max-w-full">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                filter === f.key
                  ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            className="input font-mono text-xs pl-9 pr-4 py-2"
            placeholder="Search hash, project, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!transactions && !error && <LoadingGrid count={4} />}

      {transactions && filtered.length === 0 && (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl text-center">
          <EmptyState
            title="No transactions match query"
            message="No on-chain events found matching your selected filter or search term."
          />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <TransactionCard key={t.id} txn={t} onClick={() => setSelectedTxn(t)} />
          ))}
        </div>
      )}

      <TransactionDetailModal
        txn={selectedTxn}
        open={Boolean(selectedTxn)}
        onClose={() => setSelectedTxn(null)}
      />
    </AppLayout>
  );
}
