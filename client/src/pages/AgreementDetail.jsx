import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EscrowFlow from "../components/EscrowFlow.jsx";
import SmartContractPanel from "../components/SmartContractPanel.jsx";
import StreamingMeter from "../components/StreamingMeter.jsx";
import RatingModal from "../components/RatingModal.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Avatar from "../components/Avatar.jsx";
import { formatEth, formatDate, formatDateTime, truncateAddress } from "../utils/format.js";
import { useWeb3 } from "../context/Web3Context.jsx";

const TIMELINE_ORDER = ["PENDING_FUNDING", "FUNDED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"];
const TIMELINE_LABELS = {
  PENDING_FUNDING: "Stream covenant drafted",
  FUNDED: "Escrow deposit locked in smart vault",
  IN_PROGRESS: "Payment streaming & Git tracking active",
  SUBMITTED: "Deliverables & cryptographic proof submitted",
  COMPLETED: "Payment settled & EAS attestation minted",
};

function Timeline({ agreement }) {
  if (agreement.status === "CANCELLED") {
    return (
      <div className="flex items-start gap-3 font-mono text-xs p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
        <div className="h-2.5 w-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
        <div>
          <p className="font-semibold text-rose-600 dark:text-rose-300">Stream cancelled &amp; unearned funds refunded</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{formatDateTime(agreement.updatedAt)}</p>
          {agreement.submission?.clientFeedback && (
            <p className="text-slate-800 dark:text-slate-300 mt-1.5 bg-slate-100 dark:bg-[#141414] rounded-lg px-3 py-2 border border-slate-200 dark:border-white/[0.06]">
              {agreement.submission.clientFeedback}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIdx = TIMELINE_ORDER.indexOf(
    agreement.status === "REVISION_REQUESTED" ||
    agreement.status === "PAUSED" ||
    agreement.status === "SETTLEMENT_OFFERED" ||
    agreement.status === "REFUND_PENDING" ||
    agreement.status === "DISPUTED"
      ? "SUBMITTED"
      : agreement.status
  );

  return (
    <div className="space-y-4 font-mono text-xs">
      {TIMELINE_ORDER.map((key, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={key} className="flex items-start gap-3 relative">
            {i < TIMELINE_ORDER.length - 1 && (
              <span
                className={`absolute left-[4.5px] top-4 w-px h-[calc(100%+6px)] ${
                  done ? "bg-emerald-500/40" : "bg-slate-200 dark:bg-white/[0.08]"
                }`}
              />
            )}
            <div
              className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 z-10 ${
                done ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-slate-300 dark:bg-white/[0.15]"
              } ${isCurrent ? "ring-4 ring-emerald-500/20" : ""}`}
            />
            <div>
              <p className={`font-medium ${done ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                {TIMELINE_LABELS[key]}
              </p>
              {done && i === TIMELINE_ORDER.length - 1 && (
                <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(agreement.updatedAt)}</p>
              )}
            </div>
          </div>
        );
      })}
      {agreement.status === "PAUSED" && (
        <div className="ml-5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-300 font-mono">
          Stream is temporarily paused by the client.
        </div>
      )}
      {agreement.status === "REVISION_REQUESTED" && (
        <div className="ml-5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-300 font-mono">
          Revision requested &mdash; contributor is updating deliverables.
        </div>
      )}
      {agreement.status === "SETTLEMENT_OFFERED" && (
        <div className="ml-5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2.5 text-xs text-indigo-700 dark:text-indigo-300 font-mono">
          Partial settlement negotiation active &mdash; awaiting counter or acceptance.
        </div>
      )}
      {agreement.status === "REFUND_PENDING" && (
        <div className="ml-5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300 font-mono">
          100% Refund requested &mdash; 48-Hour Contributor Challenge Window open.
        </div>
      )}
      {agreement.status === "DISPUTED" && (
        <div className="ml-5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300 font-mono">
          Escrow frozen in Dispute &mdash; Cryptographic Git Proof Dossier locked.
        </div>
      )}
    </div>
  );
}

export default function AgreementDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  // Negotiation, Settlement & Reassignment modals
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [arbitrateOpen, setArbitrateOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const [talentList, setTalentList] = useState([]);
  const [loadingTalent, setLoadingTalent] = useState(false);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState("");

  const [workerPayout, setWorkerPayout] = useState(0);
  const [settlementReason, setSettlementReason] = useState("");
  const [counterPayout, setCounterPayout] = useState(0);
  const [counterReason, setCounterReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [appealJustification, setAppealJustification] = useState("");
  const [arbitrateDecision, setArbitrateDecision] = useState("SPLIT");
  const [arbitrateWorkerPayout, setArbitrateWorkerPayout] = useState(0);
  const [arbitrateNotes, setArbitrateNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [actionError, setActionError] = useState(null);

  const [pausing, setPausing] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [startingProject, setStartingProject] = useState(false);
  const [onChainTx, setOnChainTx] = useState(null);

  const {
    account,
    isBaseSepolia,
    shortAddress,
    fundStreamOnChain,
    switchToBaseSepolia,
    CONTRACT_ADDRESSES,
  } = useWeb3();

  function load() {
    api
      .agreement(id)
      .then((res) => setAgreement(res.agreement))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      api
        .agreement(id)
        .then((res) => setAgreement(res.agreement))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <AppLayout title="Stream Agreement">
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
      <AppLayout title="Loading Agreement...">
        <div className="space-y-6">
          <div className="skeleton h-48 w-full rounded-2xl" />
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const isAgreementClient = Boolean(
    (user?.id && agreement.clientId === user.id) ||
    (user?.walletAddress && agreement.client?.walletAddress?.toLowerCase() === user.walletAddress.toLowerCase()) ||
    user?.role === "CLIENT"
  );
  const isAgreementFreelancer = Boolean(
    (user?.id && agreement.freelancerId === user.id) ||
    (user?.walletAddress && agreement.freelancer?.walletAddress?.toLowerCase() === user.walletAddress.toLowerCase()) ||
    (!isAgreementClient && user?.role === "FREELANCER")
  );

  const isClient = isAgreementClient;
  const isFreelancer = isAgreementFreelancer;
  const escrowActive = [
    "FUNDED",
    "IN_PROGRESS",
    "SUBMITTED",
    "REVISION_REQUESTED",
    "SETTLEMENT_OFFERED",
    "REFUND_PENDING",
    "DISPUTED",
  ].includes(agreement.status);

  async function handleStartProject() {
    setStartingProject(true);
    try {
      await api.startProject(agreement.id);
      toast.success("Stream accepted! Work tracking session initialized.");
      load();
      navigate(`/agreements/${agreement.id}/work`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingProject(false);
    }
  }

  async function handlePauseStream() {
    setPausing(true);
    try {
      await api.pauseStream(agreement.id);
      toast.info("Payment stream paused.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPausing(false);
    }
  }

  async function handleResumeStream() {
    setResuming(true);
    try {
      await api.resumeStream(agreement.id);
      toast.success("Payment stream resumed.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResuming(false);
    }
  }

  async function handleCancelStream() {
    try {
      await api.cancelStream(agreement.id);
      toast.success("Stream cancelled and unearned funds refunded.");
      setCancelOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleClaimStream(amount) {
    setClaiming(true);
    try {
      const res = await api.withdrawStream(agreement.id, amount);
      toast.success(
        `Claimed ${formatEth(res.amountWithdrawn)}! Attestation #${res.attestation?.id} minted.`
      );
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClaiming(false);
    }
  }

  async function handleApproveWithRating({ rating, review }) {
    try {
      const res = await api.approve(agreement.id, rating, review);
      toast.success(
        `Approved with ${rating}/5 rating! Attestation #${res.attestation?.id} minted on-chain.`
      );
      setRatingModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRevisionSubmit() {
    if (feedback.trim().length < 5) {
      setActionError("Add detail on what needs revision.");
      return;
    }
    try {
      await api.requestRevision(agreement.id, feedback.trim());
      toast.success("Revision requested. Contributor notified.");
      setRevisionOpen(false);
      setFeedback("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleRejectSubmit() {
    if (reason.trim().length < 5) {
      setActionError("A reason is required to reject a submission.");
      return;
    }
    try {
      await api.reject(agreement.id, reason.trim());
      toast.success("Submission rejected.");
      setRejectOpen(false);
      setReason("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleProposeSettlement() {
    if (!settlementReason.trim() || settlementReason.trim().length < 5) {
      setActionError("Please provide a constructive rationale for the proposed settlement split.");
      return;
    }
    const payoutNum = Number(workerPayout);
    if (isNaN(payoutNum) || payoutNum < 0 || payoutNum > agreement.budget) {
      setActionError(`Payout must be between 0 and total budget (${agreement.budget} ETH/USDC).`);
      return;
    }
    setSubmittingAction(true);
    try {
      await api.proposeSettlement(agreement.id, payoutNum, settlementReason.trim());
      toast.success(`Settlement proposal of ${formatEth(payoutNum)} sent to contributor.`);
      setSettlementOpen(false);
      setSettlementReason("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleAcceptSettlement() {
    setSubmittingAction(true);
    try {
      const res = await api.acceptSettlement(agreement.id);
      toast.success(`Settlement accepted! ${formatEth(res.agreement.settlement.workerPayout)} transferred.`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleCounterSettlement() {
    if (!counterReason.trim() || counterReason.trim().length < 5) {
      setActionError("Please provide a justification for your counter-offer.");
      return;
    }
    const payoutNum = Number(counterPayout);
    if (isNaN(payoutNum) || payoutNum < 0 || payoutNum > agreement.budget) {
      setActionError(`Payout must be between 0 and total budget (${agreement.budget} ETH/USDC).`);
      return;
    }
    setSubmittingAction(true);
    try {
      await api.counterSettlement(agreement.id, payoutNum, counterReason.trim());
      toast.success(`Counter-offer of ${formatEth(payoutNum)} submitted.`);
      setCounterOpen(false);
      setCounterReason("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleRequestFullRefund() {
    if (!refundReason.trim() || refundReason.trim().length < 5) {
      setActionError("A detailed explanation is required for a 100% full refund request.");
      return;
    }
    setSubmittingAction(true);
    try {
      await api.requestFullRefund(agreement.id, refundReason.trim());
      toast.warning("Full refund requested. 48-Hour Contributor Challenge Window is now active.");
      setRefundOpen(false);
      setRefundReason("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleAcceptRefund() {
    setSubmittingAction(true);
    try {
      await api.acceptRefund(agreement.id);
      toast.info("Full refund accepted. Escrow returned to client.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleAppealRefund() {
    if (!appealJustification.trim() || appealJustification.trim().length < 5) {
      setActionError("Please detail the work delivered and commits made to challenge the refund.");
      return;
    }
    setSubmittingAction(true);
    try {
      await api.appealRefund(agreement.id, appealJustification.trim());
      toast.success("Refund challenged! Stream locked in Dispute with Cryptographic Git Proofs.");
      setAppealOpen(false);
      setAppealJustification("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleArbitrateDispute() {
    setSubmittingAction(true);
    try {
      let wp = 0;
      let cr = 0;
      if (arbitrateDecision === "CLIENT_FAVORED") {
        wp = 0;
        cr = agreement.budget;
      } else if (arbitrateDecision === "WORKER_FAVORED") {
        wp = agreement.budget;
        cr = 0;
      } else {
        wp = Number(arbitrateWorkerPayout);
        cr = agreement.budget - wp;
      }
      await api.arbitrateDispute(agreement.id, {
        resolution: arbitrateDecision,
        workerPayout: wp,
        clientRefund: cr,
        arbitratorNotes: arbitrateNotes || "Mutual consensus resolution applied",
      });
      toast.success("Dispute successfully resolved! Vault funds dispatched according to ruling.");
      setArbitrateOpen(false);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function openReassignModal() {
    setReassignOpen(true);
    setLoadingTalent(true);
    try {
      const res = await api.freelancers();
      const available = (res.freelancers || []).filter(
        (f) => f.id !== agreement.freelancerId && f.id !== agreement.clientId
      );
      setTalentList(available);
      if (available.length > 0) {
        setSelectedFreelancerId(available[0].id);
      }
    } catch (err) {
      toast.error("Failed to load talent pool");
    } finally {
      setLoadingTalent(false);
    }
  }

  async function handleReassign() {
    if (!selectedFreelancerId) {
      setActionError("Please select a contributor from the talent pool.");
      return;
    }
    setSubmittingAction(true);
    try {
      await api.reassignAgreement(agreement.id, selectedFreelancerId);
      toast.success("Project successfully reassigned to new contributor!");
      setReassignOpen(false);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleDisputeSubmit() {
    if (disputeReason.trim().length < 5) {
      setActionError("A reason is required to freeze this stream.");
      return;
    }
    setDisputing(true);
    try {
      await api.dispute(agreement.id, disputeReason.trim());
      toast.success("Stream frozen & dispute logged.");
      setDisputeOpen(false);
      setDisputeReason("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDisputing(false);
    }
  }

  const ratePerSec = Number(agreement.ratePerSecond || 0);
  const ratePerHr = ratePerSec * 3600;

  return (
    <AppLayout
      title={agreement.title}
      subtitle={`Stream Agreement #${agreement.id} \u2014 ${agreement.category}`}
    >
      {/* Top Breadcrumb Link */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/agreements"
          className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white inline-flex items-center gap-1.5 transition-colors"
        >
          &larr; <span>Back to Payment Streams</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-500">
          Created {formatDateTime(agreement.createdAt)}
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Header Bento + Live Meter + Escrow Architecture + Proofs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Obsidian Bento Header Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top Badge Row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] border border-indigo-200 dark:border-indigo-500/30">
                  {agreement.category}
                </span>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 rounded-lg">
                  ID: #{agreement.id}
                </span>
                <a
                  href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.AvenEscrowStream}#code`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-lg hover:underline flex items-center gap-1.5"
                  title="View live AvenEscrowStream contract on Basescan"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Base Sepolia Vault: {truncateAddress(CONTRACT_ADDRESSES.AvenEscrowStream)}</span>
                </a>
                {(agreement.onChainFundingTx || onChainTx) && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${agreement.onChainFundingTx || onChainTx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 px-2.5 py-1 rounded-lg hover:underline flex items-center gap-1.5"
                    title="View on-chain funding transaction on Basescan"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span>Funding Tx: {truncateAddress(agreement.onChainFundingTx || onChainTx)}</span>
                  </a>
                )}
              </div>
              <StatusBadge status={agreement.status} />
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight font-sans">
                {agreement.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-3 font-sans">
                {agreement.description}
              </p>
            </div>

            {/* 5-Column Bento Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-6 border-t border-slate-200 dark:border-white/[0.06] font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Total Deposit</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{formatEth(agreement.budget)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Vault Balance</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-1">{formatEth(agreement.escrowBalance)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Streamed (Earned)</p>
                <p className="font-bold text-[#6366F1] dark:text-[#818CF8] text-sm mt-1">{formatEth(agreement.earnedAmount || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Flow Rate</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{formatEth(ratePerHr)}/hr</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] col-span-2 sm:col-span-1">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Deadline</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1 truncate">{formatDate(agreement.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Active Settlement Negotiation Card */}
          {agreement.status === "SETTLEMENT_OFFERED" && agreement.settlement && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/30 shadow-sm dark:shadow-2xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">
                    Active Partial Settlement Negotiation
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30">
                  Proposed by {agreement.settlement.proposedBy === agreement.clientId ? "Client" : "Contributor"}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    Contributor Payout (Earned)
                  </span>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatEth(agreement.settlement.workerPayout)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ({Math.round((agreement.settlement.workerPayout / agreement.budget) * 100)}% of total budget)
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    Client Refund (Returned to Vault)
                  </span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatEth(agreement.settlement.clientRefund)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ({Math.round((agreement.settlement.clientRefund / agreement.budget) * 100)}% refund)
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] text-xs font-sans space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                  Proposer's Justification &amp; Rationale:
                </p>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  "{agreement.settlement.reason}"
                </p>
              </div>

              {agreement.settlement.counterHistory?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Negotiation History ({agreement.settlement.counterHistory.length} previous offers)
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {agreement.settlement.counterHistory.map((ch, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] text-xs font-mono flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {ch.proposedBy === agreement.clientId ? "Client" : "Contributor"}: {formatEth(ch.workerPayout)}
                          </span>
                          <p className="text-[10px] text-slate-500 truncate max-w-sm mt-0.5">"{ch.reason}"</p>
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDate(ch.proposedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {((isFreelancer && agreement.settlement.proposedBy === agreement.clientId) ||
                  (isClient && agreement.settlement.proposedBy === agreement.freelancerId)) && (
                  <>
                    <button
                      className="btn-primary flex-1 min-w-[160px] text-xs py-2.5 shadow-md shadow-indigo-500/20"
                      onClick={handleAcceptSettlement}
                      disabled={submittingAction}
                    >
                      {submittingAction ? "Processing..." : `Accept Settlement (${formatEth(agreement.settlement.workerPayout)})`}
                    </button>
                    <button
                      className="btn-secondary flex-1 min-w-[140px] text-xs py-2.5"
                      onClick={() => {
                        setCounterPayout(agreement.settlement.workerPayout);
                        setCounterOpen(true);
                      }}
                      disabled={submittingAction}
                    >
                      Counter-Offer Split
                    </button>
                  </>
                )}
                {isFreelancer && (
                  <button
                    className="btn-danger text-xs py-2.5 px-4"
                    onClick={() => {
                      setDisputeReason("Rejecting partial settlement. Requesting full dispute mediation with cryptographic Git proofs.");
                      setDisputeOpen(true);
                    }}
                  >
                    Reject &amp; Escalate to Dispute
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 100% Full Refund Challenge Window Card */}
          {agreement.status === "REFUND_PENDING" && agreement.refund && (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm dark:shadow-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200 font-sans">
                    100% Full Refund Requested &mdash; 48-Hour Contributor Challenge Window
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30">
                  Escrow Protected
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-amber-500/20 space-y-2 text-xs font-sans">
                <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] uppercase tracking-wider">
                  Client's Rejection Rationale:
                </p>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  "{agreement.refund.reason}"
                </p>
                <p className="text-[11px] text-slate-500 font-mono pt-1">
                  Requested on: {formatDateTime(agreement.refund.requestedAt)} &bull; Challenge window open until: {formatDateTime(agreement.refund.challengeWindowEndsAt)}
                </p>
              </div>

              {isFreelancer && (
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    className="h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold uppercase tracking-wide transition-all shadow-md flex-1 min-w-[200px]"
                    onClick={() => setAppealOpen(true)}
                    disabled={submittingAction}
                  >
                    Appeal Rejection &amp; Escalate (Submit Git Proofs)
                  </button>
                  <button
                    className="btn-secondary text-xs py-2.5 px-4"
                    onClick={handleAcceptRefund}
                    disabled={submittingAction}
                  >
                    Accept 100% Refund &amp; Close
                  </button>
                </div>
              )}

              {isClient && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs font-mono text-amber-800 dark:text-amber-300">
                  Awaiting contributor response. If the contributor does not challenge within the 48-hour window or accepts the refund, 100% of escrow funds ({formatEth(agreement.budget)}) will be returned to your wallet.
                </div>
              )}
            </div>
          )}

          {/* Dispute & Cryptographic Proof Dossier Card */}
          {agreement.status === "DISPUTED" && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-sm dark:shadow-2xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200 font-sans">
                    Escrow Frozen in Dispute Arbitration
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300 font-semibold border border-rose-500/30">
                  Proof-of-Work Dossier Compiled
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] space-y-1">
                  <p className="font-semibold text-rose-600 dark:text-rose-400 font-mono text-[11px] uppercase tracking-wider">
                    Client Allegation / Refund Request:
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 italic">
                    "{agreement.disputeProof?.clientAllegation || agreement.disputeReason || agreement.refund?.reason || "Work disputed"}"
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] space-y-1">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px] uppercase tracking-wider">
                    Contributor Appeal &amp; Justification:
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 italic">
                    "{agreement.disputeProof?.justification || "Contributor claims work was legitimately delivered with verified commits."}"
                  </p>
                </div>
              </div>

              {agreement.disputeProof?.gitMetrics && (
                <div className="space-y-2">
                  <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Immutable Git Proof Bundle Captured at Freeze:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900 text-white text-xs font-mono border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Verified Commits</span>
                      <span className="font-bold text-base text-emerald-400">{agreement.disputeProof.gitMetrics.commitsCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Changed Files</span>
                      <span className="font-bold text-base text-indigo-400">{agreement.disputeProof.gitMetrics.changedFilesCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lines Added</span>
                      <span className="font-bold text-base text-emerald-400">+{agreement.disputeProof.gitMetrics.linesAdded}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lines Deleted</span>
                      <span className="font-bold text-base text-rose-400">-{agreement.disputeProof.gitMetrics.linesDeleted}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl text-[11px] font-mono text-slate-300 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Base Commit: <code className="text-indigo-300">{agreement.disputeProof.gitMetrics.baseCommit?.slice(0, 12)}...</code></span>
                      <span>Head Commit: <code className="text-indigo-300">{agreement.disputeProof.gitMetrics.headCommit?.slice(0, 12)}...</code></span>
                    </div>
                    {agreement.disputeProof.gitMetrics.reportHash && (
                      <p className="text-slate-400 truncate">
                        Merkle Session Hash: <code className="text-emerald-400">{agreement.disputeProof.gitMetrics.reportHash}</code>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  className="btn-primary text-xs py-2.5 px-4 shadow-md"
                  onClick={() => {
                    setArbitrateWorkerPayout(Math.round(agreement.budget * 0.5 * 100) / 100);
                    setArbitrateOpen(true);
                  }}
                >
                  Resolve Dispute via Binding Arbitration &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Real-Time Live Streaming Meter */}
          {agreement.status !== "PENDING_FUNDING" && (
            <StreamingMeter
              agreement={agreement}
              isFreelancer={isFreelancer}
              onClaim={handleClaimStream}
              claiming={claiming}
            />
          )}

          {/* Escrow Architecture Visualization */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Smart Escrow Flow Architecture
              </p>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Non-Custodial Vault Active
              </span>
            </div>
            <EscrowFlow
              fromLabel={agreement.client?.avatar}
              fromName={agreement.client?.name}
              toLabel={agreement.freelancer?.avatar}
              toName={agreement.freelancer?.name}
              amount={formatEth(agreement.budget)}
              active={escrowActive}
            />
          </div>

          {/* Minted EAS Attestations List */}
          {agreement.attestations && agreement.attestations.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Minted EAS Attestations ({agreement.attestations.length})
                </p>
                <Link to="/attestations" className="text-xs font-mono text-[#6366F1] dark:text-[#818CF8] hover:underline">
                  Attestation Registry &rarr;
                </Link>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06] bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06] p-4">
                {agreement.attestations.map((att) => (
                  <div key={att.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#6366F1] dark:text-[#818CF8]">#{att.id}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{att.title || "Payment Attestation"}</span>
                        {att.clientConfirmed && (
                          <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px]">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Amount: <strong className="text-emerald-600 dark:text-emerald-400">{formatEth(att.amountPaid)}</strong> &middot; {formatDate(att.createdAt)}
                      </p>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[130px] font-mono">
                      {truncateAddress(att.reportHash)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cryptographic Proof & Git Range Inspector */}
          {(agreement.submission || agreement.session) && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cryptographic Proof &amp; Git Inspector
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                    Session commit range verified against Ethereum consensus ledger
                  </p>
                </div>
                {agreement.submission ? (
                  <StatusBadge status={agreement.submission.status} />
                ) : Boolean(agreement.submission?.reportHash || (agreement.session?.baseCommit && agreement.session.baseCommit !== "0000000000000000000000000000000000000000")) ? (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    Live Watcher Synced
                  </span>
                ) : agreement.session?.status === "RUNNING" ? (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                    Browser Timer Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                    Standby (No Git Link)
                  </span>
                )}
              </div>

              {agreement.submission?.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{agreement.submission.description}</p>
              )}

              {/* Verified Commit Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] text-xs font-mono border border-slate-200 dark:border-white/[0.06]">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase tracking-wider mb-1">Base Commit Locked:</span>
                  <span className="font-semibold break-all text-[#6366F1] dark:text-[#818CF8]">
                    {(!agreement.submission?.baseCommit && (!agreement.session?.baseCommit || agreement.session?.baseCommit === "0000000000000000000000000000000000000000")) ? (
                      <span className="text-slate-400 dark:text-slate-500 font-normal italic">None (Browser Timer Mode - No Git Link)</span>
                    ) : (
                      agreement.submission?.baseCommit || agreement.session?.baseCommit
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase tracking-wider mb-1">Head Commit Recorded:</span>
                  <span className="font-semibold break-all text-[#6366F1] dark:text-[#818CF8]">
                    {(!agreement.submission?.headCommit && (!agreement.session?.headCommit || agreement.session?.headCommit === "0000000000000000000000000000000000000000")) ? (
                      <span className="text-slate-400 dark:text-slate-500 font-normal italic">None (Awaiting CLI Git Commit)</span>
                    ) : (
                      agreement.submission?.headCommit || agreement.session?.headCommit || agreement.session?.baseCommit
                    )}
                  </span>
                </div>
              </div>

              {/* Git Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#141414] text-xs font-mono">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Git Branch</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {agreement.submission?.branch || agreement.session?.branch || "main"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Commits</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {agreement.submission?.commitsCount || agreement.session?.commitsCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Files Modified</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {agreement.submission?.changedFilesCount || agreement.session?.changedFilesCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Cumulative Diffs</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{agreement.submission?.linesAdded || agreement.session?.linesAdded || 0}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    -{agreement.submission?.linesDeleted || agreement.session?.linesDeleted || 0}
                  </span>
                </div>
              </div>

              {!agreement.submission && !agreement.session?.reportHash && (!agreement.session?.baseCommit || agreement.session.baseCommit === "0000000000000000000000000000000000000000") && (
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-dashed border-slate-200 dark:border-white/[0.08] p-3 text-xs font-mono text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
                  <span className="text-sm shrink-0">💡</span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Browser Timer Active</p>
                    <p className="text-[11px] leading-relaxed">
                      Worker is tracking work directly from the browser. If they run the <strong>Sidekick Git Watcher CLI</strong> in their repository, live commit hashes and code diffs will appear here automatically.
                    </p>
                  </div>
                </div>
              )}

              {(agreement.submission?.reportHash || agreement.session?.reportHash) && (
                <div className="text-xs font-mono bg-slate-100 dark:bg-[#050505] p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6366F1] dark:text-[#818CF8] font-semibold uppercase tracking-wider">
                      SHA-256 Merkle Session Hash:
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Consensus Verified
                    </span>
                  </div>
                  <p className="break-all text-slate-700 dark:text-slate-300">{agreement.submission?.reportHash || agreement.session?.reportHash}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
            <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On-Chain Activity Timeline
            </p>
            <Timeline agreement={agreement} />
          </div>
        </div>

        {/* Right Column (4 cols): Smart Contract Panel + Counterparties + Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Smart Contract Panel */}
          <SmartContractPanel agreement={agreement} />

          {/* Counterparties Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-5">
            <div>
              <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Client (Sender)
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <Avatar
                  user={agreement.client}
                  size="md"
                  rounded="rounded-xl"
                  showBorder
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{agreement.client?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{truncateAddress(agreement.client?.walletAddress)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contributor (Recipient)
                </p>
                {agreement.freelancer?.reputationScore > 0 && (
                  <Link
                    to="/reputation"
                    className="text-[10px] font-mono font-medium text-[#6366F1] dark:text-[#818CF8] bg-indigo-50 dark:bg-[#6366F1]/15 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                  >
                    Rep: {agreement.freelancer.reputationScore} pts
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <Avatar
                  user={agreement.freelancer}
                  size="md"
                  rounded="rounded-xl"
                  showBorder
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{agreement.freelancer?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{truncateAddress(agreement.freelancer?.walletAddress)}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Stream Actions & Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-3 font-mono">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {isClient ? "Client Stream Actions" : "Worker Actions"}
            </p>

            {isClient && (
              <>
                {agreement.status === "PENDING_FUNDING" && (
                  <button className="btn-primary w-full shadow-lg shadow-indigo-500/30" onClick={() => setFundOpen(true)}>
                    Fund Payment Stream Vault &rarr;
                  </button>
                )}

                {agreement.status === "FUNDED" && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Vault Funded &amp; Locked
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                        Waiting for contributor {agreement.freelancer?.name || "freelancer"} to accept the agreement and initiate work tracking.
                      </p>
                    </div>
                    <button
                      className="btn-danger w-full text-xs"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Stream &amp; Refund Vault
                    </button>
                  </div>
                )}

                {agreement.status === "IN_PROGRESS" && (
                  <div className="space-y-2">
                    <Link
                      to={`/agreements/${agreement.id}/work`}
                      className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] w-full text-center flex items-center justify-center gap-2 text-xs font-mono transition-all shadow-sm"
                    >
                      <span className={`h-2 w-2 rounded-full ${agreement.session?.status === "RUNNING" ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`} />
                      {agreement.session?.status === "RUNNING" ? "Monitor Contributor Session (Timer Active)" : "View Contributor Telemetry & Proofs"}
                    </Link>
                    <button
                      className="btn-secondary w-full text-xs"
                      onClick={handlePauseStream}
                      disabled={pausing}
                    >
                      {pausing ? "Pausing..." : "Pause Stream"}
                    </button>
                    <button
                      className="h-10 px-4 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25 w-full text-xs uppercase font-medium transition-all"
                      onClick={() => setDisputeOpen(true)}
                    >
                      Freeze &amp; Raise Dispute
                    </button>
                    <button
                      className="btn-danger w-full text-xs"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Stream &amp; Refund
                    </button>
                  </div>
                )}

                {agreement.status === "PAUSED" && (
                  <div className="space-y-2">
                    <button
                      className="btn-primary w-full text-xs"
                      onClick={handleResumeStream}
                      disabled={resuming}
                    >
                      {resuming ? "Resuming..." : "Resume Stream"}
                    </button>
                    <button
                      className="h-10 px-4 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25 w-full text-xs uppercase font-medium transition-all"
                      onClick={() => setDisputeOpen(true)}
                    >
                      Freeze &amp; Raise Dispute
                    </button>
                    <button
                      className="btn-danger w-full text-xs"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Stream &amp; Refund
                    </button>
                  </div>
                )}

                {agreement.status === "DISPUTED" && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 space-y-2">
                    <p className="font-bold">Stream Frozen &amp; Disputed</p>
                    <p>{agreement.disputeReason || agreement.refund?.reason || "Stream has been frozen in non-custodial dispute."}</p>
                    <button
                      className="btn-primary w-full mt-2 text-xs"
                      onClick={() => {
                        setArbitrateWorkerPayout(Math.round(agreement.budget * 0.5 * 100) / 100);
                        setArbitrateOpen(true);
                      }}
                    >
                      Arbitrate &amp; Settle Vault
                    </button>
                  </div>
                )}

                {agreement.status === "SETTLEMENT_OFFERED" && (
                  <div className="space-y-2.5 p-3.5 bg-indigo-50 dark:bg-[#6366F1]/10 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-xs">
                    <p className="font-semibold text-indigo-900 dark:text-indigo-200">
                      Settlement Pending
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
                      Proposed payout: <strong>{formatEth(agreement.settlement?.workerPayout)}</strong> to contributor, <strong>{formatEth(agreement.settlement?.clientRefund)}</strong> refunded to you.
                    </p>
                    {agreement.settlement?.proposedBy === agreement.freelancerId && (
                      <button
                        className="btn-primary w-full text-xs"
                        onClick={handleAcceptSettlement}
                        disabled={submittingAction}
                      >
                        Accept Contributor Counter-Offer
                      </button>
                    )}
                  </div>
                )}

                {agreement.status === "REFUND_PENDING" && (
                  <div className="space-y-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      100% Refund Challenging Active
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
                      Waiting for contributor challenge or acceptance within the 48-hour challenge window.
                    </p>
                  </div>
                )}

                {agreement.status === "SUBMITTED" && (
                  <div className="space-y-2.5">
                    <button
                      className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 w-full"
                      onClick={() => setRatingModalOpen(true)}
                    >
                      Approve &amp; Mint Attestation (100%)
                    </button>
                    <button className="btn-secondary w-full text-xs" onClick={() => setRevisionOpen(true)}>
                      Request Revision
                    </button>
                    <button
                      className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase tracking-wide transition-all shadow-md w-full"
                      onClick={() => {
                        setWorkerPayout(Math.round(agreement.budget * 0.6 * 100) / 100);
                        setSettlementOpen(true);
                      }}
                    >
                      Offer Partial Settlement
                    </button>
                    <button
                      className="btn-danger w-full text-xs"
                      onClick={() => setRefundOpen(true)}
                    >
                      Claim 100% Full Refund
                    </button>
                  </div>
                )}

                {agreement.status === "COMPLETED" && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                    <p className="font-semibold">Stream Fully Settled</p>
                    <p>Attestation minted and reputation score updated on-chain.</p>
                  </div>
                )}

                {agreement.status === "CANCELLED" && (
                  <div className="space-y-3">
                    <p className="text-xs text-rose-500 dark:text-rose-400 font-sans p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                      This stream was cancelled and unearned funds were refunded.
                    </p>
                    <button
                      className="btn-primary w-full text-xs shadow-lg shadow-indigo-500/25"
                      onClick={openReassignModal}
                    >
                      Reassign Project to New Contributor &rarr;
                    </button>
                  </div>
                )}
              </>
            )}

            {!isClient && (
              <>
                {agreement.status === "PENDING_FUNDING" && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                    Waiting for {agreement.client?.name} to fund the payment stream.
                  </p>
                )}

                {agreement.status === "FUNDED" && (
                  <button className="btn-primary w-full text-xs shadow-lg shadow-indigo-500/25" onClick={handleStartProject} disabled={startingProject}>
                    {startingProject && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
                    {startingProject ? "Starting Project..." : "Accept & Open Work Session"}
                  </button>
                )}

                {(agreement.status === "IN_PROGRESS" || agreement.status === "PAUSED") && (
                  <div className="space-y-2">
                    <Link to={`/agreements/${agreement.id}/work`} className="btn-primary w-full text-center flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-500/25">
                      <span className={`h-2 w-2 rounded-full ${agreement.session?.status === "RUNNING" ? "bg-emerald-400 animate-ping" : "bg-white/40"}`} />
                      {agreement.session?.status === "RUNNING" ? "Open Active Work Session (Timer ON)" : "Open Work Session & Start Timer"}
                    </Link>
                  </div>
                )}

                {agreement.status === "SUBMITTED" && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                      Waiting for {agreement.client?.name} to verify your submission.
                    </p>
                    <button
                      className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 w-full"
                      onClick={() => setRatingModalOpen(true)}
                    >
                      Approve &amp; Mint Attestation (Demo Mode)
                    </button>
                  </div>
                )}

                {agreement.status === "SETTLEMENT_OFFERED" && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-indigo-50 dark:bg-[#6366F1]/10 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-indigo-900 dark:text-indigo-200">
                        Partial Settlement Offered
                      </p>
                      <p className="text-[11px] font-sans">
                        Client offered a payout of <strong>{formatEth(agreement.settlement?.workerPayout)}</strong>.
                      </p>
                    </div>
                    {agreement.settlement?.proposedBy === agreement.clientId && (
                      <>
                        <button
                          className="btn-primary w-full text-xs"
                          onClick={handleAcceptSettlement}
                          disabled={submittingAction}
                        >
                          Accept Payout ({formatEth(agreement.settlement?.workerPayout)})
                        </button>
                        <button
                          className="btn-secondary w-full text-xs"
                          onClick={() => {
                            setCounterPayout(agreement.settlement?.workerPayout || 0);
                            setCounterOpen(true);
                          }}
                        >
                          Counter-Offer Payout
                        </button>
                      </>
                    )}
                    <button
                      className="btn-danger w-full text-xs"
                      onClick={() => {
                        setDisputeReason("Rejecting partial settlement. Requesting arbitration with cryptographic Git proofs.");
                        setDisputeOpen(true);
                      }}
                    >
                      Reject &amp; Escalate Dispute
                    </button>
                  </div>
                )}

                {agreement.status === "REFUND_PENDING" && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        100% Refund Challenge Window
                      </p>
                      <p className="text-[11px] font-sans">
                        Client claimed 100% refund. You have 48h to appeal and submit your cryptographic Git proofs.
                      </p>
                    </div>
                    <button
                      className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold uppercase tracking-wide transition-all shadow-md w-full"
                      onClick={() => setAppealOpen(true)}
                    >
                      Appeal &amp; Lock Git Proofs
                    </button>
                    <button
                      className="btn-secondary w-full text-xs"
                      onClick={handleAcceptRefund}
                    >
                      Accept Refund &amp; Close
                    </button>
                  </div>
                )}

                {agreement.status === "DISPUTED" && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 space-y-2">
                    <p className="font-bold">Stream Frozen in Dispute</p>
                    <p className="text-[11px]">Git proof dossier locked. Mutual arbitration is active.</p>
                    <button
                      className="btn-primary w-full text-xs"
                      onClick={() => {
                        setArbitrateWorkerPayout(Math.round(agreement.budget * 0.5 * 100) / 100);
                        setArbitrateOpen(true);
                      }}
                    >
                      Arbitrate &amp; Settle Vault
                    </button>
                  </div>
                )}

                {agreement.status === "COMPLETED" && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                    <p className="font-semibold">You earned {formatEth(agreement.budget)}</p>
                    <Link to="/reputation" className="text-[#6366F1] dark:text-[#818CF8] underline font-semibold mt-1 block">
                      View On-Chain Attestation &rarr;
                    </Link>
                  </div>
                )}

                {agreement.status === "CANCELLED" && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-sans p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                    This stream was cancelled.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fund Escrow confirm */}
      <ConfirmDialog
        open={fundOpen}
        onClose={() => setFundOpen(false)}
        title="Fund Stream Escrow"
        subtitle={agreement.title}
        confirmLabel="Confirm & Lock Deposit"
        loadingLabel="Locking in vault..."
        onConfirm={async () => {
          let txHash = null;
          if (account) {
            try {
              if (!isBaseSepolia) {
                toast.info("Switching MetaMask to Base Sepolia...");
                await switchToBaseSepolia();
              }
              toast.info("Step 1/2: Approving MockUSDC transfer in MetaMask...");

              let freelancerWallet = agreement.freelancer?.walletAddress;
              if (
                !freelancerWallet ||
                freelancerWallet === "0x0000000000000000000000000000000000000000" ||
                freelancerWallet.toLowerCase() === account.toLowerCase()
              ) {
                freelancerWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
              }

              const res = await fundStreamOnChain({
                freelancerAddress: freelancerWallet,
                budget: agreement.budget || 100,
                durationSeconds: 86400,
                withdrawableCapPercent: 75,
                externalAgreementId: agreement.id,
              });

              if (res?.txHash) {
                txHash = res.txHash;
                setOnChainTx(txHash);
                toast.success(`Funded on Base Sepolia! Tx: ${txHash.slice(0, 10)}...`);
              }
            } catch (onChainErr) {
              console.warn("On-chain execution notice:", onChainErr);
              toast.warning(`MetaMask Notice: ${onChainErr.message || "Simulated lock will proceed"}`);
            }
          }

          await api.fundEscrow(agreement.id, { onChainTx: txHash });
          toast.success("Stream funded successfully.");
          setFundOpen(false);
          load();
        }}
      >
        <div className="rounded-xl bg-slate-50 dark:bg-[#141414] p-4 border border-slate-200 dark:border-white/[0.06]">
          <EscrowFlow
            fromLabel={agreement.client?.avatar}
            fromName={agreement.client?.name}
            toLabel={agreement.freelancer?.avatar}
            toName={agreement.freelancer?.name}
            amount={formatEth(agreement.budget)}
            active
          />
        </div>

        {/* Web3 Execution Pill */}
        {account ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-mono">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Web3: {shortAddress}
              </span>
              <span className="text-[10px] uppercase font-bold bg-emerald-100 dark:bg-emerald-800/60 px-2 py-0.5 rounded">
                Base Sepolia
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Clicking confirm will trigger a real on-chain transaction on contract <code className="text-emerald-700 dark:text-emerald-300">0x5Cfa...C6F9</code>.
            </p>
          </div>
        ) : (
          <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-500">
            <span>MetaMask not connected &bull; Escrow will lock in local simulation mode.</span>
          </div>
        )}

        {onChainTx && (
          <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-[#6366F1]/15 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between text-xs font-mono">
            <span className="text-[#6366F1] dark:text-[#818CF8] font-medium">Basescan Tx Hash:</span>
            <a
              href={`https://sepolia.basescan.org/tx/${onChainTx}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
            >
              View on Basescan &rarr;
            </a>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-mono">
          <strong className="text-slate-900 dark:text-white">{formatEth(agreement.budget)}</strong> will be locked in the Sidekick Stream Contract and flow continuously as work is verified.
        </p>
      </ConfirmDialog>

      {/* Cancel Stream Confirm */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Payment Stream?"
        subtitle={agreement.title}
        tone="danger"
        confirmLabel="Confirm Cancellation"
        loadingLabel="Refunding..."
        onConfirm={handleCancelStream}
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
          Cancelling will immediately halt stream flow, transfer any earned-but-unwithdrawn tokens to the worker, and return all remaining unearned tokens back to your wallet.
        </p>
      </ConfirmDialog>

      {/* Rating & Review Modal upon Approval */}
      <RatingModal
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        agreement={agreement}
        onApprove={handleApproveWithRating}
      />

      {/* Request revision modal */}
      <Modal
        open={revisionOpen}
        onClose={() => {
          setRevisionOpen(false);
          setActionError(null);
        }}
        title="Request Revision"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRevisionOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleRevisionSubmit}>
              Request Revision
            </button>
          </>
        }
      >
        <label className="field-label">Revision feedback</label>
        <textarea
          rows={4}
          className={`input resize-none ${actionError ? "input-error" : ""}`}
          placeholder="Explain what needs to change before you can approve this submission..."
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            setActionError(null);
          }}
        />
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setActionError(null);
        }}
        title="Reject Submission"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </button>
            <button
              className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md"
              onClick={handleRejectSubmit}
            >
              Reject &amp; Refund
            </button>
          </>
        }
      >
        <label className="field-label">Reason for rejection</label>
        <textarea
          rows={4}
          className={`input resize-none ${actionError ? "input-error" : ""}`}
          placeholder="This ends the stream and settles earned funds, so explain clearly..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setActionError(null);
          }}
        />
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>

      {/* Dispute modal */}
      <Modal
        open={disputeOpen}
        onClose={() => {
          setDisputeOpen(false);
          setActionError(null);
        }}
        title="Freeze Stream & Raise Dispute"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDisputeOpen(false)}>
              Cancel
            </button>
            <button
              className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md"
              onClick={handleDisputeSubmit}
              disabled={disputing}
            >
              {disputing ? "Freezing..." : "Freeze & Lock Stream"}
            </button>
          </>
        }
      >
        <label className="field-label">Reason for freezing / dispute</label>
        <textarea
          rows={4}
          className={`input resize-none ${actionError ? "input-error" : ""}`}
          placeholder="Explain the issue (e.g. inactive worker, fake metrics, scope breach)..."
          value={disputeReason}
          onChange={(e) => {
            setDisputeReason(e.target.value);
            setActionError(null);
          }}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
          Freezing immediately halts stream accrual and blocks on-demand withdrawals from the vault.
        </p>
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>

      {/* Partial Settlement Proposal Modal */}
      <Modal
        open={settlementOpen}
        onClose={() => {
          setSettlementOpen(false);
          setActionError(null);
        }}
        title="Offer Partial Settlement"
        subtitle={`Total agreement budget: ${formatEth(agreement.budget)}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSettlementOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleProposeSettlement}
              disabled={submittingAction}
            >
              {submittingAction ? "Submitting..." : "Propose Settlement"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="field-label mb-0">Contributor Payout Amount</label>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatEth(Number(workerPayout) || 0)}
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              max={agreement.budget}
              className="input font-mono text-sm"
              value={workerPayout}
              onChange={(e) => setWorkerPayout(e.target.value)}
            />
            <input
              type="range"
              min="0"
              max={agreement.budget}
              step="0.01"
              className="w-full mt-2 accent-indigo-500 cursor-pointer"
              value={workerPayout || 0}
              onChange={(e) => setWorkerPayout(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Contributor Earns</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatEth(Number(workerPayout) || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Refunded to You</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatEth(Math.max(0, agreement.budget - (Number(workerPayout) || 0)))}
              </span>
            </div>
          </div>

          <div>
            <label className="field-label">Rationale &amp; Constructive Feedback (Required)</label>
            <textarea
              rows={4}
              className={`input resize-none ${actionError ? "input-error" : ""}`}
              placeholder="Explain why this split is fair (e.g., delivered core backend APIs, but incomplete frontend styling)..."
              value={settlementReason}
              onChange={(e) => {
                setSettlementReason(e.target.value);
                setActionError(null);
              }}
            />
          </div>
          {actionError && <p className="field-error">{actionError}</p>}
        </div>
      </Modal>

      {/* Counter-Offer Settlement Modal */}
      <Modal
        open={counterOpen}
        onClose={() => {
          setCounterOpen(false);
          setActionError(null);
        }}
        title="Counter-Offer Settlement Split"
        subtitle={`Total agreement budget: ${formatEth(agreement.budget)}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCounterOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCounterSettlement}
              disabled={submittingAction}
            >
              {submittingAction ? "Submitting..." : "Submit Counter-Offer"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="field-label mb-0">Adjusted Contributor Payout</label>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatEth(Number(counterPayout) || 0)}
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              max={agreement.budget}
              className="input font-mono text-sm"
              value={counterPayout}
              onChange={(e) => setCounterPayout(e.target.value)}
            />
            <input
              type="range"
              min="0"
              max={agreement.budget}
              step="0.01"
              className="w-full mt-2 accent-indigo-500 cursor-pointer"
              value={counterPayout || 0}
              onChange={(e) => setCounterPayout(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Contributor Earns</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatEth(Number(counterPayout) || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Refunded to Client</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatEth(Math.max(0, agreement.budget - (Number(counterPayout) || 0)))}
              </span>
            </div>
          </div>

          <div>
            <label className="field-label">Justification for Counter-Offer (Required)</label>
            <textarea
              rows={4}
              className={`input resize-none ${actionError ? "input-error" : ""}`}
              placeholder="Explain why the adjusted payout represents fair compensation for work delivered..."
              value={counterReason}
              onChange={(e) => {
                setCounterReason(e.target.value);
                setActionError(null);
              }}
            />
          </div>
          {actionError && <p className="field-error">{actionError}</p>}
        </div>
      </Modal>

      {/* 100% Full Refund Modal */}
      <Modal
        open={refundOpen}
        onClose={() => {
          setRefundOpen(false);
          setActionError(null);
        }}
        title="Claim 100% Full Refund"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRefundOpen(false)}>
              Cancel
            </button>
            <button
              className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md"
              onClick={handleRequestFullRefund}
              disabled={submittingAction}
            >
              {submittingAction ? "Processing..." : "Claim 100% Refund"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold">⚠️ 48-Hour Contributor Challenge Window Notice</p>
            <p className="text-[11px] leading-relaxed">
              Requesting a full 100% refund initiates a challenge window. The contributor can accept the refund or appeal with cryptographic Git proof-of-work if work was genuinely delivered.
            </p>
          </div>

          <div>
            <label className="field-label">Reason for 100% Refund Claim (Required)</label>
            <textarea
              rows={4}
              className={`input resize-none ${actionError ? "input-error" : ""}`}
              placeholder="Explain in detail why the deliverable failed to meet expectations or was not delivered..."
              value={refundReason}
              onChange={(e) => {
                setRefundReason(e.target.value);
                setActionError(null);
              }}
            />
          </div>
          {actionError && <p className="field-error">{actionError}</p>}
        </div>
      </Modal>

      {/* Appeal Rejection Modal */}
      <Modal
        open={appealOpen}
        onClose={() => {
          setAppealOpen(false);
          setActionError(null);
        }}
        title="Appeal Rejection & Lock Escrow"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAppealOpen(false)}>
              Cancel
            </button>
            <button
              className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md"
              onClick={handleAppealRefund}
              disabled={submittingAction}
            >
              {submittingAction ? "Submitting..." : "Submit Appeal & Lock Git Proofs"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-[#6366F1]/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300 space-y-1 font-mono">
            <p className="font-semibold">Cryptographic Proof-of-Work Verification</p>
            <p className="text-[11px] leading-relaxed font-sans">
              Appealing will freeze the smart contract vault in dispute and generate an immutable evidence dossier featuring your commit range, changed files, line diffs, and Merkle session hash.
            </p>
          </div>

          <div>
            <label className="field-label">Your Justification &amp; Defense (Required)</label>
            <textarea
              rows={4}
              className={`input resize-none ${actionError ? "input-error" : ""}`}
              placeholder="Detail the work you completed, tests run, commits pushed, and why a 100% refund is unjustified..."
              value={appealJustification}
              onChange={(e) => {
                setAppealJustification(e.target.value);
                setActionError(null);
              }}
            />
          </div>
          {actionError && <p className="field-error">{actionError}</p>}
        </div>
      </Modal>

      {/* Arbitration Modal */}
      <Modal
        open={arbitrateOpen}
        onClose={() => {
          setArbitrateOpen(false);
          setActionError(null);
        }}
        title="Dispute Arbitration & Resolution"
        subtitle={`Total disputed escrow: ${formatEth(agreement.budget)}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setArbitrateOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleArbitrateDispute}
              disabled={submittingAction}
            >
              {submittingAction ? "Executing..." : "Execute Binding Ruling"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">Arbitration Decision</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                  arbitrateDecision === "SPLIT"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]"
                }`}
                onClick={() => setArbitrateDecision("SPLIT")}
              >
                Fair Split
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                  arbitrateDecision === "CLIENT_FAVORED"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]"
                }`}
                onClick={() => setArbitrateDecision("CLIENT_FAVORED")}
              >
                100% Client
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                  arbitrateDecision === "WORKER_FAVORED"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]"
                }`}
                onClick={() => setArbitrateDecision("WORKER_FAVORED")}
              >
                100% Worker
              </button>
            </div>
          </div>

          {arbitrateDecision === "SPLIT" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="field-label mb-0">Worker Award Amount</label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatEth(Number(arbitrateWorkerPayout) || 0)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max={agreement.budget}
                className="input font-mono text-sm"
                value={arbitrateWorkerPayout}
                onChange={(e) => setArbitrateWorkerPayout(e.target.value)}
              />
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Client refund will be: <strong>{formatEth(Math.max(0, agreement.budget - (Number(arbitrateWorkerPayout) || 0)))}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="field-label">Arbitrator Ruling Notes</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Summary of evidence reviewed and rationale for the decision..."
              value={arbitrateNotes}
              onChange={(e) => setArbitrateNotes(e.target.value)}
            />
          </div>
          {actionError && <p className="field-error">{actionError}</p>}
        </div>
      </Modal>

      {/* Reassign Contributor Modal */}
      <Modal
        open={reassignOpen}
        onClose={() => {
          setReassignOpen(false);
          setActionError(null);
        }}
        title="Reassign Project to New Contributor"
        subtitle="Select a verified talent from the network to reactivate this stream covenant."
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReassignOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleReassign}
              disabled={submittingAction || !selectedFreelancerId}
            >
              {submittingAction ? "Reassigning..." : "Reassign & Reactivate"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {loadingTalent ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              Loading available contributors...
            </div>
          ) : talentList.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-slate-500 bg-slate-50 dark:bg-white/[0.04] rounded-xl">
              No other available contributors found.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {talentList.map((tal) => (
                <div
                  key={tal.id}
                  onClick={() => setSelectedFreelancerId(tal.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedFreelancerId === tal.id
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/15 shadow-sm"
                      : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={tal} size="md" rounded="rounded-xl" showBorder />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-xs">
                        {tal.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px]">
                        {tal.title || tal.skills?.slice(0, 3).join(", ") || "Contributor"}
                      </p>
                      {tal.hourlyRate && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                          {formatEth(tal.hourlyRate)}/hr
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                      Rep: {tal.reputationScore || 100} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actionError && <p className="field-error">{actionError}</p>}
        </div>
      </Modal>
    </AppLayout>
  );
}
