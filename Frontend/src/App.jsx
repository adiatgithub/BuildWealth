import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import RootLayout from "./components/layouts/root-layout.page.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AiChatWidget from "./components/AiChatWidget.jsx";

// Pages
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import BudgetsGoalsPage from "./pages/BudgetsGoalsPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import AiAdvisorPage from "./pages/AiAdvisorPage.jsx";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* Public Routes */}
          <Route index element={<LandingPage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage />} />

          {/* Authenticated Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsGoalsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ai-advisor" element={<AiAdvisorPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <AiChatWidget />
    </AuthProvider>
  );
}

export default App;
