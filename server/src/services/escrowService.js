import crypto from "crypto";
import { db } from "../data/store.js";
import { assertTransition } from "./stateMachine.js";
import { notify } from "./notificationService.js";
import { nextId, nowIso } from "../utils/simulate.js";
import { blockchain } from "./blockchainService.js";
import { computeReputation } from "./reputationService.js";

class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function recordTransaction(fields) {
  const id = nextId("txn");
  const block = blockchain.mineBlock({
    type: fields.type,
    agreementId: fields.agreementId,
    amount: fields.amount || 0,
    fromUser: fields.fromUser,
    toUser: fields.toUser,
    data: fields.data || null,
    txId: id,
  });
  return db.transactions.insert({
    id,
    status: "CONFIRMED",
    simulatedTxHash: `0x${block.hash}`,
    block: block.blockNumber,
    previousHash: `0x${block.previousHash}`,
    nonce: block.nonce,
    difficulty: block.difficulty,
    network: "AVEN-ETH Simulation Network",
    gas: "0.0000",
    timestamp: block.timestamp,
    ...fields,
  });
}

function touch(agreementId, patch) {
  return db.agreements.update(agreementId, { ...patch, updatedAt: nowIso() });
}

export function loadAgreementOr404(id) {
  const agreement = db.agreements.findById(id);
  if (!agreement) throw new DomainError("Agreement / Stream not found.", 404);
  return agreement;
}

// --- Streaming Calculations ---

export function computeEarned(agreement) {
  if (!agreement || ["PENDING_FUNDING"].includes(agreement.status)) return 0;
  if (agreement.status === "COMPLETED") {
    return Math.round((agreement.totalWithdrawn !== undefined && agreement.totalWithdrawn > 0 ? agreement.totalWithdrawn : agreement.budget) * 1e6) / 1e6;
  }

  const rate = Number(agreement.ratePerSecond || 0);
  if (rate <= 0) {
    return agreement.status === "COMPLETED" ? agreement.budget : Math.round((agreement.totalWithdrawn || 0) * 1e6) / 1e6;
  }

  // Earnings accrue strictly while worker logs active work session time
  const session = db.workSessions ? db.workSessions.findOne((s) => s.agreementId === agreement.id) : null;
  let sessionSec = 0;
  if (session) {
    sessionSec = session.accumulatedSeconds || 0;
    if (session.status === "RUNNING" && session.startedAt) {
      sessionSec += Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / 1000);
    }
  }

  const rawEarned = sessionSec * rate;
  const earned = Math.min(agreement.budget, Math.max(agreement.totalWithdrawn || 0, rawEarned));
  return Math.round(earned * 1e6) / 1e6;
}

export function computeAvailable(agreement) {
  if (!agreement) return 0;
  if (["PENDING_FUNDING", "CANCELLED", "DISPUTED"].includes(agreement.status)) return 0;

  const earned = computeEarned(agreement);
  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);

  // During active unreviewed streaming, apply safety withdrawable cap (e.g. 75%)
  if (agreement.status === "IN_PROGRESS") {
    const capPercent = Number(agreement.withdrawableCapPercent) || 75;
    const maxAllowed = (agreement.budget * capPercent) / 100;
    const cappedEarned = Math.min(earned, maxAllowed);
    return Math.max(0, Math.round((cappedEarned - totalWithdrawn) * 1e6) / 1e6);
  }

  const available = Math.max(0, earned - totalWithdrawn);
  return Math.round(available * 1e6) / 1e6;
}

// --- Stream Lifecycle ---

