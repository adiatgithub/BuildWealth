import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey.trim());
};

/**
 * Returns a working generative model from the supported cascade
 */
const getActiveModel = (gemini, systemInstruction = null) => {
  for (const modelName of GEMINI_MODELS) {
    try {
      const options = { model: modelName };
      if (systemInstruction) {
        options.systemInstruction = systemInstruction;
      }
      return gemini.getGenerativeModel(options);
    } catch {
      // try next model
    }
  }
  return gemini.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
};

// Fallback intelligent parser when API key is not configured or unavailable
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
    const model = getActiveModel(gemini);
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
 * Parse suggested action prompts from generated model text
 */
export const extractPromptsAndClean = (rawText) => {
  const match = rawText.match(/SUGGESTED_PROMPTS:\s*(\[.*?\])/s);
  let actionChips = [];
  let cleanText = rawText;

  if (match) {
    try {
      actionChips = JSON.parse(match[1]);
      cleanText = rawText.replace(/SUGGESTED_PROMPTS:\s*\[.*?\]/s, "").trim();
    } catch {
      // fallback manual parse
      const lines = match[1].replace(/[\[\]"]/g, "").split(",");
      actionChips = lines.map((s) => s.trim()).filter(Boolean);
      cleanText = rawText.replace(/SUGGESTED_PROMPTS:.*$/s, "").trim();
    }
  }

  // Default follow-up suggestions if none extracted
  if (!actionChips || actionChips.length === 0) {
    actionChips = [
      "Can I afford a $300 purchase?",
      "Show my 50/30/20 budget breakdown",
      "How can I cut expenses this month?",
    ];
  }

  return { cleanText, actionChips };
};

/**
 * Builds live real-time financial context from the user's database records
 */
const buildFinancialContext = ({ user, transactions = [], budgets = [], goals = [] }) => {
  const currency = user.currency || "$";

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

  return `
You are BuildWealth AI, a certified financial planner, wealth architect, and personal money coach.
You are having an interactive real-time conversation with ${user.name}.
Respond concisely, directly, and supportively. Use bullet points and markdown bold where appropriate.

Live Real-Time Financial Snapshot of ${user.name}:
- Currency: ${currency}
- Recorded Monthly Income: ${currency}${user.monthlyIncome || totalIncome}
- Live Liquid Balance (Inflow minus Outflow): ${currency}${netBalance.toLocaleString()}
- Total Income Logged: ${currency}${totalIncome.toLocaleString()}
- Total Expenses Logged: ${currency}${totalExpense.toLocaleString()}
- Current Savings Rate: ${savingsRate}%
- Top Spending Category: ${topCategory[0]} (${currency}${topCategory[1].toLocaleString()})
- Spending by Category: ${JSON.stringify(categoryTotals)}
- Active Category Budgets: ${JSON.stringify(budgets.map((b) => ({ category: b.category, limit: b.limitAmount, spent: b.spent, isOver: b.isOverBudget })))}
- Active Savings Goals: ${JSON.stringify(goals.map((g) => ({ title: g.title, target: g.targetAmount, current: g.currentAmount, pct: g.percentage })))}
- Recent Transactions: ${JSON.stringify(transactions.slice(0, 10).map((t) => ({ title: t.title, amount: t.amount, type: t.type, category: t.category, date: t.date })))}

Core Guidelines:
1. Always calculate answers using the client's ACTUAL numbers above when they ask about affordability, budgets, savings, or spending.
2. If they ask a general wealth or investment question (e.g. index funds, Roth IRA, emergency fund, compound interest), explain it with crystal clarity and realistic math.
3. Be proactive: if a budget category is exceeded or near max, politely point it out and offer a specific fix.
4. At the very end of your response, on a new line, always provide 2 to 3 concise, highly relevant follow-up questions or action prompts the user might want to ask next, formatted exactly like this:
SUGGESTED_PROMPTS: ["Short Follow-up Question 1?", "Short Follow-up Question 2?", "Short Follow-up Question 3?"]
`;
};

/**
 * Real-Time Token Streaming Advisor (Server-Sent Events)
 */
export const streamAdvisor = async ({
  user,
  transactions = [],
  budgets = [],
  goals = [],
  message,
  history = [],
  onChunk,
}) => {
  const gemini = getGeminiClient();
  const financialContext = buildFinancialContext({ user, transactions, budgets, goals });

  if (gemini) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = gemini.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: financialContext }],
            },
            {
              role: "model",
              parts: [
                {
                  text: `Hello ${user.name}! I am BuildWealth AI. I have synchronized with your real-time transactions, budgets, and savings goals. How can I help optimize your money today?`,
                },
              ],
            },
            ...history.slice(-8).map((h) => ({
              role: h.role === "assistant" || h.role === "model" ? "model" : "user",
              parts: [{ text: h.parts?.[0]?.text || h.text || "" }],
            })),
          ],
        });

        const result = await chat.sendMessageStream(message);
        let accumulatedText = "";

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          accumulatedText += chunkText;
          if (onChunk) {
            onChunk(chunkText);
          }
        }

        const { cleanText, actionChips } = extractPromptsAndClean(accumulatedText);
        return { reply: cleanText, actionChips };
      } catch (err) {
        console.warn(`Model ${modelName} streaming failed (${err.status || err.message}), attempting fallback...`);
      }
    }
  }

  // Fallback to real-time heuristic response generator if cloud AI is offline
  const heuristicReply = getHeuristicAdvisorResponse({ user, transactions, budgets, goals, message });
  const { cleanText, actionChips } = extractPromptsAndClean(heuristicReply);

  // Stream heuristic words with micro-delays for fluid real-time feel
  if (onChunk) {
    const words = cleanText.split(" ");
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(" ") + " ";
      onChunk(chunk);
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  return { reply: cleanText, actionChips };
};

