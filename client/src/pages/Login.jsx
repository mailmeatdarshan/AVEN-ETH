import React, { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import SidekickLogo from "../components/SidekickLogo.jsx";

const DEMO_ACCOUNTS = [
  { role: "CLIENT", label: "Client Workspace", name: "Sarah Chen", email: "client@aven.dev", balance: "25.0 USDC" },
  { role: "FREELANCER", label: "Contributor Workspace", name: "Marcus Rivera", email: "freelancer@aven.dev", balance: "0.0 USDC" },
];

export default function Login() {
  const { user, login, register, loading } = useAuth();
  const navigate = useNavigate();

  // Auth Modes: "buttons" | "email_login" | "email_signup" | "sso"
  const [authView, setAuthView] = useState("buttons");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [title, setTitle] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        title: title.trim() || (role === "CLIENT" ? "Engineering Lead" : "Full-Stack Contributor"),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to register account.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickAuth(demoEmail) {
    setError(null);
    setSubmitting(true);
    try {
      await login(demoEmail, "password123");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#000000] dark:text-[#E2E8F0] font-sans antialiased selection:bg-[#6366F1] selection:text-white flex flex-col justify-between p-8 sm:p-14 lg:p-20 transition-colors duration-150">
      {/* Top Mobile Brand Bar */}
      <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-200 dark:border-white/[0.06] mb-6">
        <Link to="/">
          <SidekickLogo
            containerClassName="h-7 w-7 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.12] p-1.5"
            className="h-3.5 w-3.5"
            textClassName="text-lg font-bold text-slate-900 dark:text-white"
          />
        </Link>
      </div>

      {/* Main Container: 2-Column Exact Layout */}
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 lg:gap-24 items-center my-auto">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRAND & NARRATIVE (Sidekick Decentralized Platform) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-16 lg:pr-6">
          {/* Logo (Original Left Column Position) */}
          <div className="hidden lg:flex items-center">
            <Link to="/">
              <SidekickLogo
                containerClassName="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.12] p-2"
                className="h-5 w-5"
                textClassName="text-[26px] font-bold text-slate-900 dark:text-white"
              />
            </Link>
          </div>

          {/* Main Heading & Subtitle */}
          <div className="space-y-6 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-normal tracking-[-0.03em] text-slate-900 dark:text-white leading-[1.14]">
              The Decentralized Streaming &amp; <br />
              Developer Escrow Platform
            </h1>
            <p className="text-slate-600 dark:text-[#94A3B8] text-[15px] font-normal leading-relaxed max-w-lg">
              Continuous micro-payment streaming across the SDLC &middot; Cryptographic Git Merkle proof of work &middot; Real-time stream health &amp; verifiable on-chain reputation
            </p>
          </div>

          {/* Bottom Stats (VS Code, Smart Vault, GitHub stars + Subtext) */}
          <div className="space-y-2.5 pt-4">
            <div className="flex items-center gap-6 text-xs font-mono text-slate-700 dark:text-slate-300">
              {/* VS Code */}
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-slate-900 dark:text-white">
                  <path d="M17.5 2.5L7 11.5L2.5 8L1 9.5L6.5 14L1 18.5L2.5 20L7 16.5L17.5 25.5L23 23V5L17.5 2.5Z" />
                </svg>
                <span className="font-semibold text-slate-900 dark:text-white">883.6K</span>
                <span className="text-amber-500 dark:text-amber-400 text-[10px]">★</span>
              </div>

              {/* Smart Vault */}
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-900 dark:text-white">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="13" y2="12" />
                </svg>
                <span className="font-semibold text-slate-900 dark:text-white">638K</span>
                <span className="text-amber-500 dark:text-amber-400 text-[10px]">★</span>
              </div>

              {/* GitHub */}
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-slate-900 dark:text-white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className="font-semibold text-slate-900 dark:text-white">11.9K</span>
                <span className="text-amber-500 dark:text-amber-400 text-[10px]">★</span>
              </div>
            </div>

            <p className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-[#64748B] uppercase">
              2M+ SECONDS STREAMED &middot; 100% MERKLE-VERIFIED SETTLEMENTS
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: AUTH BUTTONS & FORM */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 w-full max-w-[390px] mx-auto space-y-6">
          {/* Header (Centered) */}
          <div className="text-center space-y-1.5 mb-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#6366F1] dark:text-[#818CF8] tracking-tight">
              Welcome to Sidekick
            </h2>
            <p className="text-slate-600 dark:text-[#94A3B8] text-[13px] font-normal">
              {authView === "buttons" && "Connect your workspace to continue"}
              {authView === "email_login" && "Enter your email and password to sign in"}
              {authView === "email_signup" && "Create your new protocol account"}
              {authView === "sso" && "Choose a workspace to sign in instantly"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 dark:hover:text-white">&times;</button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. BUTTONS VIEW (GitHub, Google, Email, SSO) */}
          {/* ========================================================================= */}
          {authView === "buttons" && (
            <div className="space-y-3">
              {/* GitHub */}
              <button
                type="button"
                onClick={() => handleQuickAuth("freelancer@aven.dev")}
                disabled={submitting}
                className="w-full h-[48px] px-4 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-200 dark:border-[#1E2235] hover:border-[#6366F1] dark:hover:border-[#2E344E] hover:bg-slate-50 dark:hover:bg-[#131624] transition-all flex items-center justify-center gap-3 text-[11.5px] font-mono font-medium text-slate-800 dark:text-slate-200 tracking-wider uppercase shadow-sm dark:shadow-none"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-900 dark:text-white flex-shrink-0">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>CONTINUE WITH GITHUB</span>
              </button>

              {/* Google */}
              <button
                type="button"
                onClick={() => handleQuickAuth("client@aven.dev")}
                disabled={submitting}
                className="w-full h-[48px] px-4 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-200 dark:border-[#1E2235] hover:border-[#6366F1] dark:hover:border-[#2E344E] hover:bg-slate-50 dark:hover:bg-[#131624] transition-all flex items-center justify-center gap-3 text-[11.5px] font-mono font-medium text-slate-800 dark:text-slate-200 tracking-wider uppercase shadow-sm dark:shadow-none"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => setAuthView("email_login")}
                className="w-full h-[48px] px-4 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-200 dark:border-[#1E2235] hover:border-[#6366F1] dark:hover:border-[#2E344E] hover:bg-slate-50 dark:hover:bg-[#131624] transition-all flex items-center justify-center gap-3 text-[11.5px] font-mono font-medium text-slate-800 dark:text-slate-200 tracking-wider uppercase shadow-sm dark:shadow-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-600 dark:text-slate-300 flex-shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>CONTINUE WITH EMAIL</span>
              </button>

              {/* SSO */}
              <button
                type="button"
                onClick={() => setAuthView("sso")}
                className="w-full h-[48px] px-4 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-200 dark:border-[#1E2235] hover:border-[#6366F1] dark:hover:border-[#2E344E] hover:bg-slate-50 dark:hover:bg-[#131624] transition-all flex items-center justify-center gap-3 text-[11.5px] font-mono font-medium text-slate-800 dark:text-slate-200 tracking-wider uppercase shadow-sm dark:shadow-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-600 dark:text-slate-300 flex-shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>SSO (SINGLE SIGN-ON)</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. EMAIL SIGN IN FORM */}
          {/* ========================================================================= */}
          {authView === "email_login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-300 dark:border-[#1E2235] focus:border-[#6366F1] focus:outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans shadow-sm dark:shadow-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-300 dark:border-[#1E2235] focus:border-[#6366F1] focus:outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans shadow-sm dark:shadow-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setAuthView("buttons")}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-mono text-[11px] transition-colors"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView("email_signup")}
                  className="text-[#6366F1] dark:text-[#818CF8] hover:underline text-[12px] font-medium"
                >
                  Don't have an account? Sign up
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center font-medium shadow-md"
              >
                {submitting ? "Signing in..." : "Sign In &rarr;"}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 3. EMAIL SIGN UP FORM */}
          {/* ========================================================================= */}
          {authView === "email_signup" && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Taylor Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-300 dark:border-[#1E2235] focus:border-[#6366F1] focus:outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans shadow-sm dark:shadow-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="taylor@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-300 dark:border-[#1E2235] focus:border-[#6366F1] focus:outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans shadow-sm dark:shadow-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-300 dark:border-[#1E2235] focus:border-[#6366F1] focus:outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans shadow-sm dark:shadow-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("CLIENT")}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      role === "CLIENT"
                        ? "bg-indigo-50 dark:bg-[#6366F1]/20 border-[#6366F1] text-[#6366F1] dark:text-white"
                        : "bg-white dark:bg-[#0E101A] border-slate-200 dark:border-[#1E2235] text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    Client Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("FREELANCER")}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      role === "FREELANCER"
                        ? "bg-indigo-50 dark:bg-[#6366F1]/20 border-[#6366F1] text-[#6366F1] dark:text-white"
                        : "bg-white dark:bg-[#0E101A] border-slate-200 dark:border-[#1E2235] text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    Contributor
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setAuthView("email_login")}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-mono text-[11px] transition-colors"
                >
                  &larr; Back to Sign In
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center font-medium shadow-md"
              >
                {submitting ? "Creating Account..." : "Create Account &rarr;"}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 4. SSO / DEMO WORKSPACES */}
          {/* ========================================================================= */}
          {authView === "sso" && (
            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickAuth(acc.email)}
                  disabled={submitting}
                  className="w-full p-3.5 rounded-lg bg-white dark:bg-[#0E101A] border border-slate-200 dark:border-[#1E2235] hover:border-[#6366F1] transition-all text-left group shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#6366F1] dark:group-hover:text-[#818CF8]">
                      {acc.label}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{acc.balance}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">{acc.name} &middot; {acc.email}</p>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setAuthView("buttons")}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-mono text-center block transition-colors"
              >
                &larr; Back to options
              </button>
            </div>
          )}

          {/* No Credit Card Pill */}
          <div className="flex justify-center pt-1">
            <span className="px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/20 text-[#6366F1] dark:text-[#818CF8] text-[11px] font-mono font-medium">
              No credit card required
            </span>
          </div>

          {/* Bottom Help */}
          <div className="text-center pt-4 text-[12px] text-slate-500 dark:text-[#64748B]">
            Can't sign in?{" "}
            <a
              href="#help"
              onClick={(e) => {
                e.preventDefault();
                setAuthView("sso");
              }}
              className="text-[#6366F1] hover:underline font-medium"
            >
              Click here for help
            </a>
          </div>
        </div>
      </div>

      {/* Empty bottom space */}
      <div className="h-6" />
    </div>
  );
}