export function createAgreement({
  clientId,
  freelancerId,
  title,
  description,
  category,
  budget,
  deadline,
  durationHours,
  ratePerSecond,
  checkpointCount,
  withdrawableCapPercent,
}) {
  if (!title || !title.trim()) throw new DomainError("Project title is required.");
  if (!freelancerId) throw new DomainError("Select a freelancer to continue.");
  if (!Number.isFinite(budget) || budget <= 0) throw new DomainError("Enter a valid budget greater than 0.");
  if (!deadline || new Date(deadline).getTime() <= Date.now()) {
    throw new DomainError("Deadline must be a valid date in the future.");
  }
  let freelancer = db.users.findById(freelancerId);
  if (!freelancer && typeof freelancerId === "string" && freelancerId.startsWith("0x")) {
    freelancer = db.users.findOne((u) => u.walletAddress?.toLowerCase() === freelancerId.toLowerCase());
    if (!freelancer) {
      freelancer = db.users.insert({
        id: `user_freelancer_${freelancerId.slice(2, 10).toLowerCase()}`,
        name: `Contributor (${freelancerId.slice(0, 6)}...${freelancerId.slice(-4)})`,
        email: `${freelancerId.slice(2, 10).toLowerCase()}@contributor.eth`,
        role: "FREELANCER",
        avatar: "CT",
        walletAddress: freelancerId,
        walletBalance: 0.0,
        title: "External Protocol Contributor",
        skills: ["Solidity", "Smart Contracts"],
        profileCompleted: true,
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (!freelancer || freelancer.role !== "FREELANCER") {
    throw new DomainError("Selected freelancer is not valid.");
  }


  const hours = Number(durationHours) || Math.max(1, Math.round((new Date(deadline).getTime() - Date.now()) / (1000 * 3600)));
  const calculatedRate = Number(ratePerSecond) || budget / (hours * 3600);

  const agreement = db.agreements.insert({
    id: nextId("agr"),
    title: title.trim(),
    description: (description || "").trim(),
    category: category || "Freelance",
    clientId,
    freelancerId: freelancer.id,
    budget,
    totalDeposited: 0,
    totalWithdrawn: 0,
    escrowBalance: 0,
    ratePerSecond: calculatedRate,
    durationSeconds: hours * 3600,
    checkpointCount: Number(checkpointCount) || 1,
    withdrawableCapPercent: Number(withdrawableCapPercent) || 100,
    deadline,
    status: "PENDING_FUNDING",
    startedAt: null,
    pausedAt: null,
    pausedDurationSeconds: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  notify(freelancerId, {
    type: "AGREEMENT_CREATED",
    title: "New stream drafted",
    message: `A new payment stream "${agreement.title}" is awaiting funding.`,
    agreementId: agreement.id,
  });

  return agreement;
}

export function fundEscrow(agreementId, clientId, { onChainTx } = {}) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId && agreement.freelancerId !== clientId) {
    throw new DomainError("You cannot fund this agreement.", 403);
  }
  assertTransition(agreement.status, "FUNDED");

  const client = db.users.findById(agreement.clientId);
  if (client && client.walletBalance !== undefined) {
    const newBalance = Math.max(0, Math.round(((client.walletBalance || 0) - agreement.budget) * 10000) / 10000);
    db.users.update(client.id, { walletBalance: newBalance });
  }

  const updated = touch(agreementId, {
    status: "FUNDED",
    totalDeposited: agreement.budget,
    escrowBalance: agreement.budget,
    totalWithdrawn: 0,
    onChainFundingTx: onChainTx || null,
  });

  const txn = recordTransaction({
    agreementId,
    fromUser: agreement.clientId,
    toUser: "ESCROW_CONTRACT",
    type: "STREAM_CREATED",
    amount: agreement.budget,
    onChainTx: onChainTx || null,
  });

  notify(agreement.freelancerId, {
    type: "STREAM_CREATED",
    title: "Payment stream funded",
    message: `Escrow stream for "${agreement.title}" has been funded (${agreement.budget} ETH). Work can begin.`,
    agreementId,
  });

  return { agreement: updated, transaction: txn };
}

export function startProject(agreementId, userId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== userId && agreement.clientId !== userId) {
    throw new DomainError("This project is not assigned to you.", 403);
  }
  assertTransition(agreement.status, "IN_PROGRESS");

  const startTime = nowIso();
  const updated = touch(agreementId, {
    status: "IN_PROGRESS",
    startedAt: agreement.startedAt || startTime,
    pausedDurationSeconds: agreement.pausedDurationSeconds || 0,
  });

  let session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session) {
    session = db.workSessions.insert({
      id: nextId("ws"),
      agreementId,
      freelancerId: agreement.freelancerId,
      status: "IDLE",
      startedAt: null,
      accumulatedSeconds: 0,
      branch: "feature/main",
      commitsCount: 0,
      changedFilesCount: 0,
      linesAdded: 0,
      linesDeleted: 0,
      reportHash: null,
      notes: "Stream started.",
    });
  }

  notify(agreement.clientId, {
    type: "PROJECT_STARTED",
    title: "Worker started stream",
    message: `${agreement.title}: work and real-time streaming have begun.`,
    agreementId,
  });

  return { agreement: updated, session };
}

export function pauseStream(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Only the client can pause this stream.", 403);
  if (agreement.status !== "IN_PROGRESS") throw new DomainError("Only an in-progress stream can be paused.");

  const pauseTime = nowIso();
  const updated = touch(agreementId, {
    status: "PAUSED",
    pausedAt: pauseTime,
  });

  // Also pause active session if running
  const session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (session && session.status === "RUNNING") {
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    db.workSessions.update(session.id, {
      status: "PAUSED",
      accumulatedSeconds: (session.accumulatedSeconds || 0) + Math.max(0, elapsed),
      startedAt: null,
    });
  }

  recordTransaction({
    agreementId,
    fromUser: clientId,
    toUser: "ESCROW_CONTRACT",
    type: "STREAM_PAUSED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "STREAM_PAUSED",
    title: "Payment stream paused",
    message: `Client paused the stream for "${agreement.title}". Earning clock is temporarily halted.`,
    agreementId,
  });

  return { agreement: updated };
}

export function resumeStream(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Only the client can resume this stream.", 403);
  if (agreement.status !== "PAUSED") throw new DomainError("Only a paused stream can be resumed.");

  let additionalPausedSec = 0;
  if (agreement.pausedAt) {
    additionalPausedSec = Math.floor((Date.now() - new Date(agreement.pausedAt).getTime()) / 1000);
  }

  const updated = touch(agreementId, {
    status: "IN_PROGRESS",
    pausedAt: null,
    pausedDurationSeconds: (agreement.pausedDurationSeconds || 0) + Math.max(0, additionalPausedSec),
  });

  recordTransaction({
    agreementId,
    fromUser: clientId,
    toUser: "ESCROW_CONTRACT",
    type: "STREAM_RESUMED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "STREAM_RESUMED",
    title: "Payment stream resumed",
    message: `Client resumed the stream for "${agreement.title}". Earning clock is active.`,
    agreementId,
  });

  return { agreement: updated };
}

export function cancelStream(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Only the client can cancel this stream.", 403);
  if (["COMPLETED", "CANCELLED"].includes(agreement.status)) {
    throw new DomainError("Stream is already finalized.");
  }

  const earned = computeEarned(agreement);
  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const unwithdrawnEarned = Math.max(0, earned - totalWithdrawn);
  const unearnedRefund = Math.max(0, agreement.budget - earned);

  // Credit earned remainder to freelancer
  const freelancer = db.users.findById(agreement.freelancerId);
  if (freelancer && unwithdrawnEarned > 0) {
    db.users.update(freelancer.id, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + unwithdrawnEarned) * 10000) / 10000,
    });
  }

  // Refund unearned amount to client
  const client = db.users.findById(clientId);
  if (client && unearnedRefund > 0) {
    db.users.update(clientId, {
      walletBalance: Math.round(((client.walletBalance || 0) + unearnedRefund) * 10000) / 10000,
    });
  }

  let attestation = null;
  if (unwithdrawnEarned > 0) {
    attestation = db.attestations.insert({
      id: nextId("att"),
      streamId: agreementId,
      recipient: agreement.freelancerId,
      sender: agreement.clientId,
      amountPaid: Math.round(unwithdrawnEarned * 10000) / 10000,
      kind: "WorkSession",
      category: agreement.category || "Freelance",
      clientConfirmed: false,
      autoReleased: true,
      activeDurationSeconds: Math.floor(unwithdrawnEarned / (agreement.ratePerSecond || 0.00001)),
      reportHash: sha256(`cancel-settle-${agreementId}-${Date.now()}`),
      title: `${agreement.title} (Cancellation Settlement)`,
      createdAt: nowIso(),
    });
  }

  const updated = touch(agreementId, {
    status: "CANCELLED",
    escrowBalance: 0,
    totalWithdrawn: Math.round((totalWithdrawn + unwithdrawnEarned) * 10000) / 10000,
  });

  recordTransaction({
    agreementId,
    fromUser: "ESCROW_CONTRACT",
    toUser: clientId,
    type: "STREAM_CANCELLED",
    amount: Math.round(unearnedRefund * 10000) / 10000,
    data: { refundedAmount: unearnedRefund, earnedPayout: unwithdrawnEarned },
  });

  notify(agreement.freelancerId, {
    type: "STREAM_CANCELLED",
    title: "Stream cancelled & settled",
    message: `${agreement.title}: stream was cancelled. ${unwithdrawnEarned.toFixed(4)} ETH earned was transferred to your wallet.`,
    agreementId,
  });

  return { agreement: updated, unearnedRefund, unwithdrawnEarned, attestation };
}