/**
 * Standard request-response wrapper for backward-compatibility
 */
export const chatWithAdvisor = async ({ user, transactions = [], budgets = [], goals = [], message, history = [] }) => {
  return await streamAdvisor({
    user,
    transactions,
    budgets,
    goals,
    message,
    history,
    onChunk: null,
  });
};

/**
 * Real-Time Intelligent Heuristic NLP Engine (works 100% offline & without API keys)
 */
const getHeuristicAdvisorResponse = ({ user, transactions = [], budgets = [], goals = [], message }) => {
  const currency = user.currency || "$";
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
> **Recommendation**: Delay this purchase until your next income cycle or allocate surplus from discretionary categories like **${topCategory[0]}**.

SUGGESTED_PROMPTS: ["How can I save up for this?", "How much can I safely spend today?", "Show my top spending categories"]`;
    } else if (surplus < totalIncome * 0.1) {
      return `### Affordability Assessment

You have **${currency}${netBalance.toLocaleString()}** available, so you *can* technically afford the **${currency}${itemCost.toLocaleString()}** purchase. 

However, it would leave you with only **${currency}${surplus.toLocaleString()}** in reserve, which is under 10% of your monthly cashflow buffer.

> [!TIP]
> **Advisor Tip**: If this is non-essential, consider funding it from your discretionary budget or splitting the expense over two months.

SUGGESTED_PROMPTS: ["What can I cut to make room for this?", "Calculate my emergency fund", "Show 50/30/20 breakdown"]`;
    } else {
      return `### Affordability Assessment

**Yes, you can comfortably afford this purchase!** 

- Current Liquid Balance: **${currency}${netBalance.toLocaleString()}**
- Purchase Amount: **${currency}${itemCost.toLocaleString()}**
- Remaining Balance: **${currency}${surplus.toLocaleString()}**

Your savings rate remains in a healthy range. Enjoy the purchase responsibly!

SUGGESTED_PROMPTS: ["How will this affect my savings goal?", "Show my budget progress", "Give me an investment tip"]`;
    }
  }

  // 2. Category spending queries: "How much did I spend on food/uber/etc.?"
  for (const [catName, catAmount] of Object.entries(categoryTotals)) {
    if (
      q.includes(catName.toLowerCase()) ||
      (catName === "Food & Dining" &&
        (q.includes("food") || q.includes("dining") || q.includes("grocer") || q.includes("restaurant")))
    ) {
      const catTransactions = transactions.filter((t) => t.category === catName);
      const pctOfTotal = totalExpense > 0 ? Math.round((catAmount / totalExpense) * 100) : 0;

      return `### Spending Analysis: ${catName}

You have spent **${currency}${catAmount.toLocaleString()}** on **${catName}**, which accounts for **${pctOfTotal}%** of your total monthly expenses.

**Recent Transactions in this category:**
${catTransactions.slice(0, 3).map((t) => `- **${t.title}**: ${currency}${t.amount.toLocaleString()} (${new Date(t.date).toLocaleDateString()})`).join("\n")}

> [!TIP]
> ${pctOfTotal > 30 ? `This category is currently taking up a major portion of your budget. Setting a strict monthly cap could save you up to ${currency}${(catAmount * 0.2).toFixed(0)}/month.` : `Your spending in ${catName} is well-controlled!`}

SUGGESTED_PROMPTS: ["How can I reduce spending on ${catName}?", "Set a budget for ${catName}", "Can I afford to dine out tonight?"]`;
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
- Current Savings Rate: **${savingsRate}%** ${savingsRate >= 20 ? "✅ (Meeting the 20% benchmark!)" : "⚠️ (Aim for 20% for accelerated wealth building)"}

SUGGESTED_PROMPTS: ["How do I fix my wants budget?", "Explain index funds", "Calculate my emergency fund"]`;
  }

  // 4. Cutting expenses queries
  if (q.includes("cut") || q.includes("save") || q.includes("reduce") || q.includes("decrease")) {
    const targetCut = q.match(/\d+/) ? parseFloat(q.match(/\d+/)[0]) : 250;
    return `### Actionable Expense Reduction Strategy

To save **${currency}${targetCut.toLocaleString()}** this month, here is a custom roadmap based on your active spending:

1. **Review ${topCategory[0]}**:
   - You currently spend **${currency}${topCategory[1].toLocaleString()}** in this category.
   - Reducing non-essential orders by 20% frees up **${currency}${(topCategory[1] * 0.2).toFixed(0)}**.
2. **Audit Subscriptions & Recurring Bills**:
   - Cancel streaming services or gym memberships you haven't used in 30 days (typical savings: **${currency}40–${currency}75/mo**).
3. **Automate the Difference**:
   - Immediately schedule an automated transfer of **${currency}${targetCut.toLocaleString()}** on payday straight into your high-yield savings goal.

SUGGESTED_PROMPTS: ["How much have I spent on subscriptions?", "Can I afford a $100 purchase?", "Show 50/30/20 plan"]`;
  }

  // Default response
  return `### Financial Advisory Overview

Hello ${user.name}! Here is your current real-time financial standing:
- **Net Liquidity**: ${currency}${netBalance.toLocaleString()}
- **Monthly Income**: ${currency}${totalIncome.toLocaleString()}
- **Total Expenses**: ${currency}${totalExpense.toLocaleString()}
- **Savings Rate**: **${savingsRate}%**
- **Top Spend Category**: **${topCategory[0]}** (${currency}${topCategory[1].toLocaleString()})

How would you like to optimize your wealth today?

SUGGESTED_PROMPTS: ["Can I afford a $350 purchase?", "How much have I spent on food?", "Calculate my 50/30/20 budget"]`;
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

  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
  if (savingsRate >= 0.3) score += 30;
  else if (savingsRate >= 0.2) score += 20;
  else if (savingsRate >= 0.1) score += 10;
  else if (savingsRate < 0) score -= 20;

  let overBudgetCount = 0;
  budgets.forEach((b) => {
    if (b.isOverBudget) overBudgetCount++;
  });
  if (budgets.length > 0) {
    if (overBudgetCount === 0) score += 20;
    else score -= overBudgetCount * 8;
  } else {
    score += 5;
  }

  score = Math.max(10, Math.min(98, score));

  const insights = [];

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

  return {
    score,
    grade: score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D",
    savingsRate: Math.round(savingsRate * 100),
    insights,
  };
};
