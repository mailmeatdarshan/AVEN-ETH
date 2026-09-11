import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { api } from "../api/client.js";
import { formatEth } from "../utils/format.js";
import ThemeToggle from "./ThemeToggle.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Topbar({ title, subtitle, onMenuClick }) {
  const [unread, setUnread] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const {
    account,
    shortAddress,
    isBaseSepolia,
    hasMetaMask,
    usdcBalance,
    isConnecting,
    txPending,
    connectWallet,
    switchToBaseSepolia,
    mintFaucetUSDC,
  } = useWeb3();

  async function handleConnect() {
    try {
      await connectWallet();
      toast.success("MetaMask wallet connected!");
    } catch (err) {
      toast.error(err.message || "Failed to connect wallet.");
    }
  }

  async function handleMint() {
    try {
      toast.info("Minting 500 mUSDC on Base Sepolia...");
      const txHash = await mintFaucetUSDC(500);
      toast.success("Successfully minted 500 mUSDC test tokens!");
    } catch (err) {
      toast.error(err.message || "Minting failed.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    function load() {
      api
        .notifications()
        .then((res) => {
          if (!cancelled) setUnread(res.unreadCount);
        })
        .catch(() => {});

      api
        .wallet()
        .then((res) => {
          if (!cancelled) setWalletBalance(res.wallet?.balance ?? null);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] transition-colors">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Web3 Wallet Connect, Network Status, Notifications & Theme Switcher */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Network Badge or Network Switch Button */}
        {account ? (
          isBaseSepolia ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">BASE SEPOLIA</span>
              <span className="sm:hidden">BASE</span>
            </div>
          ) : (
            <button
              onClick={switchToBaseSepolia}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-[11px] font-mono font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
              title="Click to switch MetaMask to Base Sepolia"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>SWITCH TO BASE</span>
            </button>
          )
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] text-[11px] font-mono text-slate-700 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>BASE SEPOLIA</span>
          </div>
        )}

        {/* Web3 MetaMask Connect Button or Connected Account Pill */}
        {account ? (
          <div className="flex items-center gap-1.5">
            {/* mUSDC live balance chip */}
            <div
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] text-xs font-mono"
              title="Live MockUSDC balance on Base Sepolia"
            >
              <span className="text-slate-400">$</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{usdcBalance}</span>
              <span className="text-[10px] text-slate-400">mUSDC</span>
            </div>

            {/* Faucet button */}
            <button
              onClick={handleMint}
              disabled={txPending}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-[#6366F1]/15 dark:hover:bg-[#6366F1]/25 border border-indigo-200 dark:border-[#6366F1]/30 text-[#6366F1] dark:text-[#818CF8] text-[11px] font-mono font-medium transition-all"
              title="Mint 500 free mUSDC on Base Sepolia"
            >
              {txPending ? "Minting..." : "+ 500 USDC"}
            </button>

            {/* Address Chip */}
            <a
              href={`https://sepolia.basescan.org/address/${account}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0A0A0A] dark:hover:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors"
              title="View your wallet on Basescan"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{shortAddress}</span>
            </a>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium transition-all shadow-sm active:scale-95"
            title="Connect MetaMask to interact with Base Sepolia on-chain smart contracts"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="M16 12h.01" />
            </svg>
            <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
          </button>
        )}

        {/* Notifications Icon Button */}
        <button
          onClick={() => navigate("/notifications")}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center leading-none shadow-md">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Single Theme Switch Icon right next to Notifications */}
        <ThemeToggle />
      </div>
    </header>
  );
}
