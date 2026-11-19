# 💰 Daily Expense Tracker

A modern, clean, and simple daily expense tracking app built with React Native (Expo) + Node.js + PostgreSQL.

## 📱 Features

- ✅ Track daily income & expenses
- ✅ Category-based organization with icons
- ✅ Monthly/weekly analytics with charts
- ✅ Budget tracking and progress
- ✅ Modern Material Design 3 UI
- ✅ Indian Rupee (₹) support

## 🏗️ Architecture

```
daily-expense-tracker/
├── mobile/      # React Native + Expo app
└── backend/     # Node.js + Express + PostgreSQL API
```

## 🚀 Quick Start

### Backend (Local)
```bash
cd backend
npm install
cp .env.example .env
# Set your DATABASE_URL in .env
npm run db:migrate
npm run dev
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go app
```

## 🌐 Deployment

- **Backend**: Railway (auto-deployed via `railway.json`)
- **Database**: PostgreSQL on Railway

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/expenses` | List expenses (filterable) |
| POST | `/api/v1/expenses` | Create expense |
| PUT | `/api/v1/expenses/:id` | Update expense |
| DELETE | `/api/v1/expenses/:id` | Delete expense |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| GET | `/api/v1/summary/monthly` | Monthly summary |
| GET | `/api/v1/summary/weekly` | Weekly summary |
| GET | `/api/v1/summary/breakdown` | Category breakdown |

## 🛠️ Tech Stack

**Mobile**: React Native · Expo 52 · TypeScript · React Native Paper · Zustand · Axios · Victory Native Charts

**Backend**: Node.js · Express · TypeScript · PostgreSQL · UUID

## 👤 Author
kuralnithi
