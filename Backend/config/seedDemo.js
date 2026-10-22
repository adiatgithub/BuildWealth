import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";

/**
 * Ensures a pre-populated Demo Account exists in the database
 * so non-technical and new users have an immediate, rich experience.
 */
export const seedDemoAccountIfMissing = async () => {
  try {
    const demoEmail = "demo@buildwealth.ai";
    const demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      console.log("Seeding instant demo account (Alex Morgan)...");
      const user = await User.create({
        name: "Alex Morgan",
        email: demoEmail,
        password: "demo123456",
        currency: "$",
        monthlyIncome: 6500,
        savingsTarget: 15000,
      });

      const seedTransactions = [
        { userId: user._id, title: "Software Engineer Salary", amount: 6500, type: "income", category: "Salary", paymentMethod: "Bank Transfer", date: new Date().toISOString() },
        { userId: user._id, title: "Freelance UI Consulting", amount: 850, type: "income", category: "Salary", paymentMethod: "Bank Transfer", date: new Date(Date.now() - 3 * 86400000).toISOString() },
        { userId: user._id, title: "Luxury Apartment Rent", amount: 1950, type: "expense", category: "Housing", paymentMethod: "Bank Transfer", date: new Date().toISOString() },
        { userId: user._id, title: "Whole Foods Groceries", amount: 245.5, type: "expense", category: "Food & Dining", paymentMethod: "Card", date: new Date(Date.now() - 2 * 86400000).toISOString() },
        { userId: user._id, title: "Electric & Fiber Internet", amount: 165, type: "expense", category: "Utilities", paymentMethod: "Card", date: new Date(Date.now() - 5 * 86400000).toISOString() },
        { userId: user._id, title: "Sushi Dinner with Friends", amount: 92.4, type: "expense", category: "Food & Dining", paymentMethod: "Card", date: new Date(Date.now() - 1 * 86400000).toISOString() },
        { userId: user._id, title: "Uber Rides & City Transit", amount: 68.2, type: "expense", category: "Transportation", paymentMethod: "Card", date: new Date(Date.now() - 4 * 86400000).toISOString() },
        { userId: user._id, title: "Netflix & Spotify Subscriptions", amount: 34.98, type: "expense", category: "Entertainment", paymentMethod: "Card", date: new Date(Date.now() - 8 * 86400000).toISOString() },
        { userId: user._id, title: "Index Fund Investment (Vanguard)", amount: 1200, type: "expense", category: "Investments", paymentMethod: "Bank Transfer", date: new Date(Date.now() - 6 * 86400000).toISOString() },
      ];

      await Transaction.insertMany(seedTransactions);

      await Budget.insertMany([
        { userId: user._id, category: "Food & Dining", limitAmount: 600 },
        { userId: user._id, category: "Housing", limitAmount: 2000 },
        { userId: user._id, category: "Transportation", limitAmount: 250 },
        { userId: user._id, category: "Entertainment", limitAmount: 200 },
      ]);

      await Goal.insertMany([
        { userId: user._id, title: "Emergency Fund (6 Months)", targetAmount: 15000, currentAmount: 9200, color: "#10b981", category: "Emergency" },
        { userId: user._id, title: "Japan Autumn Trip", targetAmount: 4500, currentAmount: 2100, color: "#3b82f6", category: "Travel" },
        { userId: user._id, title: "Tech & Home Office Setup", targetAmount: 2000, currentAmount: 1650, color: "#8b5cf6", category: "Gadgets" },
      ]);

      console.log("Demo account seeded successfully.");
    }
  } catch (error) {
    console.warn("Demo account seed check skipped:", error.message);
  }
};