export function withdrawStreamed(agreementId, userId, requestedAmount) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== userId && agreement.clientId !== userId) {
    throw new DomainError("This stream is not assigned to you.", 403);
  }
  if (["PENDING_FUNDING", "CANCELLED"].includes(agreement.status)) {
    throw new DomainError("Cannot withdraw from an un-funded or cancelled stream.");
  }

  const available = computeAvailable(agreement);
  if (available <= 0.000001) {
    throw new DomainError("No accrued stream earnings are currently available to claim.");
  }

  const amountToWithdraw = requestedAmount ? Math.min(available, Number(requestedAmount)) : available;
  if (amountToWithdraw <= 0) {
    throw new DomainError("Enter a valid withdrawal amount.");
  }

  const roundedAmount = Math.round(amountToWithdraw * 10000) / 10000;
  const newTotalWithdrawn = Math.round(((agreement.totalWithdrawn || 0) + roundedAmount) * 10000) / 10000;
  const newEscrowBalance = Math.max(0, Math.round((agreement.budget - newTotalWithdrawn) * 10000) / 10000);

  // Update freelancer wallet
  const freelancer = db.users.findById(agreement.freelancerId);
  if (freelancer) {
    db.users.update(agreement.freelancerId, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + roundedAmount) * 10000) / 10000,
    });
  }

  // Determine if stream is now fully completed
  const isFullyFinished = newTotalWithdrawn >= agreement.budget && agreement.status === "SUBMITTED";
  const updatedStatus = isFullyFinished ? "COMPLETED" : agreement.status;

  const updated = touch(agreementId, {
    totalWithdrawn: newTotalWithdrawn,
    escrowBalance: newEscrowBalance,
    status: updatedStatus,
  });

  // Mint on-chain AttestationRecord atomically
  const reportHash = sha256(`stream-claim-${agreementId}-${agreement.freelancerId}-${roundedAmount}-${Date.now()}`);
  const attestation = db.attestations.insert({
    id: nextId("att"),
    streamId: agreementId,
    recipient: agreement.freelancerId,
    sender: agreement.clientId,
    amountPaid: roundedAmount,
    kind: "WorkSession",
    category: agreement.category || "Freelance",
    clientConfirmed: false,
    autoReleased: false,
    activeDurationSeconds: Math.floor(roundedAmount / (agreement.ratePerSecond || 0.00001)),
    reportHash: `0x${reportHash}`,
    title: `${agreement.title} (Stream Claim)`,
    createdAt: nowIso(),
  });

  // Record atomic transaction block on blockchain
  const txn = recordTransaction({
    agreementId,
    fromUser: "ESCROW_CONTRACT",
    toUser: agreement.freelancerId,
    type: "STREAM_CLAIMED",
    amount: roundedAmount,
    data: {
      attestationId: attestation.id,
      category: agreement.category || "Freelance",
      reportHash: attestation.reportHash,
    },
  });

  notify(agreement.freelancerId, {
    type: "STREAM_CLAIMED",
    title: "Stream payout claimed",
    message: `You successfully claimed ${roundedAmount.toFixed(4)} ETH from "${agreement.title}". Attestation #${attestation.id} minted.`,
    agreementId,
  });

  notify(agreement.clientId, {
    type: "STREAM_CLAIMED",
    title: "Worker claimed streamed payout",
    message: `${freelancer?.name || "Worker"} claimed ${roundedAmount.toFixed(4)} ETH from "${agreement.title}".`,
    agreementId,
  });

  return { agreement: updated, transaction: txn, attestation, amountWithdrawn: roundedAmount };
}

