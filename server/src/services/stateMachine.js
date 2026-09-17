// Central definition of every legal agreement-status transition.
// Nothing in the codebase should mutate `agreement.status` directly —
// always go through `assertTransition` so an invalid jump (e.g.
// COMPLETED -> IN_PROGRESS) throws instead of silently corrupting state.

export const STATUSES = [
  "PENDING_FUNDING",
  "FUNDED",
  "IN_PROGRESS",
  "PAUSED",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "SETTLEMENT_OFFERED",
  "REFUND_PENDING",
  "APPROVED",
  "RELEASED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
];

const TRANSITIONS = {
  PENDING_FUNDING: ["FUNDED", "CANCELLED"],
  FUNDED: ["IN_PROGRESS", "PAUSED", "CANCELLED"],
  IN_PROGRESS: ["PAUSED", "SUBMITTED", "COMPLETED", "CANCELLED", "DISPUTED", "SETTLEMENT_OFFERED", "REFUND_PENDING"],
  PAUSED: ["IN_PROGRESS", "CANCELLED", "DISPUTED", "SETTLEMENT_OFFERED", "REFUND_PENDING"],
  SUBMITTED: ["REVISION_REQUESTED", "COMPLETED", "CANCELLED", "DISPUTED", "SETTLEMENT_OFFERED", "REFUND_PENDING"],
  REVISION_REQUESTED: ["IN_PROGRESS", "CANCELLED", "SUBMITTED", "SETTLEMENT_OFFERED", "REFUND_PENDING"],
  SETTLEMENT_OFFERED: ["COMPLETED", "SETTLEMENT_OFFERED", "DISPUTED", "CANCELLED", "IN_PROGRESS", "REVISION_REQUESTED"],
  REFUND_PENDING: ["CANCELLED", "DISPUTED", "IN_PROGRESS", "SETTLEMENT_OFFERED"],
  APPROVED: ["RELEASED", "COMPLETED"],
  RELEASED: ["COMPLETED"],
  DISPUTED: ["IN_PROGRESS", "CANCELLED", "COMPLETED", "SETTLEMENT_OFFERED"],
  COMPLETED: [],
  CANCELLED: ["FUNDED", "IN_PROGRESS", "PENDING_FUNDING"], // Reassignment transition
};

export class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Cannot move an agreement from ${from} to ${to}.`);
    this.name = "InvalidTransitionError";
    this.status = 409;
  }
}

export function assertTransition(from, to) {
  const allowed = TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}
