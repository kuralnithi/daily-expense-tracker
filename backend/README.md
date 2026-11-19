# Daily Expense Tracker — Backend API

A production-ready REST API for the Daily Expense Tracker mobile app, built with **Node.js + Express + TypeScript + PostgreSQL**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or a hosted instance via Railway / Supabase)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL

# 3. Run migrations
npm run db:migrate

# 4. Start development server
npm run dev
```

---

## 📦 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `NODE_ENV` | `development` \| `production` | `development` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*` |

---

## 🔐 Authentication

This API uses a simple header-based identity system suitable for mobile apps.

Add the `X-User-Id` header to every request:

```
X-User-Id: 00000000-0000-0000-0000-000000000001
```

If the header is omitted, the **default user** (`00000000-0000-0000-0000-000000000001`) is used automatically.

---

## 📋 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

---

### 🏥 Health Check

```
GET /health
```

**Response:**
```json
{ "status": "ok", "db": "connected", "timestamp": "2024-11-19T05:00:00.000Z" }
```

---

### 👤 Users

#### Get current user
```
GET /api/v1/users/me
Headers: X-User-Id: <uuid>
```

#### Get user by ID
```
GET /api/v1/users/:id
```

#### Create user
```
POST /api/v1/users
Content-Type: application/json

{
  "name": "John Doe",         // required
  "email": "john@example.com", // optional
  "currency": "INR"           // optional, default: INR
}
```

#### Update current user
```
PUT /api/v1/users/me
Headers: X-User-Id: <uuid>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "currency": "USD"
}
```

---

### 💸 Expenses

#### List expenses
```
GET /api/v1/expenses
Headers: X-User-Id: <uuid>

Query params:
  page        (int, default: 1)
  limit       (int, default: 20, max: 100)
  start_date  (YYYY-MM-DD)
  end_date    (YYYY-MM-DD)
  category_id (UUID)
  type        (expense | income)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "category_id": "uuid",
      "amount": 250.00,
      "description": "Lunch",
      "note": "With team",
      "date": "2024-11-19",
      "type": "expense",
      "category_name": "Food",
      "category_icon": "utensils",
      "category_color": "#f97316",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Create expense
```
POST /api/v1/expenses
Headers: X-User-Id: <uuid>
Content-Type: application/json

{
  "amount": 250.00,          // required, > 0
  "description": "Lunch",   // optional
  "note": "With team",       // optional
  "date": "2024-11-19",      // optional, default: today
  "category_id": "uuid",    // optional
  "type": "expense"          // optional, default: expense
}
```

#### Update expense
```
PUT /api/v1/expenses/:id
Headers: X-User-Id: <uuid>
Content-Type: application/json

{
  "amount": 300.00,
  "description": "Updated description"
}
```

#### Delete expense
```
DELETE /api/v1/expenses/:id
Headers: X-User-Id: <uuid>
```

#### Get expense summary
```
GET /api/v1/expenses/summary
Headers: X-User-Id: <uuid>

Query params:
  period      (today | week | month | year)
  start_date  (YYYY-MM-DD) — override period
  end_date    (YYYY-MM-DD) — override period
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_expense": 15000.00,
    "total_income": 50000.00,
    "net": 35000.00,
    "by_category": [
      {
        "category_id": "uuid",
        "category_name": "Food",
        "category_icon": "utensils",
        "category_color": "#f97316",
        "type": "expense",
        "total": 5000.00,
        "count": 20
      }
    ],
    "daily": [
      {
        "date": "2024-11-01",
        "total_expense": 500.00,
        "total_income": 0,
        "net": -500.00,
        "count": 3
      }
    ]
  }
}
```

#### Get daily summary
```
GET /api/v1/expenses/daily
Headers: X-User-Id: <uuid>

Query params:
  date  (YYYY-MM-DD, default: today)
```

---

### 🏷️ Categories

#### List categories
```
GET /api/v1/categories
Headers: X-User-Id: <uuid>
```

#### Create category
```
POST /api/v1/categories
Headers: X-User-Id: <uuid>
Content-Type: application/json

{
  "name": "Gym",          // required
  "icon": "dumbbell",     // optional, default: circle
  "color": "#10b981",     // optional, hex color
  "type": "expense"       // optional, default: expense
}
```

#### Update category
```
PUT /api/v1/categories/:id
Headers: X-User-Id: <uuid>
Content-Type: application/json

{
  "name": "Fitness",
  "color": "#22c55e"
}
```

#### Delete category
```
DELETE /api/v1/categories/:id
Headers: X-User-Id: <uuid>
```
> Note: Default categories cannot be deleted.

---

### 📊 Summary

#### Monthly summary
```
GET /api/v1/summary/monthly
Headers: X-User-Id: <uuid>

Query params:
  month  (1-12, default: current month)
  year   (default: current year)
```

**Response includes:** totals, by-category breakdown, daily breakdown, budget comparison.

#### Weekly summary
```
GET /api/v1/summary/weekly
Headers: X-User-Id: <uuid>

Query params:
  week_start  (YYYY-MM-DD, default: this Monday)
```

#### Category breakdown
```
GET /api/v1/summary/categories
Headers: X-User-Id: <uuid>

Query params:
  start_date  (YYYY-MM-DD, required)
  end_date    (YYYY-MM-DD, required)
  type        (expense | income, optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "start_date": "2024-11-01",
    "end_date": "2024-11-30",
    "grand_total": 15000.00,
    "breakdown": [
      {
        "category_name": "Food",
        "total": 5000.00,
        "count": 20,
        "percentage": 33.3
      }
    ]
  }
}
```

---

## 🗄️ Database Schema

```
users
  id UUID PK, name, email, currency, created_at, updated_at

categories
  id UUID PK, user_id FK, name, icon, color, type, is_default, created_at

expenses
  id UUID PK, user_id FK, category_id FK, amount, description, note, date, type, created_at, updated_at

budgets
  id UUID PK, user_id FK, category_id FK, amount, period, month, year, created_at
```

---

## 🐳 Docker

```bash
# Build image
docker build -t expense-tracker-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e NODE_ENV=production \
  expense-tracker-backend
```

---

## 🚂 Deploy to Railway

1. Push this directory to a GitHub repo
2. Create a new Railway project → Deploy from GitHub
3. Add a PostgreSQL service
4. Set `DATABASE_URL` environment variable (auto-populated by Railway)
5. Run `npm run db:migrate` once via Railway's shell

The included `railway.json` configures the Dockerfile builder and health check automatically.

---

## 🏗️ Build

```bash
npm run build      # Compile TypeScript → dist/
npm start          # Run compiled production build
npm run db:migrate # Initialize / migrate database
```

---

## 📁 Project Structure

```
src/
├── index.ts                 # App entry point
├── db/
│   ├── connection.ts        # PostgreSQL pool
│   └── migrate.ts           # DB migration script
├── types/
│   └── index.ts             # TypeScript interfaces
├── middleware/
│   ├── errorHandler.ts      # Global error handler
│   └── validate.ts          # Validation + user extraction
├── controllers/
│   ├── expenseController.ts
│   ├── categoryController.ts
│   ├── userController.ts
│   └── summaryController.ts
├── routes/
│   ├── index.ts             # Route aggregator
│   ├── expenses.ts
│   ├── categories.ts
│   ├── users.ts
│   └── summary.ts
└── utils/
    └── helpers.ts           # Date/pagination helpers
```
