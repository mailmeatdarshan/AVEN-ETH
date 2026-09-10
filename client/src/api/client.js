const TOKEN_KEY = "aven_eth_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      "Can't reach the Sidekick server. Make sure the backend is running on port 4000.",
      0
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  me: () => request("/auth/me"),

  freelancers: () => request("/users/freelancers"),
  updateProfile: (payload) => request("/users/profile", { method: "PATCH", body: payload }),

  dashboard: () => request("/dashboard"),

  agreements: () => request("/agreements"),
  agreement: (id) => request(`/agreements/${id}`),
  createAgreement: (payload) => request("/agreements", { method: "POST", body: payload }),
  fundEscrow: (id, body = {}) => request(`/agreements/${id}/fund`, { method: "POST", body }),
  startProject: (id) => request(`/agreements/${id}/start`, { method: "POST" }),
  pauseStream: (id) => request(`/agreements/${id}/pause`, { method: "POST" }),
  resumeStream: (id) => request(`/agreements/${id}/resume`, { method: "POST" }),
  cancelStream: (id) => request(`/agreements/${id}/cancel`, { method: "POST" }),
  withdrawStream: (id, amount) => request(`/agreements/${id}/withdraw`, { method: "POST", body: { amount } }),
  workAction: (id, action) => request(`/agreements/${id}/work/${action}`, { method: "POST" }),
  submitWork: (id, payload) => request(`/agreements/${id}/submit`, { method: "POST", body: payload }),
  approve: (id, rating, review) => request(`/agreements/${id}/approve`, { method: "POST", body: { rating, review } }),
  requestRevision: (id, feedback) =>
    request(`/agreements/${id}/revision`, { method: "POST", body: { feedback } }),
  reject: (id, reason) => request(`/agreements/${id}/reject`, { method: "POST", body: { reason } }),
  dispute: (id, reason) => request(`/agreements/${id}/dispute`, { method: "POST", body: { reason } }),
  resolveDispute: (id, payload) => request(`/agreements/${id}/dispute/resolve`, { method: "POST", body: payload }),

  reputation: (userId) => request(`/reputation${userId ? `/${userId}` : ""}`),
  attestations: (params) => {
    const query = params ? new URLSearchParams(params).toString() : "";
    return request(`/attestations${query ? `?${query}` : ""}`);
  },
  attestation: (id) => request(`/attestations/${id}`),

  transactions: () => request("/transactions"),

  blockchain: (limit) => request(`/blockchain${limit ? `?limit=${limit}` : ""}`),
  verifyBlockchain: () => request("/blockchain/verify"),
  tamperBlock: (blockNumber, newAmount) =>
    request("/blockchain/tamper", { method: "POST", body: { blockNumber, newAmount } }),
  restoreBlockchain: () => request("/blockchain/restore", { method: "POST" }),

  wallet: () => request("/wallet"),
  depositFunds: (amount, note) => request("/wallet/deposit", { method: "POST", body: { amount, note } }),
  transferFunds: (toAddress, amount) => request("/wallet/transfer", { method: "POST", body: { toAddress, amount } }),

  notifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),
};
