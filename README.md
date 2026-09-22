# 🪙 BuildWealth.AI

> **Autonomous Personal Wealth & Financial Intelligence Platform powered by Generative AI.**

#Live Demo:-
https://build-wealth-git-main-adiatgithubs-projects.vercel.app/

BuildWealth.AI is a full-stack personal finance application that transforms raw transactions into actionable financial intelligence. Featuring automated category budgeting, visual cashflow analytics, target savings milestones, natural language transaction parsing, and a 24/7 conversational AI Financial Advisor.

## Features

- **/  AI Smart Quick-Entry (Natural Language Parsing)**
  - Type or speak naturally: *"Spent $64 on sushi dinner with friends yesterday"*
  - The AI engine automatically extracts the merchant, amount, category (`Food & Dining`), payment method, and date with zero manual form filling.

- **/ 24/7 Contextual AI Financial Advisor**
  - An intelligent financial planner connected directly to your live transactions, monthly cashflow, and budgets.
  - Ask: *"How can I cut expenses by $300 this month?"* or *"Break down a 50/30/20 budget for my income"* and receive mathematically grounded, tailored recommendations.

- **/ Visual Cashflow & Category Analytics**
  - **Monthly Inflow vs. Outflow**: Interactive bar charts tracking cashflow trajectory over 6 months.
  - **Category Expense Breakdown**: Dynamic donut charts displaying where capital is deployed.
  - **Financial Health Score**: Algorithmic 0–100 rating based on savings rate, budget discipline, and spending velocity.

- **/ Category Budgets & Alerts**
  - Set monthly limits for Food, Housing, Utilities, Transportation, Entertainment, and more.
  - Real-time progress bars with instant visual alerts: `On Track` (green), `Near Limit` (amber), and `Over Budget` (rose).


- **/ Bank-Grade Security**
  - JWT (JSON Web Tokens) stateless authentication with bcrypt password hashing.
  - Automatic MongoDB connection fallback ensures 99.9% uptime during network changes.

## Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Glassmorphism UI tokens
- **Components**: [Radix UI / shadcn](https://ui.shadcn.com/) (Navigation Menu, Sheet, Sonner)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: `jsonwebtoken` (JWT) + `bcryptjs`
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini) with built-in heuristic fallback engine

---

##  Project Structure

```text
ai_finance_tracker/
├── Backend/
│   ├── config/
│   │   └── db.js                 # Mongoose connection with cloud & local fallback
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── transactionController.js # CRUD, filtering, stats & trends
│   │   ├── budgetController.js   # Category thresholds & live spending
│   │   ├── goalController.js     # Savings milestones & deposits
│   │   └── aiController.js       # AI chat, NLP parser & audit insights
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification middleware
│   ├── models/
│   │   ├── User.js               # User schema with bcrypt hook
│   │   ├── Transaction.js        # Transaction schema
│   │   ├── Budget.js             # Budget schema
│   │   └── Goal.js               # Goal schema
│   ├── routes/                   # Express API routers
│   ├── services/
│   │   └── aiService.js          # Gemini integration & heuristic analyzer
│   ├── .env                      # Environment variables (git-ignored)
│   ├── index.js                  # Express entry point
│   └── package.json
│
└── Frontend/
    ├── public/
    │   └── _redirects            # Netlify SPA redirect
    ├── src/
    │   ├── components/
    │   │   ├── header.jsx        # Responsive navigation & mobile sheet
    │   │   ├── AiChatWidget.jsx  # Floating bottom-right AI assistant
    │   │   ├── ProtectedRoute.jsx# Auth route guard
    │   │   └── ui/               # shadcn component primitives
    │   ├── context/
    │   │   └── AuthContext.jsx   # Auth provider & demo data seeder
    │   ├── pages/
    │   │   ├── LandingPage.jsx   # Marketing hero, features & preview
    │   │   ├── AuthPage.jsx      # Login, Register & Instant Demo
    │   │   ├── DashboardPage.jsx # Analytics, charts & quick-add
    │   │   ├── TransactionsPage.jsx # Table, search, filter & CSV export
    │   │   ├── BudgetsGoalsPage.jsx # Category progress & goal deposits
    │   │   ├── AnalyticsPage.jsx # Health score & 6-month cashflow
    │   │   └── AiAdvisorPage.jsx # Fullscreen AI advisor chat
    │   ├── services/
    │   │   └── api.js            # Unified API fetch client
    │   ├── App.jsx               # Route definitions
    │   ├── main.jsx              # React DOM render root
    │   └── index.css             # Theme variables & Tailwind styles
    ├── vercel.json               # Vercel SPA rewrite rule
    └── package.json
```

