import test from "node:test";
import assert from "node:assert/strict";

import { resetDb, db } from "../data/store.js";
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
import { computeReputation, scoreAttestation } from "../services/reputationService.js";
import { InvalidTransitionError } from "../services/stateMachine.js";

const CLIENT_ID = "user_client_1";
const FREELANCER_ID = "user_freelancer_1";

function futureDate(days = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

test.beforeEach(() => {
  resetDb();
});

test("createAgreement rejects an invalid budget", () => {
  assert.throws(
    () =>
      createAgreement({
        clientId: CLIENT_ID,
        freelancerId: FREELANCER_ID,
        title: "Test project",
        description: "desc",
        budget: 0,
        deadline: futureDate(),
      }),
    DomainError
  );
});

test("createAgreement rejects a past deadline", () => {
  assert.throws(
    () =>
      createAgreement({
        clientId: CLIENT_ID,
        freelancerId: FREELANCER_ID,
        title: "Test project",
        description: "desc",
        budget: 0.1,
        deadline: futureDate(-2),
      }),
    DomainError
  );
});

test("createAgreement rejects a missing/invalid freelancer", () => {
  assert.throws(
    () =>
      createAgreement({
        clientId: CLIENT_ID,
        freelancerId: "not-a-real-user",
        title: "Test project",
        description: "desc",
        budget: 0.1,
        deadline: futureDate(),
      }),
    DomainError
  );
});

test("full happy-path streaming lifecycle: create -> fund -> start -> stream -> claim -> submit -> approve", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Landing Page Rebuild",
    description: "Rebuild the marketing landing page with continuous streams.",
    category: "Freelance",
    budget: 0.4,
    ratePerSecond: 0.0001,
    deadline: futureDate(),
  });
  assert.equal(agreement.status, "PENDING_FUNDING");
  assert.equal(agreement.escrowBalance, 0);

  const { agreement: funded, transaction: fundTxn } = fundEscrow(agreement.id, CLIENT_ID);
  assert.equal(funded.status, "FUNDED");
  assert.equal(funded.escrowBalance, 0.4);
  assert.equal(fundTxn.type, "STREAM_CREATED");
  assert.ok(/^0x[0-9a-f]{64}$/.test(fundTxn.simulatedTxHash));
  assert.ok(fundTxn.simulatedTxHash.startsWith("0x000"));

  const { agreement: started } = startProject(agreement.id, FREELANCER_ID);
  assert.equal(started.status, "IN_PROGRESS");

  // Git connection is strictly required before starting timer
  assert.throws(
    () => workAction(agreement.id, FREELANCER_ID, "start"),
    DomainError
  );

  // Contributor links Git repository
  const connected = workAction(agreement.id, FREELANCER_ID, "git-connect", {
    branch: "main",
    baseCommit: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  });
  assert.equal(connected.gitConnected, true);

  // Now start succeeds
  workAction(agreement.id, FREELANCER_ID, "start");
  const stoppedSession = workAction(agreement.id, FREELANCER_ID, "stop");
  assert.equal(stoppedSession.status, "STOPPED");
  assert.ok(stoppedSession.reportHash.startsWith("0x"));

  const { agreement: submitted } = submitWork(agreement.id, FREELANCER_ID, {
    description: "Landing page rebuilt and deployed to staging.",
    deliverables: ["landing-v1.zip"],
  });
  assert.equal(submitted.status, "SUBMITTED");

  // Freelancer cannot approve their own deliverables
  assert.throws(
    () => approveAndRelease(agreement.id, FREELANCER_ID, { rating: 5 }),
    DomainError
  );

  const { agreement: completed, transaction: payTxn, attestation } = approveAndRelease(
    agreement.id,
    CLIENT_ID,
    { rating: 5, review: "Great work!" }
  );
  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.escrowBalance, 0);
  assert.equal(payTxn.type, "ATTESTATION_MINTED");
  assert.equal(payTxn.amount, 0.4);

  assert.ok(attestation);
  assert.equal(attestation.recipient, FREELANCER_ID);
  assert.equal(attestation.clientConfirmed, true);
  assert.equal(attestation.rating, 5);

  const projectCompletedTxn = db.transactions.findOne(
    (t) => t.agreementId === agreement.id && t.type === "PROJECT_COMPLETED"
  );
  assert.ok(projectCompletedTxn);
});

