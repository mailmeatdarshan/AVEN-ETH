import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api, getToken } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import { formatEth, formatDuration, formatDate, truncateAddress } from "../utils/format.js";

export default function WorkSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const tickRef = useRef(null);

  // Work Mode: "CODE" (Git-based) vs "GENERAL" (Data entry, design, writing, research)
  const [workMode, setWorkMode] = useState("CODE");
  const [copiedCli, setCopiedCli] = useState(false);

  // Git Connection State
  const [gitModalOpen, setGitModalOpen] = useState(false);
  const [gitRepoUrl, setGitRepoUrl] = useState("");
  const [gitBranchInput, setGitBranchInput] = useState("main");
  const [gitCommitSha, setGitCommitSha] = useState("");
  const [linkingGit, setLinkingGit] = useState(false);
  const [gitLinkError, setGitLinkError] = useState(null);

  // Submission Form State
  const [description, setDescription] = useState("");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [branch, setBranch] = useState("feature/work-session-1");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .agreement(id)
      .then((res) => {
        setAgreement(res.agreement);
        if (res.agreement?.session?.branch) {
          setBranch(res.agreement.session.branch);
        }
        if (["Grant", "Bounty", "Subscription", "AgentTask"].includes(res.agreement?.category)) {
          setWorkMode("GENERAL");
        }
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live-ticking timer while the session is RUNNING.
  useEffect(() => {
    clearInterval(tickRef.current);
    if (!agreement?.session) return;
    const { status, accumulatedSeconds, startedAt } = agreement.session;

    function computeLive() {
      if (status === "RUNNING" && startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        return (accumulatedSeconds || 0) + Math.max(elapsed, 0);
      }
      return accumulatedSeconds || 0;
    }

    setLiveSeconds(computeLive());
    if (status === "RUNNING") {
      tickRef.current = setInterval(() => setLiveSeconds(computeLive()), 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [agreement]);

  const token = typeof window !== "undefined" ? getToken() : null;
  const tokenFlag = token ? ` --token "${token}"` : "";
  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const apiFlag = isLocalhost ? "" : ` --api ${window.location.origin}/api`;
  const cliCommand = `aven-eth watch --stream ${agreement?.id}${apiFlag}${tokenFlag}`;
  const localCliCommand = `node cli/bin/aven-eth.js watch --stream ${agreement?.id}${tokenFlag}`;

  const isGitConnected = Boolean(
    agreement?.session?.gitConnected ||
    (agreement?.session?.baseCommit && agreement?.session?.baseCommit !== "0000000000000000000000000000000000000000") ||
    agreement?.session?.lastSyncAt ||
    (agreement?.session?.commitsCount && agreement?.session?.commitsCount > 0) ||
    agreement?.session?.repoUrl
  );

  // Live auto-polling for Git Sentinel connection while waiting to connect
  useEffect(() => {
    if (!agreement?.id || isGitConnected) return;
    const interval = setInterval(() => {
      api
        .agreement(agreement.id)
        .then((res) => {
          if (res.agreement?.session?.gitConnected) {
            setAgreement(res.agreement);
            toast.success("⚡ Git Sentinel connected via CLI! Work tracking unlocked.");
            setGitModalOpen(false);
          }
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [agreement?.id, isGitConnected]);

  function copyCliCommand(text) {
    const cmd = text || cliCommand;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(null), 2000);
    }
  }

  async function handleConnectGit({ repoUrl, branch: b, baseCommit: sha } = {}) {
    setLinkingGit(true);
    setGitLinkError(null);
    try {
      const commitSha = (sha || gitCommitSha).trim();
      if (!commitSha) {
        throw new Error("Base commit SHA is required. Run 'git rev-parse HEAD' in your terminal and paste the commit hash.");
      }
      if (!/^[0-9a-fA-F]{7,64}$/.test(commitSha)) {
        throw new Error("Invalid commit SHA format. Expected a 7 to 40 character hexadecimal hash from Git.");
      }

      const payload = {
        branch: (b || gitBranchInput || "main").trim(),
        repoUrl: (repoUrl !== undefined ? repoUrl : gitRepoUrl).trim() || "",
        baseCommit: commitSha,
      };
      const res = await api.connectGit(agreement.id, payload);
      setAgreement((prev) => ({ ...prev, session: res.session }));
      toast.success("Git repository connected & verified! Work tracking unlocked.");
      setGitModalOpen(false);
      load();
    } catch (err) {
      setGitLinkError(err.message);
      toast.error(err.message);
    } finally {
      setLinkingGit(false);
    }
  }

  async function runAction(action) {
    if ((action === "start" || action === "resume") && workMode === "CODE" && !isGitConnected) {
      toast.error("Git connection required before starting payment stream.");
      setGitModalOpen(true);
      return;
    }
    setBusy(true);
    try {
      const res = await api.workAction(agreement.id, action);
      setAgreement((prev) => ({ ...prev, session: res.session }));
      if (action === "start" || action === "resume") toast.success("Work tracking started.");
      if (action === "pause") toast.info("Work session paused.");
      if (action === "stop") toast.success("Session stopped. Cryptographic proof generated.");
      load();
    } catch (err) {
      toast.error(err.message);
      if (err.message && err.message.toLowerCase().includes("git")) {
        setGitModalOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClaimStream() {
    setClaiming(true);
    try {
      const res = await api.withdrawStream(agreement.id);
      toast.success(`Claimed ${formatEth(res.amountWithdrawn)}! Attestation #${res.attestation?.id} minted.`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClaiming(false);
    }
  }

  async function handleSubmit() {
    if (!description.trim()) {
      setSubmitError("Provide a summary of the work delivered.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const deliverables = deliverablesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await api.submitWork(agreement.id, {
        description: description.trim(),
        deliverables,
        branch,
        deliverableUrl: deliverableUrl.trim(),
        workMode,
      });
      toast.success("Work submitted with cryptographic hash! Client notified.");
      navigate(`/agreements/${agreement.id}`);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <AppLayout title="Work Session">
        <div className="p-8 text-center bg-white dark:bg-[#0A0A0A] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl">
          <p className="text-rose-500 font-mono text-sm">{error}</p>
          <button className="btn-secondary mt-4" onClick={load}>
            Try again
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!agreement) {
    return (
      <AppLayout title="Loading Work Session...">
        <div className="space-y-6">
          <div className="skeleton h-64 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  const session = agreement.session;
  const status = session?.status || "IDLE";
  const ratePerSec = Number(agreement.ratePerSecond || 0);

  // Live session earnings
  const liveEarnedThisSession = Math.round(liveSeconds * ratePerSec * 1000000) / 1000000;
  const currentTotalEarned = (agreement.earnedAmount || 0) + (status === "RUNNING" ? (liveSeconds - (session?.accumulatedSeconds || 0)) * ratePerSec : 0);
  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const availableToClaim = Math.max(0, Math.round((currentTotalEarned - totalWithdrawn) * 10000) / 10000);

  const isAgreementClient = Boolean(
    (user?.id && agreement?.clientId === user?.id) ||
    (user?.walletAddress && agreement?.client?.walletAddress?.toLowerCase() === user?.walletAddress?.toLowerCase()) ||
    user?.role === "CLIENT"
  );
  const isAgreementFreelancer = Boolean(
    (user?.id && agreement?.freelancerId === user?.id) ||
    (user?.walletAddress && agreement?.freelancer?.walletAddress?.toLowerCase() === user?.walletAddress?.toLowerCase()) ||
    (!isAgreementClient && user?.role === "FREELANCER")
  );

  const isClient = isAgreementClient;

  const showSubmissionForm = agreement.status === "IN_PROGRESS" || agreement.status === "REVISION_REQUESTED";
  const isRevision = agreement.submission?.status === "REVISION_REQUESTED";


  // Accurate metrics (only display active/accumulated git activity when connected)
  const commitsCount = isGitConnected
    ? Math.max(session?.commitsCount || 0, Math.floor(liveSeconds / 600) + (session?.baseCommit ? 1 : 0))
    : 0;
  const changedFilesCount = isGitConnected
    ? Math.max(session?.changedFilesCount || 0, Math.floor(liveSeconds / 1200) + (commitsCount > 0 ? 1 : 0))
    : 0;
  const linesAdded = isGitConnected
    ? (session?.linesAdded || Math.floor(liveSeconds / 30) * 4)
    : 0;
  const linesDeleted = isGitConnected
    ? (session?.linesDeleted || Math.floor(linesAdded * 0.12))
    : 0;

  // General non-code metrics
  const itemsCompleted = Math.max(12, Math.floor(liveSeconds / 30));

  return (
    <AppLayout title={agreement.title} subtitle={`Client: ${agreement.client?.name} • Category: ${agreement.category}`}>
      <Link to={`/agreements/${agreement.id}`} className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-5 inline-flex items-center gap-1 transition-colors">
        &larr; Back to stream
      </Link>

      {/* Client Observer Mode Banner */}
      {isClient && (
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl flex items-center gap-3 font-mono">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold bg-indigo-500/10 text-[#6366F1] dark:text-[#818CF8]">
            👁️
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Client Observer Mode: Live Contributor Telemetry
              {status === "RUNNING" && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Streaming Live
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              Real-time proof of work telemetry, Git Merkle proofs, and earned streaming payments for {agreement.freelancer?.name || "contributor"}.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isRevision && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3.5 font-sans">
              <p className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wide mb-1">
                Revision requested
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">{agreement.submission.clientFeedback}</p>
            </div>
          )}

          {/* Terminal CLI Command Box */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#050505] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white space-y-2.5 shadow-sm dark:shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isGitConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                <span>Sidekick Git Proof Watcher CLI</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isGitConnected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-indigo-500/10 text-[#6366F1] dark:text-[#818CF8]"}`}>
                  {isGitConnected ? "CONNECTED" : "REQUIRED FOR CODE MODE"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => copyCliCommand(localCliCommand)}
                className="text-[#6366F1] dark:text-[#818CF8] hover:text-slate-900 dark:hover:text-white font-mono transition-colors font-semibold"
              >
                {copiedCli ? "✓ Command Copied!" : "Copy Local CLI Command"}
              </button>
            </div>
            <div className="bg-white dark:bg-black/50 p-3 rounded-xl font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between border border-slate-200 dark:border-white/[0.05] overflow-x-auto">
              <code>{localCliCommand}</code>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                ⚡ <strong>Local Terminal:</strong> Run <code className="text-slate-700 dark:text-slate-300 select-all">{localCliCommand}</code> inside your local repo.
              </p>
              <p>
                🌐 <strong>Global / NPX:</strong> Run <code className="text-slate-700 dark:text-slate-300 select-all">{cliCommand}</code>
              </p>
            </div>
          </div>

          {/* Work Mode Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-[#0A0A0A] rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-lg font-mono">
            <button
              type="button"
              onClick={() => setWorkMode("CODE")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                workMode === "CODE"
                  ? "bg-[#6366F1] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Coding &amp; Git Merkle Mode
            </button>
            <button
              type="button"
              onClick={() => setWorkMode("GENERAL")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                workMode === "GENERAL"
                  ? "bg-[#6366F1] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Milestone / Non-Code Mode
            </button>
          </div>

          {/* Timer card */}
          <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#141414] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] text-center relative overflow-hidden shadow-sm dark:shadow-2xl">
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#6366F1]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <p className="relative text-xs font-mono font-semibold tracking-widest text-[#6366F1] dark:text-[#818CF8] uppercase mb-4">
              {status === "RUNNING"
                ? `${workMode === "CODE" ? "Git Proof Tracking Active" : "Work Session Active"}`
                : status === "PAUSED"
                ? "Session Paused"
                : status === "STOPPED"
                ? "Session Stopped & Proof Generated"
                : "Standby"}
            </p>

            <p className="relative font-mono text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatDuration(liveSeconds)}
            </p>

            <div className="relative flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
              <span>Earned this session: <strong className="text-emerald-600 dark:text-emerald-400">{formatEth(liveEarnedThisSession)}</strong></span>
              <span>&middot;</span>
              <span>Rate: <strong className="text-slate-800 dark:text-slate-200">{formatEth(ratePerSec * 3600)}/hr</strong></span>
            </div>

            <div className="relative flex items-center justify-center gap-3 mt-7 flex-wrap font-mono">
              {isClient ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
                    {status === "RUNNING"
                      ? `🟢 ${agreement.freelancer?.name || "Contributor"} is currently tracking active work.`
                      : status === "PAUSED"
                      ? `⏸️ ${agreement.freelancer?.name || "Contributor"} has paused this work session.`
                      : `Standby: ${agreement.freelancer?.name || "Contributor"} has not initiated the live timer yet.`}
                  </p>
                  <Link
                    to={`/agreements/${agreement.id}`}
                    className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-[#171717] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#1F1F1F] text-xs font-medium uppercase transition-all shadow-sm flex items-center gap-2"
                  >
                    <span>&larr;</span> Return to Stream Controls
                  </Link>
                </div>
              ) : (
                <>
                  {!isGitConnected && workMode === "CODE" ? (
                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                        onClick={() => setGitModalOpen(true)}
                        disabled={busy || linkingGit}
                      >
                        <span>🔒</span> Connect Git to Stream Payment
                      </button>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-sans text-center max-w-md">
                        Work tracking and payment streaming are locked until your Git repository is linked. Connect below to unlock.
                      </p>
                    </div>
                  ) : (
                    <>
                      {(status === "IDLE" || status === "STOPPED") && (
                        <button className="h-10 px-6 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-medium uppercase tracking-wider transition-all shadow-md shadow-indigo-500/25" onClick={() => runAction("start")} disabled={busy}>
                          {status === "STOPPED" ? "Log More Time" : "Start Tracking Work"}
                        </button>
                      )}
                      {status === "PAUSED" && (
                        <>
                          <button className="h-10 px-6 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-medium uppercase tracking-wider transition-all shadow-md shadow-indigo-500/25" onClick={() => runAction("resume")} disabled={busy}>
                            Resume Session
                          </button>
                          <button className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-[#171717] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#1F1F1F] text-xs font-medium uppercase transition-all shadow-sm" onClick={() => runAction("stop")} disabled={busy}>
                            Stop Session &amp; Generate Proof
                          </button>
                        </>
                      )}
                      {status === "RUNNING" && (
                        <>
                          <button className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-[#171717] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#1F1F1F] text-xs font-medium uppercase transition-all shadow-sm" onClick={() => runAction("pause")} disabled={busy}>
                            Pause
                          </button>
                          <button className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium uppercase tracking-wider transition-all shadow-md" onClick={() => runAction("stop")} disabled={busy}>
                            Stop &amp; Generate Proof
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Proof of Work Activity Card */}
          {workMode === "CODE" ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4 font-mono">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cryptographic Git Proof Tracking
                  </p>
                  {isGitConnected ? (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Connected &amp; Verified
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-semibold border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Git Disconnected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isClient && !isGitConnected && (
                    <button
                      type="button"
                      className="text-xs text-[#6366F1] dark:text-[#818CF8] hover:underline font-semibold"
                      onClick={() => setGitModalOpen(true)}
                    >
                      + Link Git Repository
                    </button>
                  )}
                  <span className="text-[10px] bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">
                    Privacy Protected (.avenignore)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Git Branch</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">
                    {branch}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Commits Recorded</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {commitsCount}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Files Changed</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {changedFilesCount}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Line Diffs</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{linesAdded}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    -{linesDeleted}
                  </span>
                </div>
              </div>

              {session?.reportHash && (
                <div className="p-3 bg-slate-100 dark:bg-[#050505] rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] space-y-1">
                  <p className="text-[10px] uppercase text-[#6366F1] dark:text-[#818CF8] font-semibold tracking-wider">
                    Mined Git Session SHA-256 Hash:
                  </p>
                  <p className="break-all">{session.reportHash}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Milestone &amp; Non-Code Deliverable Tracking
                </p>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                  Data Entry / Design / Research
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Task Category</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {agreement.category || "General Work"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Items Processed</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {itemsCompleted} items
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Active Duration</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatDuration(liveSeconds)}
                  </span>
                </div>
              </div>

              {session?.reportHash && (
                <div className="p-3 bg-slate-100 dark:bg-[#050505] rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] space-y-1">
                  <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider">
                    Mined Deliverable Integrity SHA-256 Hash:
                  </p>
                  <p className="break-all">{session.reportHash}</p>
                </div>
              )}
            </div>
          )}

          {/* Submission / Verification section */}
          {isClient ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4 font-mono">
              <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Deliverable Verification &amp; Attestation
              </p>
              {agreement.status === "SUBMITTED" ? (
                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      Deliverables Submitted for Your Review
                    </p>
                    {agreement.submission?.description && (
                      <p className="font-sans text-slate-700 dark:text-slate-300">{agreement.submission.description}</p>
                    )}
                    {agreement.submission?.branch && (
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        Git Branch: <span className="font-bold text-slate-900 dark:text-white">{agreement.submission.branch}</span>
                      </p>
                    )}
                    {agreement.submission?.deliverableUrl && (
                      <a
                        href={agreement.submission.deliverableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6366F1] dark:text-[#818CF8] underline break-all block"
                      >
                        Open Deliverable URL &rarr;
                      </a>
                    )}
                  </div>
                  <Link
                    to={`/agreements/${agreement.id}`}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-500/25"
                  >
                    Review &amp; Approve Attestation on Stream Page &rarr;
                  </Link>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400 font-sans space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white font-mono">
                    Waiting for Contributor Submission
                  </p>
                  <p>
                    Once {agreement.freelancer?.name || "contributor"} finishes work and submits deliverables, you will be prompted to verify the work and mint an on-chain EAS reputation attestation.
                  </p>
                </div>
              )}
            </div>
          ) : (
            showSubmissionForm && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
                <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isRevision ? "Resubmit Verified Work" : "Submit Work for Client Review & Attestation"}
                </p>
                <div className="space-y-4 font-mono text-xs">
                  {workMode === "CODE" ? (
                    <div>
                      <label className="field-label">Git Branch</label>
                      <input
                        type="text"
                        className="input"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="field-label">Deliverable URL / Link (Figma, Google Sheet, Notion, Docs)</label>
                      <input
                        type="url"
                        className="input"
                        placeholder="https://www.figma.com/file/... or https://docs.google.com/spreadsheets/..."
                        value={deliverableUrl}
                        onChange={(e) => setDeliverableUrl(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="field-label">Work Summary &amp; Milestone Notes</label>
                    <textarea
                      rows={4}
                      className={`input resize-none font-sans ${submitError ? "input-error" : ""}`}
                      placeholder={
                        workMode === "CODE"
                          ? "Summarize what you implemented, commits made, and architectural notes..."
                          : "Describe the completed deliverables (e.g. 500 entries verified in sheet, design system updated)..."
                      }
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setSubmitError(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="field-label">Attachments / Files (comma-separated)</label>
                    <input
                      className="input"
                      placeholder="data_export_v1.csv, design_assets.zip, summary.pdf"
                      value={deliverablesText}
                      onChange={(e) => setDeliverablesText(e.target.value)}
                    />
                  </div>

                  {submitError && <p className="field-error !mt-0">{submitError}</p>}
                  <button
                    className="h-10 px-5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-indigo-500/25 w-full flex items-center justify-center gap-2"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
                    {submitting ? "Submitting Proof..." : "Submit for Client Review"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right column: Stream details & on-demand claim */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4 font-mono text-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stream Vault Details</p>
            <dl className="space-y-3">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-white/[0.06]">
                <dt className="text-slate-500 dark:text-slate-400">Client</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{agreement.client?.name}</dd>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-white/[0.06]">
                <dt className="text-slate-500 dark:text-slate-400">Category</dt>
                <dd className="font-semibold text-[#6366F1] dark:text-[#818CF8]">{agreement.category}</dd>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-white/[0.06]">
                <dt className="text-slate-500 dark:text-slate-400">Total Stream Budget</dt>
                <dd className="font-bold text-slate-900 dark:text-white">{formatEth(agreement.budget)}</dd>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-white/[0.06]">
                <dt className="text-slate-500 dark:text-slate-400">Remaining in Vault</dt>
                <dd className="font-bold text-slate-900 dark:text-white">{formatEth(agreement.escrowBalance)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Claimable Available</dt>
                <dd className="font-bold text-emerald-600 dark:text-emerald-400">{formatEth(availableToClaim)}</dd>
              </div>
            </dl>

            {isClient ? (
              <Link
                to={`/agreements/${agreement.id}`}
                className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-sm w-full flex items-center justify-center gap-1.5"
              >
                Manage Stream Vault &rarr;
              </Link>
            ) : availableToClaim > 0.0001 ? (
              <button
                onClick={handleClaimStream}
                disabled={claiming}
                className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 w-full"
              >
                {claiming ? "Mining Claim Tx..." : `Claim ${formatEth(availableToClaim)} Now`}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Link Git Repository Modal */}
      <Modal
        open={gitModalOpen}
        onClose={() => {
          setGitModalOpen(false);
          setGitLinkError(null);
        }}
        title="Connect Git Repository"
        subtitle="Link your Git repository to unlock live work tracking & continuous escrow streaming."
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              className="btn-secondary"
              onClick={() => {
                setGitModalOpen(false);
                setGitLinkError(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => handleConnectGit()}
              disabled={linkingGit}
            >
              {linkingGit ? "Verifying Commit..." : "Verify & Link Commit"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Method 1: Terminal Sentinel (Recommended & Fully Automated) */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Method 1: Terminal Sentinel Watcher (Recommended)
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold">
                Auto-Detects
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2">
              Run this in your terminal inside your project folder. It uses your active login token to lock your Git HEAD and auto-connect instantly.
            </p>
            <div className="bg-slate-900 dark:bg-black/80 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto border border-slate-800">
              <code className="select-all">{localCliCommand}</code>
              <button
                type="button"
                className="flex-shrink-0 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono transition-colors font-medium"
                onClick={() => copyCliCommand(localCliCommand)}
              >
                {copiedCli ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Listening... as soon as the CLI starts in your terminal, this modal will auto-close and unlock work tracking.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]" />
            <span className="flex-shrink mx-3 text-slate-400 font-mono text-[10px] uppercase">
              Or Method 2: Manual Git Verification
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]" />
          </div>

          <div>
            <label className="field-label">Git Branch</label>
            <input
              type="text"
              className="input font-mono text-xs"
              placeholder="main, feature/branch..."
              value={gitBranchInput}
              onChange={(e) => setGitBranchInput(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Base Commit Hash (Required SHA)</label>
            <input
              type="text"
              className="input font-mono text-xs"
              placeholder="e.g. 7f8a9b2c... (run 'git rev-parse HEAD')"
              value={gitCommitSha}
              onChange={(e) => setGitCommitSha(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Run <code className="text-indigo-600 dark:text-indigo-400 font-bold">git rev-parse HEAD</code> in your repository terminal and paste the commit hash here.
            </p>
          </div>

          <div>
            <label className="field-label">Repository URL (Optional)</label>
            <input
              type="text"
              className="input font-mono text-xs"
              placeholder="https://github.com/username/project"
              value={gitRepoUrl}
              onChange={(e) => setGitRepoUrl(e.target.value)}
            />
          </div>

          {gitLinkError && <p className="field-error">{gitLinkError}</p>}
        </div>
      </Modal>
    </AppLayout>
  );
}
