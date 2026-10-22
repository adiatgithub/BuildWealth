let rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8021/api";
rawBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
if (!rawBaseUrl.endsWith("/api")) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}
const API_BASE_URL = rawBaseUrl;

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    error.locked = response.status === 423 || Boolean(data.locked);
    error.remainingMinutes = data.remainingMinutes;
    error.attemptsRemaining = data.attemptsRemaining;
    error.tokenExpired = data.code === "TOKEN_EXPIRED";
    error.rateLimited = response.status === 429;
    throw error;
  }

  return data;
};

export const api = {
  // System Health
  checkHealth: () => request("/health"),

  // Auth
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getMe: () => request("/auth/me"),
  updateProfile: (data) => request("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request(`/transactions${qs ? `?${qs}` : ""}`);
  },
  getTransactionStats: () => request("/transactions/stats"),
  addTransaction: (data) => request("/transactions", { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: "DELETE" }),

  // Budgets
  getBudgets: () => request("/budgets"),
  setBudget: (data) => request("/budgets", { method: "POST", body: JSON.stringify(data) }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: "DELETE" }),

  // Goals
  getGoals: () => request("/goals"),
  addGoal: (data) => request("/goals", { method: "POST", body: JSON.stringify(data) }),
  depositToGoal: (id, amount) => request(`/goals/${id}/deposit`, { method: "POST", body: JSON.stringify({ amount }) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: "DELETE" }),

  // AI
  parseTransaction: (text) => request("/ai/parse-transaction", { method: "POST", body: JSON.stringify({ text }) }),
  chatAdvisor: (message, history = []) => request("/ai/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  streamChatAdvisor: async (message, history = [], onChunk, onDone) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/ai/chat-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Streaming request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let actionChips = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      const lines = raw.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.replace("data: ", "").trim());
            if (data.chunk) {
              accumulated += data.chunk;
              if (onChunk) onChunk(data.chunk, accumulated);
            }
            if (data.done) {
              if (data.actionChips && data.actionChips.length > 0) {
                actionChips = data.actionChips;
              }
              if (data.reply) {
                accumulated = data.reply;
              }
            }
          } catch {
            // partial chunk ignored
          }
        }
      }
    }

    if (onDone) onDone(accumulated, actionChips);
    return { reply: accumulated, actionChips };
  },
  getInsights: () => request("/ai/insights"),
};

export default api;
