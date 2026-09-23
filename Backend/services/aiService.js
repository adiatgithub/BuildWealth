import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey.trim());
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
  if (/grocer|food|dinner|lunch|breakfast|restaurant|coffee|starbucks|pizza|cafe|burger|chipotle/i.test(lower)) {
    category = "Food & Dining";
  } else if (/rent|mortgage|apartment|housing|lease/i.test(lower)) {
    category = "Housing";
  } else if (/uber|lyft|gas|fuel|bus|train|flight|transit|subway|metro/i.test(lower)) {
    category = "Transportation";
  } else if (/netflix|spotify|movie|game|entertainment|hulu|disney|steam|cinema/i.test(lower)) {
    category = "Entertainment";
  } else if (/electric|water|internet|utility|wifi|phone|bill|power/i.test(lower)) {
    category = "Utilities";
  } else if (/gym|doctor|health|medicine|pharmacy|fitness|dental/i.test(lower)) {
    category = "Healthcare";
  } else if (/salary|paycheck|payroll|stipend/i.test(lower)) {
    category = "Salary";
  } else if (/stock|crypto|investment|dividend|etf|vanguard/i.test(lower)) {
    category = "Investments";
  } else if (/shopping|amazon|clothes|shoes|store|mall/i.test(lower)) {
    category = "Shopping";
  }

  // Extract merchant/title
  let title = clean
    .replace(/(?:spent|paid|bought|received|earned|got|added|\$|€|£|₹|\bfor\b|\bat\b|\bon\b|\d+(?:\.\d{1,2})?)/gi, " ")
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
 * Real-Time Conversational AI Financial Advisor
 */