// --- Work Session Actions with Git Metrics ---

export function workAction(agreementId, userId, action, options = {}) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== userId && agreement.clientId !== userId) {
    throw new DomainError("This project is not assigned to you.", 403);
  }
  if (!["IN_PROGRESS"].includes(agreement.status)) {
    throw new DomainError("You can only track time while the project is in progress.");
  }

  let session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session) {
    session = db.workSessions.insert({
      id: nextId("ws"),
      agreementId,
      freelancerId: agreement.freelancerId,
      status: "IDLE",
      startedAt: null,
      accumulatedSeconds: 0,
      branch: "main",
      commitsCount: 0,
      changedFilesCount: 0,
      linesAdded: 0,
      linesDeleted: 0,
      reportHash: null,
      notes: "",
    });
  }

  const now = nowIso();

  if (action === "start" || action === "resume") {
    if (session.status === "RUNNING") throw new DomainError("Session is already running.");
    return db.workSessions.update(session.id, {
      status: "RUNNING",
      startedAt: now,
      lastSyncAt: now,
      branch: options?.branch || session.branch || "main",
      baseCommit: options?.baseCommit || session.baseCommit || "0000000000000000000000000000000000000000",
    });
  }

  if (action === "pause") {
    if (session.status !== "RUNNING") throw new DomainError("Cannot pause a session that has not started.");
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    const newAccumulated = (session.accumulatedSeconds || 0) + Math.max(elapsed, 0);
    return db.workSessions.update(session.id, {
      status: "PAUSED",
      accumulatedSeconds: newAccumulated,
      startedAt: null,
      lastSyncAt: now,
    });
  }

  if (action === "stop") {
    if (session.status === "IDLE") throw new DomainError("Cannot stop before starting work.");
    let accumulatedSeconds = session.accumulatedSeconds || 0;
    if (session.status === "RUNNING" && session.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      accumulatedSeconds += Math.max(elapsed, 0);
    }

    const baseCommit = options?.baseCommit || session.baseCommit || "0000000000000000000000000000000000000000";
    const headCommit = options?.headCommit || session.headCommit || baseCommit;
    const commitsCount = options?.commitsCount !== undefined ? options.commitsCount : Math.max(0, session.commitsCount || 0);
    const changedFilesCount = options?.changedFilesCount !== undefined ? options.changedFilesCount : Math.max(0, session.changedFilesCount || 0);
    const linesAdded = options?.linesAdded !== undefined ? options.linesAdded : Math.max(0, session.linesAdded || 0);
    const linesDeleted = options?.linesDeleted !== undefined ? options.linesDeleted : Math.max(0, session.linesDeleted || 0);

    const reportHash = `0x${sha256(
      JSON.stringify({
        agreementId,
        freelancerId: agreement.freelancerId,
        baseCommit,
        headCommit,
        accumulatedSeconds,
        commitsCount,
        changedFilesCount,
        linesAdded,
        linesDeleted,
        stoppedAt: now,
      })
    )}`;

    return db.workSessions.update(session.id, {
      status: "STOPPED",
      startedAt: null,
      lastSyncAt: now,
      accumulatedSeconds,
      baseCommit,
      headCommit,
      commitsCount,
      changedFilesCount,
      linesAdded,
      linesDeleted,
      reportHash,
    });
  }

  throw new DomainError("Unknown work session action.");
}

