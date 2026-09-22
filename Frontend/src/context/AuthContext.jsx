import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";
import { toast } from "sonner";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Failed to load user profile:", error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      return data;
    } catch (error) {
      toast.error(error.message || "Failed to login");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await api.register(userData);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data);
      toast.success("Account created successfully!");
      return data;
    } catch (error) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast.info("Logged out successfully");
  };

  const updateProfile = async (data) => {
    try {
      const updated = await api.updateProfile(data);
      setUser((prev) => ({ ...prev, ...updated }));
      toast.success("Profile updated successfully!");
      return updated;
    } catch (error) {
      toast.error(error.message || "Update failed");
      throw error;
    }
  };

  // Instant Demo Account Helper
  const loginAsDemo = async () => {
    const demoEmail = "demo@buildwealth.ai";
    const demoPass = "demo123456";

    try {
      try {
        await login(demoEmail, demoPass);
      } catch {
        // If demo user does not exist yet, register and seed
        const newUser = await register({
          name: "Alex Morgan",
          email: demoEmail,
          password: demoPass,
          currency: "$",
          monthlyIncome: 6500,
        });

        // Seed initial transactions
        const seedTransactions = [
          { title: "Software Engineer Salary", amount: 6500, type: "income", category: "Salary", paymentMethod: "Bank Transfer", date: new Date().toISOString() },
          { title: "Freelance UI Consulting", amount: 850, type: "income", category: "Salary", paymentMethod: "Bank Transfer", date: new Date(Date.now() - 3 * 86400000).toISOString() },
          { title: "Luxury Apartment Rent", amount: 1950, type: "expense", category: "Housing", paymentMethod: "Bank Transfer", date: new Date().toISOString() },
          { title: "Whole Foods Groceries", amount: 245.5, type: "expense", category: "Food & Dining", paymentMethod: "Card", date: new Date(Date.now() - 2 * 86400000).toISOString() },
          { title: "Electric & Fiber Internet", amount: 165, type: "expense", category: "Utilities", paymentMethod: "Card", date: new Date(Date.now() - 5 * 86400000).toISOString() },
          { title: "Sushi Dinner with Friends", amount: 92.4, type: "expense", category: "Food & Dining", paymentMethod: "Card", date: new Date(Date.now() - 1 * 86400000).toISOString() },
          { title: "Uber Rides & City Transit", amount: 68.2, type: "expense", category: "Transportation", paymentMethod: "Card", date: new Date(Date.now() - 4 * 86400000).toISOString() },
          { title: "Netflix & Spotify Subscriptions", amount: 34.98, type: "expense", category: "Entertainment", paymentMethod: "Card", date: new Date(Date.now() - 8 * 86400000).toISOString() },
          { title: "Index Fund Investment (Vanguard)", amount: 1200, type: "expense", category: "Investments", paymentMethod: "Bank Transfer", date: new Date(Date.now() - 6 * 86400000).toISOString() },
        ];

        for (const tx of seedTransactions) {
          await api.addTransaction(tx);
        }

        // Seed budgets
        await api.setBudget({ category: "Food & Dining", limitAmount: 600 });
        await api.setBudget({ category: "Housing", limitAmount: 2000 });
        await api.setBudget({ category: "Transportation", limitAmount: 250 });
        await api.setBudget({ category: "Entertainment", limitAmount: 200 });

        // Seed goals
        await api.addGoal({ title: "Emergency Fund (6 Months)", targetAmount: 15000, currentAmount: 9200, color: "#10b981", category: "Emergency" });
        await api.addGoal({ title: "Japan Autumn Trip", targetAmount: 4500, currentAmount: 2100, color: "#3b82f6", category: "Travel" });
        await api.addGoal({ title: "Tech & Home Office Setup", targetAmount: 2000, currentAmount: 1650, color: "#8b5cf6", category: "Gadgets" });
      }
    } catch (err) {
      console.error("Demo initialization error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        loginAsDemo,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
