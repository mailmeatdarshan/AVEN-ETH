import { Router } from "express";
import { db } from "../data/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createAgreement,
  fundEscrow,
  startProject,
  pauseStream,
  resumeStream,
  cancelStream,
  withdrawStreamed,
  workAction,
  submitWork,
  approveAndRelease,
  requestRevision,
  rejectSubmission,
  raiseDispute,
  resolveDispute,
  computeEarned,
  computeAvailable,
  DomainError,
} from "../services/escrowService.js";
import { computeReputation } from "../services/reputationService.js";

const router = Router();
router.use(requireAuth);

function handle(res, fn) {
  try {
    const result = fn();
    res.json(result);
  } catch (err) {
    if (err instanceof DomainError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.name === "InvalidTransitionError") {
      return res.status(err.status || 409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
}

function enrich(agreement) {
  const client = db.users.findById(agreement.clientId);
  const freelancer = db.users.findById(agreement.freelancerId);
  const submission = db.submissions.findOne((s) => s.agreementId === agreement.id);
  const session = db.workSessions.findOne((s) => s.agreementId === agreement.id);
  const attestations = db.attestations.find((a) => a.streamId === agreement.id);

  const freelancerRep = freelancer ? computeReputation(freelancer.id) : null;

  return {
    ...agreement,
    earnedAmount: computeEarned(agreement),
    availableAmount: computeAvailable(agreement),
    client: client
      ? {
          id: client.id,
          name: client.name,
          avatar: client.avatar,
          walletAddress: client.walletAddress,
          walletBalance: client.walletBalance,
        }
      : null,
    freelancer: freelancer
      ? {
          id: freelancer.id,
          name: freelancer.name,
          avatar: freelancer.avatar,
          walletAddress: freelancer.walletAddress,
          walletBalance: freelancer.walletBalance,
          rating: freelancerRep ? Math.round((freelancerRep.totalScore / 2000) * 10) / 10 : 4.9,
          reputationScore: freelancerRep?.totalScore || 0,
          hourlyRate: freelancer.hourlyRate,
        }
      : null,
    submission: submission || null,
    session: session || null,
    attestations: attestations || [],
  };
}

// List — scoped to the logged-in user's role automatically.
router.get("/", (req, res) => {
  const { user } = req;
  const rows =
    user.role === "CLIENT"
      ? db.agreements.find((a) => a.clientId === user.id)
      : db.agreements.find((a) => a.freelancerId === user.id);
  const sorted = rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ agreements: sorted.map(enrich) });
});

router.get("/:id", (req, res) => {
  const agreement = db.agreements.findById(req.params.id);
  if (!agreement) return res.status(404).json({ error: "Agreement not found." });
  const { user } = req;
  if (agreement.clientId !== user.id && agreement.freelancerId !== user.id) {
    return res.status(403).json({ error: "You do not have access to this agreement." });
  }
  res.json({ agreement: enrich(agreement) });
});

router.post("/", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const {
      title,
      description,
      category,
      freelancerId,
      budget,
      deadline,
      durationHours,
      ratePerSecond,
      checkpointCount,
      withdrawableCapPercent,
    } = req.body || {};

    const agreement = createAgreement({
      clientId: req.user.id,
      freelancerId,
      title,
      description,
      category,
      budget: Number(budget),
      deadline,
      durationHours,
      ratePerSecond,
      checkpointCount,
      withdrawableCapPercent,
    });
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/fund", (req, res) => {
  handle(res, () => {
    const { onChainTx } = req.body || {};
    const { agreement, transaction } = fundEscrow(req.params.id, req.user.id, { onChainTx });
    return { agreement: enrich(agreement), transaction };
  });
});

router.post("/:id/start", (req, res) => {
  handle(res, () => {
    const { agreement, session } = startProject(req.params.id, req.user.id);
    return { agreement: enrich(agreement), session };
  });
});

router.post("/:id/pause", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { agreement } = pauseStream(req.params.id, req.user.id);
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/resume", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { agreement } = resumeStream(req.params.id, req.user.id);
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/cancel", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { agreement, unearnedRefund, unwithdrawnEarned, attestation } = cancelStream(
      req.params.id,
      req.user.id
    );
    return { agreement: enrich(agreement), unearnedRefund, unwithdrawnEarned, attestation };
  });
});

router.post("/:id/withdraw", (req, res) => {
  handle(res, () => {
    const { amount } = req.body || {};
    const { agreement, transaction, attestation, amountWithdrawn } = withdrawStreamed(
      req.params.id,
      req.user.id,
      amount
    );
    return { agreement: enrich(agreement), transaction, attestation, amountWithdrawn };
  });
});