export function raiseDispute(agreementId, clientId, reason) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Only the client can raise a dispute on this stream.", 403);
  assertTransition(agreement.status, "DISPUTED");

  const updated = touch(agreementId, {
    status: "DISPUTED",
    disputeReason: (reason || "").trim() || "Client initiated emergency freeze and dispute review.",
    disputedAt: nowIso(),
  });

  // Freeze active work session
  const session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (session && session.status === "RUNNING") {
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    db.workSessions.update(session.id, {
      status: "PAUSED",
      accumulatedSeconds: (session.accumulatedSeconds || 0) + Math.max(0, elapsed),
      startedAt: null,
    });
  }

  const txn = recordTransaction({
    agreementId,
    fromUser: clientId,
    toUser: "ESCROW_CONTRACT",
    type: "STREAM_DISPUTED",
    amount: 0,
    data: { reason: reason || "Emergency Freeze" },
  });

  notify(agreement.freelancerId, {
    type: "STREAM_DISPUTED",
    title: "Stream Frozen by Client",
    message: `${agreement.title}: stream has been frozen by the client for dispute review.`,
    agreementId,
  });

  return { agreement: updated, transaction: txn };
}

export function resolveDispute(agreementId, clientId, { resolution, clientRefund, workerPayout }) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Unauthorized.", 403);
  if (agreement.status !== "DISPUTED") throw new DomainError("Stream is not in disputed state.");

  const currentVault = Number(agreement.escrowBalance || 0);
  const refund = Math.min(currentVault, Math.max(0, Number(clientRefund || 0)));
  const payout = Math.min(currentVault - refund, Math.max(0, Number(workerPayout || 0)));

  const client = db.users.findById(agreement.clientId);
  const freelancer = db.users.findById(agreement.freelancerId);

  if (refund > 0 && client) {
    db.users.update(client.id, {
      walletBalance: Math.round(((client.walletBalance || 0) + refund) * 1e6) / 1e6,
    });
  }
  if (payout > 0 && freelancer) {
    db.users.update(freelancer.id, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + payout) * 1e6) / 1e6,
    });
  }

  const newTotalWithdrawn = Math.round(((agreement.totalWithdrawn || 0) + payout) * 1e6) / 1e6;
  const newEscrowBalance = Math.max(0, Math.round((currentVault - refund - payout) * 1e6) / 1e6);

  const updatedStatus = resolution === "CONTINUE" ? "IN_PROGRESS" : "COMPLETED";
  const updated = touch(agreementId, {
    status: updatedStatus,
    escrowBalance: newEscrowBalance,
    totalWithdrawn: newTotalWithdrawn,
    disputeResolvedAt: nowIso(),
  });

  return { agreement: updated };
}

