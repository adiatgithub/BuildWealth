import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Fallback intelligent parser when API key is not configured
const parseFallbackTransaction = (text) => {
  const clean = text.trim();
  const amountMatch = clean.match(/(?:[$€£₹]\s*)?(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 25;

  const lower = clean.toLowerCase();
  let type = "expense";
  if (
    lower.includes("salary") ||
    lower.includes("income") ||
    lower.includes("received") ||
    lower.includes("earned") ||
    lower.includes("bonus") ||
    lower.includes("dividend")
  ) {
    type = "income";
  }

  let category = "Other";
  if (/grocer|food|dinner|lunch|breakfast|restaurant|coffee|starbucks|pizza|cafe/i.test(lower)) {
    category = "Food & Dining";
  } else if (/rent|mortgage|apartment|housing/i.test(lower)) {
    category = "Housing";
  } else if (/uber|lyft|gas|fuel|bus|train|flight|transport/i.test(lower)) {
    category = "Transportation";
  } else if (/netflix|spotify|movie|game|entertainment|hulu|disney/i.test(lower)) {
    category = "Entertainment";
  } else if (/electric|water|internet|utility|wifi|phone|bill/i.test(lower)) {
    category = "Utilities";
  } else if (/gym|doctor|health|medicine|pharmacy|fitness/i.test(lower)) {
    category = "Healthcare";
  } else if (/salary|paycheck|payroll/i.test(lower)) {
    category = "Salary";
  } else if (/stock|crypto|investment|dividend/i.test(lower)) {
    category = "Investments";
  } else if (/shopping|amazon|clothes|shoes/i.test(lower)) {
    category = "Shopping";
  }

  // Extract merchant/title
  let title = clean
    .replace(/(?:spent|paid|bought|received|earned|got|added|\$|\bfor\b|\bat\b|\bon\b|\d+(?:\.\d{1,2})?)/gi, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!title || title.length < 2) {
    title = category !== "Other" ? category : "Expense";
  } else {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    amount,
    type,
    category,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Card",
  };
};

/**
 * Parses natural language input into a structured transaction
 */
export const parseNaturalLanguage = async (text) => {
  const gemini = getGeminiClient();

  if (!gemini) {
    return parseFallbackTransaction(text);
  }

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
Extract transaction details from this text: "${text}".
Return ONLY a valid JSON object matching this schema (no markdown, no backticks, no other text):
{
  "title": "Short descriptive title or merchant name",
  "amount": number (positive float),
  "type": "income" or "expense",
  "category": "Food & Dining" | "Housing" | "Transportation" | "Utilities" | "Entertainment" | "Healthcare" | "Shopping" | "Salary" | "Investments" | "Other",
  "date": "YYYY-MM-DD",
  "paymentMethod": "Card" | "Bank Transfer" | "Cash" | "UPI" | "Crypto" | "Other"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini parse error, falling back to heuristic parser:", error.message);
    return parseFallbackTransaction(text);
  }
};

/**
 * Conversational AI Financial Advisor
 */
export const chatWithAdvisor = async ({ user, transactions, budgets, message, history = [] }) => {
  const gemini = getGeminiClient();

  // Financial summary context
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const categoryTotals = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const currency = user.currency || "$";

  if (!gemini) {
    // Intelligent heuristic response if API key is not yet set
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const topCategoryName = topCategory ? topCategory[0] : "General";
    const topCategoryAmount = topCategory ? topCategory[1] : 0;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    return `### Financial Advisor Summary

Hello ${user.name}! Here is a snapshot of your finances:
- **Net Balance**: ${currency}${balance.toLocaleString()}
- **Total Income**: ${currency}${totalIncome.toLocaleString()}
- **Total Expenses**: ${currency}${totalExpense.toLocaleString()}
- **Current Savings Rate**: **${savingsRate}%** (Target: 20%+)
${topCategory ? `- **Highest Spending Category**: **${topCategoryName}** (${currency}${topCategoryAmount.toLocaleString()})` : ""}

> [!TIP]
> **Key Recommendation**: ${
      savingsRate < 20
        ? `Your savings rate is currently below 20%. Try reviewing your **${topCategoryName}** expenses to identify non-essential purchases.`
        : `Great job! Your savings rate of ${savingsRate}% exceeds the standard 20% target. Consider putting excess cash into high-yield investments.`
    }

*(Note: Add your \`GEMINI_API_KEY\` to \`Backend/.env\` to enable full conversational LLM financial coaching!)*`;
  }

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
You are BuildWealth AI, a world-class certified financial planner and personal finance assistant.
You provide friendly, actionable, mathematically sound, and encouraging advice.

User Profile:
- Name: ${user.name}
- Currency: ${currency}
- Monthly Income: ${currency}${user.monthlyIncome || totalIncome}
- Current Net Balance: ${currency}${balance}
- Total Income: ${currency}${totalIncome}
- Total Expenses: ${currency}${totalExpense}
- Spending Breakdown by Category: ${JSON.stringify(categoryTotals)}
- Active Budgets: ${JSON.stringify(budgets)}
- Recent Transactions: ${JSON.stringify(
      transactions.slice(0, 10).map((t) => ({
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      }))
    )}

Instructions:
1. Always tailor advice directly to their actual numbers.
2. Use markdown formatting with bullet points and bold text for readability.
3. Be supportive, realistic, and focused on long-term wealth building and emergency fund security.
`;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: `Hello ${user.name}! I am BuildWealth AI. I have analyzed your transactions and current balances. How can I assist you with your financial goals today?` }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Gemini advisor error:", error.message);
    return `I am currently analyzing your finances. You have a current balance of ${currency}${balance.toLocaleString()} with total expenses of ${currency}${totalExpense.toLocaleString()}. How can I help you adjust your budget?`;
  }
};

/**
 * Computes financial health score and generates smart proactive insights
 */
export const generateFinancialAudit = ({ user, transactions, budgets }) => {
  const currency = user.currency || "$";
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Compute 0-100 Financial Health Score
  let score = 50;

  // 1. Savings rate component (up to +30 points)
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
  if (savingsRate >= 0.3) score += 30;
  else if (savingsRate >= 0.2) score += 20;
  else if (savingsRate >= 0.1) score += 10;
  else if (savingsRate < 0) score -= 20;

  // 2. Budget adherence component (up to +20 points)
  let overBudgetCount = 0;
  budgets.forEach((b) => {
    if (b.isOverBudget) overBudgetCount++;
  });
  if (budgets.length > 0) {
    if (overBudgetCount === 0) score += 20;
    else score -= overBudgetCount * 8;
  } else {
    score += 5; // Neutral
  }

  score = Math.max(10, Math.min(98, score));

  // Generate actionable insights
  const insights = [];

  // Insight 1: Savings rate
  if (savingsRate >= 0.2) {
    insights.push({
      type: "positive",
      title: "Strong Savings Momentum",
      description: `You are saving ${(savingsRate * 100).toFixed(0)}% of your income. That's above the recommended 20% baseline!`,
      action: "Consider directing surplus to automated index fund investments.",
    });
  } else if (savingsRate < 0) {
    insights.push({
      type: "warning",
      title: "Negative Cash Flow Alert",
      description: `Your monthly expenses (${currency}${totalExpense.toLocaleString()}) exceed your recorded income (${currency}${totalIncome.toLocaleString()}).`,
      action: "Review discretionary spending or log any missing income sources.",
    });
  } else {
    insights.push({
      type: "neutral",
      title: "Moderate Savings Velocity",
      description: `You are currently saving ${(savingsRate * 100).toFixed(0)}% of your earnings. Target 20% for faster financial independence.`,
      action: "Trimming $150 from non-essentials could raise your score significantly.",
    });
  }

  // Insight 2: Category breakdown
  const categoryTotals = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [topCat, topAmount] = sortedCategories[0];
    const topPct = totalExpense > 0 ? Math.round((topAmount / totalExpense) * 100) : 0;
    if (topPct > 35) {
      insights.push({
        type: "warning",
        title: `Heavy Spend in ${topCat}`,
        description: `${topCat} accounts for ${topPct}% of your total expenses (${currency}${topAmount.toLocaleString()}).`,
        action: `Set a strict category budget for ${topCat} to balance your cash flow.`,
      });
    }
  }

  // Insight 3: 50/30/20 Rule recommendation
  if (totalIncome > 0) {
    const recommendedNeeds = totalIncome * 0.5;
    const recommendedWants = totalIncome * 0.3;
    const recommendedSavings = totalIncome * 0.2;

    insights.push({
      type: "recommendation",
      title: "50/30/20 Blueprint",
      description: `Based on your ${currency}${totalIncome.toLocaleString()} income, your optimal split is: Needs (${currency}${recommendedNeeds.toFixed(0)}), Wants (${currency}${recommendedWants.toFixed(0)}), Savings (${currency}${recommendedSavings.toFixed(0)}).`,
      action: "Compare your monthly expenses against this model in your Budgets tab.",
    });
  }

  return {
    score,
    grade: score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D",
    savingsRate: Math.round(savingsRate * 100),
    insights,
  };
};
