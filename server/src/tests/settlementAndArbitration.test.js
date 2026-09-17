import { test } from "node:test";
import assert from "node:assert/strict";
import { db, resetDb } from "../data/store.js";
import {
  createAgreement,
  fundEscrow,
  startProject,
  submitWork,
  proposeSettlement,
  acceptSettlement,
  counterSettlement,
  requestFullRefund,
  appealRefund,
  acceptRefund,
  arbitrateDispute,
  reassignAgreement,
} from "../services/escrowService.js";

const CLIENT_ID = "user_client_1";
const FREELANCER_ID = "user_freelancer_1";
const NEW_FREELANCER_ID = "user_freelancer_2";

test("Client can propose a partial settlement with mandatory reason", () => {
  resetDb();
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "DeFi Analytics Dashboard",
    budget: 2.0,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    ratePerSecond: 0.001,
  });

  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);
  submitWork(agreement.id, FREELANCER_ID, { description: "Core indexing completed." });

  // 1. Invalid reason should throw
  assert.throws(() => {
    proposeSettlement(agreement.id, CLIENT_ID, { workerPayout: 1.2, reason: "bad" });
  });

  // 2. Out of bounds payout should throw
  assert.throws(() => {
    proposeSettlement(agreement.id, CLIENT_ID, { workerPayout: 5.0, reason: "Valid reason here" });
  });

  // 3. Valid proposal
  const { agreement: proposed } = proposeSettlement(agreement.id, CLIENT_ID, {
    workerPayout: 1.2,
    reason: "Backend indexing complete, but frontend charts are missing.",
  });

  assert.equal(proposed.status, "SETTLEMENT_OFFERED");
  assert.equal(proposed.settlementProposal.workerPayout, 1.2);
  assert.equal(proposed.settlementProposal.clientRefund, 0.8);
  assert.equal(proposed.settlementProposal.proposedBy, "CLIENT");
});

test("Worker accepting settlement executes fund split and mints attestation", () => {
  resetDb();
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "NFT Marketplace Audit",
    budget: 1.0,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    ratePerSecond: 0.001,
  });

  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);
  submitWork(agreement.id, FREELANCER_ID, { description: "Partial audit report ready." });

  proposeSettlement(agreement.id, CLIENT_ID, {
    workerPayout: 0.6,
    reason: "Completed smart contract audit, frontend review skipped.",
  });

  const workerBefore = db.users.findById(FREELANCER_ID).walletBalance;
  const clientBefore = db.users.findById(CLIENT_ID).walletBalance;

  // Proposer cannot accept own proposal
  assert.throws(() => {
    acceptSettlement(agreement.id, CLIENT_ID);
  });

  // Worker accepts
  const { agreement: completed, attestation } = acceptSettlement(agreement.id, FREELANCER_ID);

  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.escrowBalance, 0);
  assert.equal(completed.totalWithdrawn, 0.6);
  assert.ok(attestation);
  assert.equal(attestation.amountPaid, 0.6);

  const workerAfter = db.users.findById(FREELANCER_ID).walletBalance;
  const clientAfter = db.users.findById(CLIENT_ID).walletBalance;

  assert.equal(Math.round((workerAfter - workerBefore) * 1e4) / 1e4, 0.6);
  assert.equal(Math.round((clientAfter - clientBefore) * 1e4) / 1e4, 0.4);
});

test("Worker can counter-offer settlement, and client can accept counter", () => {
  resetDb();
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Bridge Relayer Dev",
    budget: 3.0,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    ratePerSecond: 0.001,
  });

  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);
  submitWork(agreement.id, FREELANCER_ID, { description: "Relayer testnet deployment." });

  proposeSettlement(agreement.id, CLIENT_ID, {
    workerPayout: 1.5,
    reason: "Relayer works on testnet only.",
  });

  // Worker counters with 2.2 ETH
  const { agreement: countered } = counterSettlement(agreement.id, FREELANCER_ID, {
    workerPayout: 2.2,
    reason: "Testnet and staging both functional with full unit test coverage.",
  });

  assert.equal(countered.status, "SETTLEMENT_OFFERED");
  assert.equal(countered.settlementProposal.proposedBy, "FREELANCER");
  assert.equal(countered.settlementProposal.workerPayout, 2.2);
  assert.equal(countered.settlementProposal.clientRefund, 0.8);

  // Client accepts counter-offer
  const { agreement: completed } = acceptSettlement(agreement.id, CLIENT_ID);
  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.totalWithdrawn, 2.2);
});

test("Client requesting 100% refund triggers challenge window; worker can appeal to dispute with git proofs", () => {
  resetDb();
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Solidity Escrow Plugin",
    budget: 1.5,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    ratePerSecond: 0.001,
  });

  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);
  submitWork(agreement.id, FREELANCER_ID, {
    description: "Completed full plugin with 12 unit tests.",
    commitsCount: 5,
    changedFilesCount: 3,
    linesAdded: 240,
    linesDeleted: 15,
  });

  // Client requests 100% refund
  const { agreement: refundPending } = requestFullRefund(agreement.id, CLIENT_ID, "Did not deliver to my expectations.");
  assert.equal(refundPending.status, "REFUND_PENDING");
  assert.ok(refundPending.refundRequest);

  // Worker appeals with git proofs
  const { agreement: disputed, proofBundle } = appealRefund(
    agreement.id,
    FREELANCER_ID,
    "I delivered working smart contracts with 100% test coverage. Commits are verified on-chain."
  );

  assert.equal(disputed.status, "DISPUTED");
  assert.ok(proofBundle);
  assert.equal(proofBundle.commitsCount, 5);
  assert.equal(proofBundle.linesAdded, 240);

  // Arbitrate dispute: protocol awards fair split based on proofs (1.0 to worker, 0.5 refund to client)
  const { agreement: arbitrated } = arbitrateDispute(agreement.id, {
    resolution: "POW_SPLIT",
    workerPayout: 1.0,
    clientRefund: 0.5,
    arbitratorNotes: "Verified 5 commits and 240 lines. Awarded 1.0 ETH to worker.",
  });

  assert.equal(arbitrated.status, "COMPLETED");
  assert.equal(arbitrated.totalWithdrawn, 1.0);
  assert.equal(arbitrated.escrowBalance, 0);
});

test("Client can reassign a cancelled/refunded project to a new freelancer", () => {
  resetDb();
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Rust Core Node Engine",
    budget: 2.0,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    ratePerSecond: 0.001,
  });

  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);

  // Client requests refund and worker accepts
  requestFullRefund(agreement.id, CLIENT_ID, "Worker unavailable to continue.");
  acceptRefund(agreement.id, FREELANCER_ID);

  const cancelled = db.agreements.findById(agreement.id);
  assert.equal(cancelled.status, "CANCELLED");

  // Reassign to Priya Nair (NEW_FREELANCER_ID)
  const { agreement: reassigned } = reassignAgreement(agreement.id, CLIENT_ID, NEW_FREELANCER_ID);

  assert.equal(reassigned.status, "FUNDED");
  assert.equal(reassigned.freelancerId, NEW_FREELANCER_ID);
  assert.equal(reassigned.escrowBalance, 2.0);
  assert.equal(reassigned.previousFreelancerId, FREELANCER_ID);
});