export function submitWork(
  agreementId,
  userId,
  {
    description,
    deliverables,
    branch,
    baseCommit,
    headCommit,
    commitsCount,
    changedFilesCount,
    linesAdded,
    linesDeleted,
    reportHash: incomingReportHash,
  }
) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== userId && agreement.clientId !== userId) {
    throw new DomainError("This project is not assigned to you.", 403);
  }
  assertTransition(agreement.status, "SUBMITTED");

  if (!description || description.trim().length < 5) {
    throw new DomainError("Add a work summary of at least 5 characters before submitting.");
  }

  let session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session) {
    session = db.workSessions.insert({
      id: nextId("ws"),
      agreementId,
      freelancerId: agreement.freelancerId,
      status: "STOPPED",
      startedAt: null,
      accumulatedSeconds: 3600,
      branch: branch || "main",
      commitsCount: 3,
      changedFilesCount: 2,
      linesAdded: 150,
      linesDeleted: 20,
      reportHash: null,
      notes: "Work completed.",
    });
  } else if (session.status === "RUNNING") {
    const elapsed = session.startedAt ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000) : 0;
    session = db.workSessions.update(session.id, {
      status: "STOPPED",
      accumulatedSeconds: (session.accumulatedSeconds || 0) + Math.max(0, elapsed),
      startedAt: null,
      lastSyncAt: nowIso(),
    });
  } else if (session.status === "IDLE") {
    session = db.workSessions.update(session.id, {
      status: "STOPPED",
      accumulatedSeconds: Math.max(session.accumulatedSeconds || 0, 1800),
      lastSyncAt: nowIso(),
    });
  }

  const finalBaseCommit = baseCommit || session.baseCommit || "0000000000000000000000000000000000000000";
  const finalHeadCommit = headCommit || session.headCommit || finalBaseCommit;
  const finalCommitsCount = commitsCount !== undefined ? commitsCount : (session.commitsCount || 0);
  const finalChangedFiles = changedFilesCount !== undefined ? changedFilesCount : (session.changedFilesCount || 0);
  const finalLinesAdded = linesAdded !== undefined ? linesAdded : (session.linesAdded || 0);
  const finalLinesDeleted = linesDeleted !== undefined ? linesDeleted : (session.linesDeleted || 0);

  const reportHash =
    incomingReportHash ||
    session.reportHash ||
    `0x${sha256(
      JSON.stringify({
        agreementId,
        freelancerId: agreement.freelancerId,
        baseCommit: finalBaseCommit,
        headCommit: finalHeadCommit,
        commitsCount: finalCommitsCount,
        linesAdded: finalLinesAdded,
        linesDeleted: finalLinesDeleted,
        submittedAt: nowIso(),
      })
    )}`;

  const existing = db.submissions.findOne((s) => s.agreementId === agreementId);
  let submission;
  if (existing) {
    submission = db.submissions.update(existing.id, {
      description: description.trim(),
      deliverables: deliverables && deliverables.length ? deliverables : existing.deliverables,
      branch: branch || session.branch || "main",
      baseCommit: finalBaseCommit,
      headCommit: finalHeadCommit,
      commitsCount: finalCommitsCount,
      changedFilesCount: finalChangedFiles,
      linesAdded: finalLinesAdded,
      linesDeleted: finalLinesDeleted,
      reportHash,
      submittedAt: nowIso(),
      status: "PENDING_REVIEW",
      revisionCount: existing.revisionCount + (existing.status === "REVISION_REQUESTED" ? 1 : 0),
    });
  } else {
    submission = db.submissions.insert({
      id: nextId("sub"),
      agreementId,
      freelancerId: agreement.freelancerId,
      description: description.trim(),
      deliverables: deliverables && deliverables.length ? deliverables : ["deliverables.zip"],
      branch: branch || session.branch || "main",
      baseCommit: finalBaseCommit,
      headCommit: finalHeadCommit,
      commitsCount: finalCommitsCount,
      changedFilesCount: finalChangedFiles,
      linesAdded: finalLinesAdded,
      linesDeleted: finalLinesDeleted,
      reportHash,
      submittedAt: nowIso(),
      status: "PENDING_REVIEW",
      revisionCount: 0,
      clientFeedback: null,
    });
  }

  const updated = touch(agreementId, { status: "SUBMITTED" });

  recordTransaction({
    agreementId,
    fromUser: agreement.freelancerId,
    toUser: agreement.clientId,
    type: "WORK_SUBMITTED",
    amount: 0,
    data: { reportHash },
  });

  notify(agreement.clientId, {
    type: "WORK_SUBMITTED",
    title: "New verified submission ready for review",
    message: `Work was submitted for "${agreement.title}" with cryptographic Git report.`,
    agreementId,
  });

  return { agreement: updated, submission };
}