test("stream pausing and resuming", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Pause Resume Stream",
    description: "Testing pause and resume",
    budget: 0.5,
    deadline: futureDate(),
  });
  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);

  const { agreement: paused } = pauseStream(agreement.id, CLIENT_ID);
  assert.equal(paused.status, "PAUSED");

  const { agreement: resumed } = resumeStream(agreement.id, CLIENT_ID);
  assert.equal(resumed.status, "IN_PROGRESS");
});

test("stream cancellation with automatic refund to client and earned payment to worker", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Cancellable Stream",
    description: "Testing cancellation",
    budget: 0.5,
    deadline: futureDate(),
  });
  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);

  const { agreement: cancelled, unearnedRefund } = cancelStream(agreement.id, CLIENT_ID);
  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.escrowBalance, 0);
  assert.ok(unearnedRefund >= 0);
});

test("on-demand stream withdrawals mint an attestation and update wallet balance", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Withdrawal Stream",
    description: "Testing withdrawals",
    budget: 0.5,
    ratePerSecond: 0.001,
    deadline: futureDate(),
  });
  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);

  // simulate work with linked Git
  workAction(agreement.id, FREELANCER_ID, "git-connect", { branch: "main" });
  workAction(agreement.id, FREELANCER_ID, "start");
  workAction(agreement.id, FREELANCER_ID, "stop");

  const session = db.workSessions.findOne((s) => s.agreementId === agreement.id);
  db.workSessions.update(session.id, {
    accumulatedSeconds: 3600,
  });

  const available = computeAvailable(db.agreements.findById(agreement.id));
  assert.ok(available > 0, "Earned balance should be greater than 0");

  const freelancerBefore = db.users.findById(FREELANCER_ID).walletBalance || 0;
  const { attestation, amountWithdrawn } = withdrawStreamed(agreement.id, FREELANCER_ID, 0.05);

  assert.ok(amountWithdrawn > 0);
  assert.ok(attestation);
  assert.equal(attestation.recipient, FREELANCER_ID);

  const freelancerAfter = db.users.findById(FREELANCER_ID).walletBalance || 0;
  assert.ok(freelancerAfter > freelancerBefore);
});

test("dynamic reputation calculation aggregates attestations into a score up to 10,000 pts", () => {
  db.attestations.insert({
    id: "att_test_1",
    streamId: "agr_test",
    recipient: FREELANCER_ID,
    sender: CLIENT_ID,
    amountPaid: 0.5,
    kind: "WorkSession",
    category: "Freelance",
    clientConfirmed: true,
    autoReleased: false,
    createdAt: new Date().toISOString(),
  });

  const rep = computeReputation(FREELANCER_ID);
  assert.ok(rep.totalScore > 0);
  assert.ok(rep.totalScore <= 10000);
  assert.ok(rep.categoryBreakdown.Freelance);
  assert.equal(rep.attestations.length, 1);

  const first = rep.attestations[0];
  assert.ok(first.scoreBreakdown);
  assert.ok(first.scoreBreakdown.totalPoints > 0);
});

test("client dispute freezes stream, locks withdrawals, and allows resolution", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Dispute Stream",
    description: "Testing dispute freeze",
    budget: 1.0,
    ratePerSecond: 0.001,
    deadline: futureDate(),
  });
  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);

  workAction(agreement.id, FREELANCER_ID, "git-connect", { branch: "main" });
  workAction(agreement.id, FREELANCER_ID, "start");

  const { agreement: disputed } = raiseDispute(agreement.id, CLIENT_ID, "Suspected fake activity");
  assert.equal(disputed.status, "DISPUTED");

  const availableWhileDisputed = computeAvailable(disputed);
  assert.equal(availableWhileDisputed, 0, "Available funds must be 0 while disputed");

  const { agreement: resolved } = resolveDispute(agreement.id, CLIENT_ID, {
    resolution: "SETTLE",
    clientRefund: 0.8,
    workerPayout: 0.2,
  });

  assert.equal(resolved.status, "COMPLETED");
  assert.equal(resolved.escrowBalance, 0);
});