export const chatWithAdvisor = async ({ user, transactions = [], budgets = [], goals = [], message, history = [] }) => {
  const currency = user.currency || "$";

  // Real-time metrics calculation
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const categoryTotals = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0] || ["None", 0];

  const gemini = getGeminiClient();

  // If live Gemini API Key is configured, use Google's LLM
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

      const financialContext = `
You are BuildWealth AI, a certified financial planner and personal wealth strategist.
You are having a real-time conversation with ${user.name}.
Answer directly, concisely, and supportively. Use bullet points and markdown bold where appropriate.

Live Real-Time Financial Snapshot of ${user.name}:
- Currency: ${currency}
- Recorded Monthly Income: ${currency}${user.monthlyIncome || totalIncome}
- Live Net Balance: ${currency}${netBalance.toLocaleString()}
- Total Income Logged: ${currency}${totalIncome.toLocaleString()}
- Total Expenses Logged: ${currency}${totalExpense.toLocaleString()}
- Current Savings Rate: ${savingsRate}%
- Top Spending Category: ${topCategory[0]} (${currency}${topCategory[1].toLocaleString()})
- Spending by Category: ${JSON.stringify(categoryTotals)}
- Active Budgets: ${JSON.stringify(budgets.map((b) => ({ category: b.category, limit: b.limitAmount, spent: b.spent, isOver: b.isOverBudget })))}
- Active Savings Goals: ${JSON.stringify(goals.map((g) => ({ title: g.title, target: g.targetAmount, current: g.currentAmount, pct: g.percentage })))}
- Recent 10 Transactions: ${JSON.stringify(transactions.slice(0, 10).map((t) => ({ title: t.title, amount: t.amount, type: t.type, category: t.category, date: t.date })))}

Guidelines:
1. If the user asks a question about their personal money, spending, affordability, or budgets, use their actual live numbers above.
2. If the user asks a general financial, investment, or wealth question (e.g. index funds, 401k, emergency fund, compound interest), explain it with crystal clarity and practical examples.
3. Be encouraging, actionable, and focus on long-term wealth building.
`;

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: financialContext }],
          },
          {
            role: "model",
            parts: [{ text: `Hello ${user.name}! I am BuildWealth AI. I have synchronized with your real-time transactions, budgets, and savings goals. How can I help optimize your money today?` }],
          },
          ...history.slice(-8).map((h) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.parts?.[0]?.text || h.text || "" }],
          })),
        ],
      });

      const response = await chat.sendMessage(message);
      return response.response.text();
    } catch (err) {
      console.warn("Gemini real-time query failed, switching to real-time heuristic NLP engine:", err.message);
    }
  }

  // Real-Time Intelligent Heuristic NLP Engine (works 100% offline & without API keys)
  const q = message.toLowerCase().trim();

  // 1. Affordability queries: "Can I afford $X?", "Can I buy X for $Y?"
  const affordMatch = q.match(/(?:afford|buy|spend|purchase).*?(\d+)/i) || q.match(/(\d+).*?(?:afford|buy|spend)/i);
  if (affordMatch) {
    const itemCost = parseFloat(affordMatch[1]);
    const surplus = netBalance - itemCost;
    if (itemCost > netBalance) {
      return `### Affordability Assessment

Based on your current live balance of **${currency}${netBalance.toLocaleString()}**, spending **${currency}${itemCost.toLocaleString()}** would put your account into negative cash flow by **${currency}${Math.abs(surplus).toLocaleString()}**.

> [!WARNING]
> **Recommendation**: Delay this purchase until your next income cycle or allocate surplus from discretionary categories like **${topCategory[0]}**.`;
    } else if (surplus < (totalIncome * 0.1)) {
      return `### Affordability Assessment

You have **${currency}${netBalance.toLocaleString()}** available, so you *can* technically afford the **${currency}${itemCost.toLocaleString()}** purchase. 

However, it would leave you with only **${currency}${surplus.toLocaleString()}** in reserve, which is under 10% of your monthly cashflow buffer.

> [!TIP]
> **Advisor Tip**: If this is non-essential, consider funding it from your discretionary budget or splitting the expense over two months.`;
    } else {
      return `### Affordability Assessment

**Yes, you can comfortably afford this purchase!** 

- Current Liquid Balance: **${currency}${netBalance.toLocaleString()}**
- Purchase Amount: **${currency}${itemCost.toLocaleString()}**
- Remaining Balance: **${currency}${surplus.toLocaleString()}**

Your savings rate remains in a healthy range. Enjoy the purchase responsibly!`;
    }
  }

  // 2. Category spending queries: "How much did I spend on food/uber/etc.?"
  for (const [catName, catAmount] of Object.entries(categoryTotals)) {
    if (q.includes(catName.toLowerCase()) || (catName === "Food & Dining" && (q.includes("food") || q.includes("dining") || q.includes("grocer") || q.includes("restaurant")))) {
      const catTransactions = transactions.filter((t) => t.category === catName);
      const pctOfTotal = totalExpense > 0 ? Math.round((catAmount / totalExpense) * 100) : 0;

      return `### Spending Analysis: ${catName}

You have spent **${currency}${catAmount.toLocaleString()}** on **${catName}**, which accounts for **${pctOfTotal}%** of your total monthly expenses.

**Recent Transactions in this category:**
${catTransactions.slice(0, 3).map((t) => `- **${t.title}**: ${currency}${t.amount.toLocaleString()} (${new Date(t.date).toLocaleDateString()})`).join("\n")}

> [!TIP]
> ${pctOfTotal > 30 ? `This category is currently taking up a major portion of your budget. Setting a strict monthly cap could save you up to ${currency}${(catAmount * 0.2).toFixed(0)}/month.` : `Your spending in ${catName} is well-controlled!`}`;
    }
  }

  // 3. 50/30/20 budget breakdown queries
  if (q.includes("50/30/20") || q.includes("rule") || q.includes("breakdown") || q.includes("budget plan")) {
    const incomeBase = user.monthlyIncome || totalIncome || 5000;
    const needs = incomeBase * 0.5;
    const wants = incomeBase * 0.3;
    const savings = incomeBase * 0.2;

    return `### Personalized 50/30/20 Wealth Blueprint

Based on your monthly income of **${currency}${incomeBase.toLocaleString()}**, here is your optimal allocation:

1. **Needs (50%) — ${currency}${needs.toLocaleString()}/mo**
   - Housing, utilities, groceries, transportation, and health insurance.
2. **Wants (30%) — ${currency}${wants.toLocaleString()}/mo**
   - Dining out, entertainment, shopping, hobbies, and weekend trips.
3. **Savings & Investing (20%) — ${currency}${savings.toLocaleString()}/mo**
   - Emergency reserve, index funds, retirement accounts, and debt payoff.

**Your Current Reality:**
- Current Inflow: **${currency}${totalIncome.toLocaleString()}**
- Current Outflow: **${currency}${totalExpense.toLocaleString()}**
- Current Savings Rate: **${savingsRate}%** ${savingsRate >= 20 ? "✅ (Meeting the 20% benchmark!)" : "⚠️ (Aim for 20% for accelerated wealth building)"}`;
  }

  // 4. Cutting expenses queries: "How can I cut expenses?", "How to save $300?"
  if (q.includes("cut") || q.includes("save") || q.includes("reduce") || q.includes("decrease")) {
    const targetCut = (q.match(/\d+/) ? parseFloat(q.match(/\d+/)[0]) : 250);
    return `### Actionable Expense Reduction Strategy

To save **${currency}${targetCut.toLocaleString()}** this month, here is a custom roadmap based on your active spending:

1. **Review ${topCategory[0]}**:
   - You currently spend **${currency}${topCategory[1].toLocaleString()}** in this category.
   - Reducing non-essential orders by 20% frees up **${currency}${(topCategory[1] * 0.2).toFixed(0)}**.
2. **Audit Subscriptions & Recurring Bills**:
   - Cancel streaming services or gym memberships you haven't used in 30 days (typical savings: **${currency}40–${currency}75/mo**).
3. **Automate the Difference**:
   - Immediately schedule an automated transfer of **${currency}${targetCut.toLocaleString()}** on payday straight into your high-yield savings goal.`;
  }

  // 5. Emergency fund queries:
  if (q.includes("emergency") || q.includes("reserve") || q.includes("rainy day")) {
    const threeMonths = (totalExpense || 2500) * 3;
    const sixMonths = (totalExpense || 2500) * 6;
    return `### Emergency Fund Recommendation

An emergency fund protects you from unexpected expenses without resorting to credit card debt.

- **Your Estimated Monthly Expenses**: ${currency}${totalExpense.toLocaleString()}
- **3-Month Baseline**: **${currency}${threeMonths.toLocaleString()}**
- **6-Month Fully Funded Reserve**: **${currency}${sixMonths.toLocaleString()}**

> [!TIP]
> Keep this fund in a **High-Yield Savings Account (HYSA)** earning 4–5% APY so your capital grows while staying 100% liquid!`;
  }

  // 6. General Finance queries (Index funds, compound interest, investing):
  if (q.includes("compound interest") || q.includes("interest")) {
    return `### The Power of Compound Interest

Compound interest is earning interest on both your initial principal **and** previously accumulated interest.

- **Example**: If you invest **${currency}500/month** at an average 8% annual return (historical S&P 500 average):
  - After 10 years: You contributed ${currency}60,000 ➔ **Total Value: ${currency}91,473** (${currency}31k in free interest!)
  - After 20 years: You contributed ${currency}120,000 ➔ **Total Value: ${currency}294,510**
  - After 30 years: You contributed ${currency}180,000 ➔ **Total Value: ${currency}745,180**

Time in the market beats timing the market. Start small and automate monthly deposits!`;
  }

  if (q.includes("index fund") || q.includes("invest") || q.includes("stock")) {
    return `### Index Fund Investing 101

An **Index Fund** holds a basket of hundreds of top companies (e.g. S&P 500: Apple, Microsoft, Amazon, Google).

**Key Advantages:**
1. **Instant Diversification**: If one company drops, the other 499 balance it out.
2. **Ultra-Low Fees**: Index funds charge under 0.05% expense ratio compared to 1–2% for active fund managers.
3. **Proven Long-Term Growth**: Historically, broad market index funds outperform 90% of professional stock pickers over 10+ year horizons.

> [!TIP]
> Popular broad-market index funds include **VOO**, **VTI**, and **SPY**.`;
  }

  // 7. General financial advisor default response
  return `### Financial Advisory Overview

Hello ${user.name}! Here is your current real-time financial standing:
- **Net Liquidity**: ${currency}${netBalance.toLocaleString()}
- **Monthly Income**: ${currency}${totalIncome.toLocaleString()}
- **Total Expenses**: ${currency}${totalExpense.toLocaleString()}
- **Savings Rate**: **${savingsRate}%**
- **Top Spend Category**: **${topCategory[0]}** (${currency}${topCategory[1].toLocaleString()})

How would you like to optimize your wealth today? You can ask me:
- *"Can I afford a $350 purchase?"*
- *"How much have I spent on food?"*
- *"Give me a 50/30/20 budget breakdown"*
- *"Explain index funds or compound interest"*`;
};

/**
 * Computes financial health score and generates smart proactive insights
 */
export const generateFinancialAudit = ({ user, transactions = [], budgets = [] }) => {
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
      action: `Trimming ${currency}150 from non-essentials could raise your score significantly.`,
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
    if (topPct > 30) {
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