// --- Client Review & Attestation Minting ---

export function approveAndRelease(agreementId, userId, { rating = 5, review = "" } = {}) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== userId && agreement.freelancerId !== userId) {
    throw new DomainError("You cannot review this agreement.", 403);
  }
  assertTransition(agreement.status, "COMPLETED");

  const existingSubmission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (existingSubmission) {
    db.submissions.update(existingSubmission.id, { status: "APPROVED" });
  }

  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const remainingPayout = Math.max(0, Math.round((agreement.budget - totalWithdrawn) * 10000) / 10000);

  // Credit remaining balance to freelancer
  const freelancer = db.users.findById(agreement.freelancerId);
  if (freelancer && remainingPayout > 0) {
    db.users.update(agreement.freelancerId, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + remainingPayout) * 10000) / 10000,
    });
  }

  const updated = touch(agreementId, {
    status: "COMPLETED",
    escrowBalance: 0,
    totalWithdrawn: agreement.budget,
    clientRating: Number(rating) || 5,
    clientReview: (review || "").trim(),
  });

  // Mint client-confirmed AttestationRecord on-chain
  const reportHash =
    existingSubmission?.reportHash ||
    `0x${sha256(`approved-${agreementId}-${agreement.freelancerId}-${Date.now()}`)}`;

  const attestation = db.attestations.insert({
    id: nextId("att"),
    streamId: agreementId,
    recipient: agreement.freelancerId,
    sender: agreement.clientId,
    amountPaid: agreement.budget,
    kind: "WorkSession",
    category: agreement.category || "Freelance",
    clientConfirmed: true,
    autoReleased: false,
    activeDurationSeconds: agreement.durationSeconds || 36000,
    reportHash,
    title: agreement.title,
    rating: Number(rating) || 5,
    review: (review || "").trim(),
    createdAt: nowIso(),
  });

  const paymentTxn = recordTransaction({
    agreementId,
    fromUser: "ESCROW_CONTRACT",
    toUser: agreement.freelancerId,
    type: "ATTESTATION_MINTED",
    amount: remainingPayout,
    data: {
      attestationId: attestation.id,
      category: agreement.category || "Freelance",
      rating: Number(rating) || 5,
      clientConfirmed: true,
    },
  });

  recordTransaction({
    agreementId,
    fromUser: "SYSTEM",
    toUser: agreement.freelancerId,
    type: "PROJECT_COMPLETED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "ATTESTATION_MINTED",
    title: "Work approved & attestation minted!",
    message: `${agreement.title}: client approved work with a ${rating}-star rating. Attestation #${attestation.id} minted.`,
    agreementId,
  });

  return { agreement: updated, transaction: paymentTxn, attestation };
}

