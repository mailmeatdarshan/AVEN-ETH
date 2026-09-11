import { Router } from "express";
import { db } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { recordTransaction } from "../services/escrowService.js";
import { notify } from "../services/notificationService.js";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const userId = req.user.id;
  const user = db.users.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  // Calculate locked funds in active agreements
  let lockedInEscrows = 0;
  const activeAgreements = db.agreements.find(
    (a) =>
      ["FUNDED", "IN_PROGRESS", "PAUSED", "SUBMITTED", "REVISION_REQUESTED"].includes(a.status) &&
      (a.clientId === userId || a.freelancerId === userId)
  );

  activeAgreements.forEach((a) => {
    if (a.clientId === userId) {
      lockedInEscrows += Number(a.escrowBalance || 0);
    }
  });

  // Calculate total settled earnings or payments
  const userTxns = db.transactions.find(
    (t) => t.fromUser === userId || t.toUser === userId
  );

  res.json({
    wallet: {
      userId: user.id,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
      availableBalance: Math.round((user.walletBalance || 0) * 10000) / 10000,
      lockedInEscrows: Math.round(lockedInEscrows * 10000) / 10000,
      totalTransactions: userTxns.length,
      network: "Aven Testnet (Chain ID: 31337)",
    },
    activeStreams: activeAgreements.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      budget: a.budget,
      escrowBalance: a.escrowBalance,
      status: a.status,
    })),
    transactions: userTxns.slice(-20).reverse(),
  });
});

router.post("/deposit", (req, res) => {
  const userId = req.user.id;
  const user = db.users.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const amount = Number(req.body.amount);
  if (!amount || amount <= 0 || isNaN(amount)) {
    return res.status(400).json({ error: "Please enter a valid deposit amount greater than 0." });
  }
  if (amount > 1000) {
    return res.status(400).json({ error: "Maximum deposit limit per transaction is 1,000 USDC." });
  }

  const roundedAmount = Math.round(amount * 10000) / 10000;
  const newBalance = Math.round(((user.walletBalance || 0) + roundedAmount) * 10000) / 10000;

  db.users.update(userId, { walletBalance: newBalance });

  // Record deposit on blockchain
  const txn = recordTransaction({
    agreementId: null,
    fromUser: "FAUCET_RESERVE",
    toUser: userId,
    type: "WALLET_DEPOSIT",
    amount: roundedAmount,
    data: {
      method: "SIMULATED_FAUCET_DEPOSIT",
      note: req.body.note || "Wallet funds deposit",
    },
  });

  notify(userId, {
    type: "WALLET_DEPOSIT",
    title: "Funds Deposited to Wallet",
    message: `Successfully credited ${roundedAmount.toFixed(4)} USDC to your wallet. Tx: ${txn.simulatedTxHash.slice(0, 10)}...`,
  });

  res.json({
    success: true,
    amountDeposited: roundedAmount,
    newBalance,
    transaction: txn,
  });
});

router.post("/transfer", (req, res) => {
  const userId = req.user.id;
  const user = db.users.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const { toAddress } = req.body;
  const amount = Number(req.body.amount);

  if (!toAddress || typeof toAddress !== "string" || !toAddress.startsWith("0x")) {
    return res.status(400).json({ error: "Please provide a valid Ethereum wallet address (0x...)." });
  }
  if (!amount || amount <= 0 || isNaN(amount)) {
    return res.status(400).json({ error: "Please enter a valid transfer amount greater than 0." });
  }

  const currentBalance = user.walletBalance || 0;
  if (amount > currentBalance) {
    return res.status(400).json({
      error: `Insufficient balance. Available: ${currentBalance.toFixed(4)} USDC, Requested: ${amount.toFixed(4)} USDC.`,
    });
  }

  const roundedAmount = Math.round(amount * 10000) / 10000;
  const newSenderBalance = Math.round((currentBalance - roundedAmount) * 10000) / 10000;
  db.users.update(userId, { walletBalance: newSenderBalance });

  // If recipient is another user in the system, credit them
  const recipient = db.users.findOne((u) => u.walletAddress?.toLowerCase() === toAddress.toLowerCase());
  if (recipient) {
    const newRecipBalance = Math.round(((recipient.walletBalance || 0) + roundedAmount) * 10000) / 10000;
    db.users.update(recipient.id, { walletBalance: newRecipBalance });

    notify(recipient.id, {
      type: "WALLET_TRANSFER",
      title: "Funds Received",
      message: `Received ${roundedAmount.toFixed(4)} USDC from ${user.name}.`,
    });
  }

  const txn = recordTransaction({
    agreementId: null,
    fromUser: userId,
    toUser: recipient?.id || toAddress,
    type: "WALLET_TRANSFER",
    amount: roundedAmount,
    data: {
      recipientAddress: toAddress,
    },
  });

  notify(userId, {
    type: "WALLET_TRANSFER",
    title: "Transfer Sent",
    message: `Transferred ${roundedAmount.toFixed(4)} USDC to ${toAddress.slice(0, 10)}...`,
  });

  res.json({
    success: true,
    amountTransferred: roundedAmount,
    newBalance: newSenderBalance,
    transaction: txn,
  });
});

export default router;
