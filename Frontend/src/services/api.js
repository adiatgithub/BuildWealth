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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
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
  getInsights: () => request("/ai/insights"),
};

export default api;
