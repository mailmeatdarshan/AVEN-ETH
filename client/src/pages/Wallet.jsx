import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import { formatEth, formatDateTime, truncateAddress } from "../utils/format.js";

const TX_BADGES = {
  WALLET_DEPOSIT: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
  WALLET_TRANSFER: "bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] border-indigo-200 dark:border-indigo-500/30",
  STREAM_CREATED: "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  STREAM_CLAIMED: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
  ATTESTATION_MINTED: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  STREAM_CANCELLED: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
};

export default function Wallet() {
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("2.5");
  const [depositing, setDepositing] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("0.5");
  const [transferring, setTransferring] = useState(false);

  const [copied, setCopied] = useState(false);

  function load() {
    api
      .wallet()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(load, []);

  function copyAddress(addr) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid deposit amount.");
      return;
    }
    setDepositing(true);
    try {
      const res = await api.depositFunds(amt, "Faucet deposit via Wallet Hub");
      toast.success(`Successfully deposited ${formatEth(res.amountDeposited)} to your wallet!`);
      setDepositOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDepositing(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!transferAddress.trim() || !transferAddress.startsWith("0x")) {
      toast.error("Enter a valid recipient Ethereum address starting with 0x...");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid transfer amount.");
      return;
    }
    setTransferring(true);
    try {
      const res = await api.transferFunds(transferAddress.trim(), amt);
      toast.success(`Transferred ${formatEth(res.amountTransferred)} to ${truncateAddress(transferAddress)}!`);
      setTransferOpen(false);
      setTransferAddress("");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTransferring(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Wallet & Liquidity Hub" subtitle="Loading your balances...">
        <div className="space-y-6">
          <div className="skeleton h-60 w-full rounded-2xl" />
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="Wallet & Liquidity Hub">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-400">
          Failed to load wallet data: {error}
        </div>
      </AppLayout>
    );
  }

  const { wallet, activeStreams, transactions } = data;

  return (
    <AppLayout
      title="Wallet & Liquidity Hub"
      subtitle="Manage your testnet funds, stream liquidity reserves, and on-chain deposits."
    >
      <div className="space-y-8">
        {/* Main Wallet Hero Card */}
        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#141414] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white relative overflow-hidden shadow-sm dark:shadow-2xl">
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#6366F1]/10 dark:bg-[#6366F1]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {wallet.network}
                </span>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] px-3 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-slate-300">
                  <span>{truncateAddress(wallet.walletAddress)}</span>
                  <button
                    onClick={() => copyAddress(wallet.walletAddress)}
                    className="hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 transition-colors text-[11px]"
                    title="Copy full address"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Spendable Balance</p>
                <h2 className="font-mono text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                  {formatEth(wallet.availableBalance)}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-sans">
                  Available for instant stream funding, milestone releases, or transfers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 flex-wrap">
                <button
                  onClick={() => setDepositOpen(true)}
                  className="h-10 px-5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2"
                >
                  + Add Funds (Faucet)
                </button>
                <button
                  onClick={() => setTransferOpen(true)}
                  className="h-10 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] font-medium text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 shadow-sm"
                >
                  Send / Transfer &rarr;
                </button>
              </div>
            </div>

            {/* Quick Balances Stats Card */}
            <div className="lg:col-span-4 rounded-2xl bg-slate-50 dark:bg-[#050505]/80 border border-slate-200 dark:border-white/[0.08] p-6 space-y-4 shadow-sm dark:shadow-xl">
              <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Liquidity Allocations
              </p>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/[0.06]">
                  <span className="text-slate-500 dark:text-slate-400">Locked in Stream Escrows</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatEth(wallet.lockedInEscrows)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/[0.06]">
                  <span className="text-slate-500 dark:text-slate-400">Total Ledger Events</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {wallet.totalTransactions} Txns
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Account Role</span>
                  <span className="font-semibold text-[#6366F1] dark:text-[#818CF8] capitalize">
                    {wallet.role.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Stream Allocations */}
        {activeStreams.length > 0 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Active Stream Escrow Vaults ({activeStreams.length})
              </h3>
              <Link to="/agreements" className="text-xs font-mono text-[#6366F1] dark:text-[#818CF8] hover:underline">
                View All Streams &rarr;
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreams.map((stream) => (
                <div key={stream.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{stream.title}</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] border border-indigo-200 dark:border-indigo-500/30">
                      {stream.category}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-1 border-t border-slate-200 dark:border-white/[0.06]">
                    <span>Locked in Vault:</span>
                    <strong className="text-slate-900 dark:text-white">{formatEth(stream.escrowBalance)}</strong>
                  </div>
                  <Link
                    to={`/agreements/${stream.id}`}
                    className="text-xs text-[#6366F1] dark:text-[#818CF8] font-mono hover:underline block pt-1"
                  >
                    Open Stream &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Wallet Activity History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Wallet Ledger &amp; Transaction History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every deposit, stream lock, and withdrawal verified with cryptographic SHA-256 blocks.
              </p>
            </div>
            <Link to="/blockchain" className="text-xs font-mono text-[#6366F1] dark:text-[#818CF8] hover:underline">
              Inspect Blocks &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
            {transactions.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 py-6 text-center">No transactions recorded yet.</p>
            ) : (
              transactions.map((tx) => {
                const badgeClass = TX_BADGES[tx.type] || "bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300";
                const isIncoming = tx.toUser === user.id;

                return (
                  <div key={tx.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                          {tx.type}
                        </span>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {truncateAddress(tx.simulatedTxHash)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDateTime(tx.timestamp)}
                        {tx.agreementId && (
                          <span> &middot; Stream: <Link to={`/agreements/${tx.agreementId}`} className="text-[#6366F1] dark:text-[#818CF8] underline">#{tx.agreementId}</Link></span>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-mono text-base font-bold ${isIncoming ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                        {isIncoming ? "+" : "-"}{formatEth(tx.amount)}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Confirmed</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Deposit / Add Funds Modal */}
      <Modal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="Deposit Funds to Wallet (Faucet)"
        subtitle="Mint testnet USDC to fund payment streams or test withdrawals."
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDepositOpen(false)} disabled={depositing}>
              Cancel
            </button>
            <button className="btn-primary !bg-[#6366F1]" onClick={handleDeposit} disabled={depositing}>
              {depositing && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
              {depositing ? "Mining Deposit Block..." : `Deposit ${depositAmount || 0} USDC`}
            </button>
          </>
        }
      >
        <form onSubmit={handleDeposit} className="space-y-5">
          <div>
            <label className="field-label mb-2">Select Quick Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {["1.0", "2.5", "5.0", "10.0"].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setDepositAmount(preset)}
                  className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                    depositAmount === preset
                      ? "bg-[#6366F1] text-white border-[#6366F1]"
                      : "bg-slate-100 dark:bg-[#171717] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#1F1F1F]"
                  }`}
                >
                  +{preset} USDC
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Custom Amount (USDC)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1000"
              className="input font-mono"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g. 5.0"
              required
            />
          </div>

          <div className="rounded-xl bg-indigo-50 dark:bg-[#6366F1]/10 border border-indigo-200 dark:border-indigo-500/25 p-3 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Instant Testnet Settlement:</strong> Deposited funds will be credited to {truncateAddress(wallet.walletAddress)} and mined into the blockchain ledger.
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer Funds"
        subtitle="Send USDC to another simulated address or recipient."
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTransferOpen(false)} disabled={transferring}>
              Cancel
            </button>
            <button className="btn-primary !bg-[#6366F1]" onClick={handleTransfer} disabled={transferring}>
              {transferring && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
              {transferring ? "Mining Transfer Tx..." : "Confirm & Send"}
            </button>
          </>
        }
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="field-label">Recipient Wallet Address (0x...)</label>
            <input
              type="text"
              className="input font-mono text-xs"
              placeholder="0x71Cb05EE1b1F506fC321Da3Cc38F21E02d12f9B1"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="field-label !mb-0">Transfer Amount (USDC)</label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Available: <strong className="text-slate-900 dark:text-white">{formatEth(wallet.availableBalance)}</strong>
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={wallet.availableBalance}
              className="input font-mono"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="e.g. 0.5"
              required
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