export function requestRevision(agreementId, userId, feedback) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== userId && agreement.freelancerId !== userId) {
    throw new DomainError("You cannot review this agreement.", 403);
  }
  if (!feedback || feedback.trim().length < 5) {
    throw new DomainError("Add revision feedback so the worker knows what to change.");
  }
  assertTransition(agreement.status, "REVISION_REQUESTED");
  assertTransition("REVISION_REQUESTED", "IN_PROGRESS");

  let submission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (submission) {
    submission = db.submissions.update(submission.id, {
      status: "REVISION_REQUESTED",
      clientFeedback: feedback.trim(),
    });
  }

  const updated = touch(agreementId, { status: "IN_PROGRESS" });

  recordTransaction({
    agreementId,
    fromUser: agreement.clientId,
    toUser: agreement.freelancerId,
    type: "REVISION_REQUESTED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "REVISION_REQUESTED",
    title: "Revision requested",
    message: `${agreement.title}: the client asked for changes.`,
    agreementId,
  });

  return { agreement: updated, submission };
}

export function rejectSubmission(agreementId, userId, reason) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== userId && agreement.freelancerId !== userId) {
    throw new DomainError("You cannot review this agreement.", 403);
  }
  if (!reason || reason.trim().length < 5) {
    throw new DomainError("A reason is required to reject a submission.");
  }
  assertTransition(agreement.status, "CANCELLED");

  let submission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (submission) {
    submission = db.submissions.update(submission.id, {
      status: "REJECTED",
      clientFeedback: reason.trim(),
    });
  }

  // Settle earned vs unearned
  const earned = computeEarned(agreement);
  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const unwithdrawnEarned = Math.max(0, earned - totalWithdrawn);
  const unearnedRefund = Math.max(0, agreement.budget - earned);

  const freelancer = db.users.findById(agreement.freelancerId);
  if (freelancer && unwithdrawnEarned > 0) {
    db.users.update(freelancer.id, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + unwithdrawnEarned) * 10000) / 10000,
    });
  }

  const client = db.users.findById(clientId);
  if (client && unearnedRefund > 0) {
    db.users.update(clientId, {
      walletBalance: Math.round(((client.walletBalance || 0) + unearnedRefund) * 10000) / 10000,
    });
  }

  const updated = touch(agreementId, {
    status: "CANCELLED",
    escrowBalance: 0,
    totalWithdrawn: Math.round((totalWithdrawn + unwithdrawnEarned) * 10000) / 10000,
  });

  notify(agreement.freelancerId, {
    type: "SUBMISSION_REJECTED",
    title: "Submission rejected",
    message: `${agreement.title}: submission was rejected. Reason: ${reason.trim()}`,
    agreementId,
  });

  return { agreement: updated, submission };
}

export { DomainError };