router.post("/:id/work/:action", (req, res) => {
  handle(res, () => {
    const session = workAction(req.params.id, req.user.id, req.params.action, req.body);
    const agreement = db.agreements.findById(req.params.id);
    return { agreement: enrich(agreement), session };
  });
});

router.post("/:id/cli-sync", requireRole("FREELANCER"), (req, res) => {
  handle(res, () => {
    const { branch, baseCommit, headCommit, commitsCount, changedFilesCount, linesAdded, linesDeleted, reportHash, accumulatedSeconds } = req.body || {};
    const agreement = db.agreements.findById(req.params.id);
    if (!agreement) return res.status(404).json({ error: "Agreement not found." });
    if (agreement.freelancerId !== req.user.id) return res.status(403).json({ error: "Unauthorized." });
    if (agreement.status !== "IN_PROGRESS") return res.status(400).json({ error: "Stream is not currently running." });

    let session = db.workSessions.findOne((s) => s.agreementId === agreement.id);
    if (!session) return res.status(404).json({ error: "Work session not found." });

    const now = Date.now();
    const lastSyncTime = session.lastSyncAt ? new Date(session.lastSyncAt).getTime() : (session.startedAt ? new Date(session.startedAt).getTime() : now);
    const elapsedWallClockSec = Math.max(0, Math.floor((now - lastSyncTime) / 1000));
    const maxAllowedSeconds = (session.accumulatedSeconds || 0) + elapsedWallClockSec + 3; // 3s jitter grace

    // Enforce monotonic time and cap any fake incoming jumps
    let verifiedAccumulated = session.accumulatedSeconds || 0;
    if (typeof accumulatedSeconds === "number" && accumulatedSeconds > 0) {
      verifiedAccumulated = Math.min(accumulatedSeconds, maxAllowedSeconds);
    }

    // Heuristic bounds against fake metric inflation
    const maxCommits = Math.max(20, Math.floor(verifiedAccumulated / 20));
    const maxLines = Math.max(500, verifiedAccumulated * 50);

    const safeCommits = typeof commitsCount === "number" ? Math.min(Math.max(0, commitsCount), maxCommits) : (session.commitsCount || 0);
    const safeLinesAdded = typeof linesAdded === "number" ? Math.min(Math.max(0, linesAdded), maxLines) : (session.linesAdded || 0);
    const safeLinesDeleted = typeof linesDeleted === "number" ? Math.min(Math.max(0, linesDeleted), maxLines) : (session.linesDeleted || 0);

    session = db.workSessions.update(session.id, {
      branch: branch || session.branch,
      baseCommit: baseCommit || session.baseCommit,
      headCommit: headCommit || session.headCommit || baseCommit,
      commitsCount: safeCommits,
      changedFilesCount: typeof changedFilesCount === "number" ? Math.max(0, changedFilesCount) : session.changedFilesCount,
      linesAdded: safeLinesAdded,
      linesDeleted: safeLinesDeleted,
      reportHash: reportHash || session.reportHash,
      accumulatedSeconds: verifiedAccumulated,
      lastSyncAt: new Date().toISOString(),
    });

    return { agreement: enrich(agreement), session };
  });
});

router.post("/:id/dispute", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { reason } = req.body || {};
    const { agreement, transaction } = raiseDispute(req.params.id, req.user.id, reason);
    return { agreement: enrich(agreement), transaction };
  });
});

router.post("/:id/dispute/resolve", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { resolution, clientRefund, workerPayout } = req.body || {};
    const { agreement } = resolveDispute(req.params.id, req.user.id, { resolution, clientRefund, workerPayout });
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/submit", (req, res) => {
  handle(res, () => {
    const { agreement, submission } = submitWork(req.params.id, req.user.id, req.body || {});
    return { agreement: enrich(agreement), submission };
  });
});

router.post("/:id/approve", (req, res) => {
  handle(res, () => {
    const { rating, review } = req.body || {};
    const { agreement, transaction, attestation } = approveAndRelease(
      req.params.id,
      req.user.id,
      { rating, review }
    );
    return { agreement: enrich(agreement), transaction, attestation };
  });
});

router.post("/:id/revision", (req, res) => {
  handle(res, () => {
    const { feedback } = req.body || {};
    const { agreement, submission } = requestRevision(req.params.id, req.user.id, feedback);
    return { agreement: enrich(agreement), submission };
  });
});

router.post("/:id/reject", (req, res) => {
  handle(res, () => {
    const { reason } = req.body || {};
    const { agreement, submission } = rejectSubmission(req.params.id, req.user.id, reason);
    return { agreement: enrich(agreement), submission };
  });
});

export default router;