---

##  Quick Start (Local Setup)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (MongoDB Atlas connection string OR local MongoDB)

---

### 2. Backend Setup

```bash
# Navigate to the Backend folder
cd Backend

# Install dependencies
npm install

# Configure environment variables
# Create or edit Backend/.env:
PORT=8021
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai_finance_tracker
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here   # Optional (Generative AI)

# Start development server
npm run dev
```

The backend API will start at **`http://localhost:8021`**.

---

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to the Frontend folder
cd Frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open **`http://localhost:5173`** in your browser.


## Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (defaults to `8021`) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection URI |
| `JWT_SECRET` | Yes | Secret string used for signing JWT tokens |
| `GEMINI_API_KEY` | Optional | Google Gemini API Key for conversational AI advisor |

### Frontend (`Frontend/.env` or hosting settings)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Optional | Base URL of the backend (defaults to `http://localhost:8021/api`) |

##  API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and obtain JWT
- `GET /api/auth/me` — Retrieve current authenticated user *(Protected)*
- `PUT /api/auth/profile` — Update user currency, income, and targets *(Protected)*

### Transactions (`/api/transactions`)
- `GET /api/transactions` — Get all transactions (supports `?search=`, `?type=`, `?category=`) *(Protected)*
- `GET /api/transactions/stats` — Summary metrics, category breakdown & monthly trends *(Protected)*
- `POST /api/transactions` — Create a new transaction *(Protected)*
- `PUT /api/transactions/:id` — Update transaction *(Protected)*
- `DELETE /api/transactions/:id` — Delete transaction *(Protected)*

### Budgets (`/api/budgets`)
- `GET /api/budgets` — Get all category budgets with live spent amounts *(Protected)*
- `POST /api/budgets` — Create or update category limit *(Protected)*
- `DELETE /api/budgets/:id` — Delete category budget *(Protected)*

### Savings Goals (`/api/goals`)
- `GET /api/goals` — Get savings goals with progress percentages *(Protected)*
- `POST /api/goals` — Create a savings goal *(Protected)*
- `POST /api/goals/:id/deposit` — Add funds toward a goal *(Protected)*
- `DELETE /api/goals/:id` — Delete a savings goal *(Protected)*

### Artificial Intelligence (`/api/ai`)
- `POST /api/ai/parse-transaction` — Parse natural language string into a structured transaction *(Protected)*
- `POST /api/ai/chat` — Conversational AI Financial Advisor with live context *(Protected)*
- `GET /api/ai/insights` — Algorithmic Financial Health Score & spending audit *(Protected)*


##  Deployment Guide

### Backend (Render / Railway)
1. Push project to GitHub.
2. Create a new **Web Service** on [Render](https://render.com/).
3. Set **Root Directory** to `Backend`.
4. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
5. Add `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` under Environment Variables.
6. Make sure `0.0.0.0/0` is allowed in your MongoDB Atlas Network Access.

### Frontend (Vercel / Netlify)
1. Import repository into [Vercel](https://vercel.com/).
2. Set **Root Directory** to `Frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend-app.onrender.com/api`
5. Click **Deploy**. SPA rewrites (`vercel.json`) are already configured.

