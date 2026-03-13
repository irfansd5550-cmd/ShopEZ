# 🛍️ ShopEZ v2.0 — No-Code E-commerce Platform

> Build stunning online stores in minutes without writing a single line of code.

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-green?logo=flask)](https://flask.palletsprojects.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)](https://mysql.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-teal?logo=tailwindcss)](https://tailwindcss.com)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 Drag & Drop Builder | GrapesJS-powered visual editor |
| 📦 Product Management | Unlimited products with multiple images |
| 🛒 Shopping Cart | Persistent cart with localStorage |
| 💬 WhatsApp Integration | Direct order links via WhatsApp |
| 📊 Analytics Dashboard | Revenue, orders, best-sellers with Chart.js |
| 🤖 AI Assistant | Claude-powered chatbot (English + Hinglish) |
| 🐙 GitHub Publish | Push store code directly to GitHub |
| 🚀 One-Click Deploy | Deploy to Render instantly |
| 📧 HTML Email Templates | Beautiful order/welcome/reset emails |
| 🌙 Dark Mode | System-aware dark mode |
| 📱 Mobile Responsive | Full mobile optimization |
| 🔒 JWT Auth | Secure authentication with bcrypt |

---

## 🏗️ Architecture

```
shopez/
├── frontend/          # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/         # Route-level pages
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # Auth + Theme contexts
│   │   ├── services/      # Axios API service
│   │   └── utils/         # Helper utilities
│
├── backend/           # Python Flask REST API
│   ├── routes/            # All API endpoints
│   ├── services/          # Email, etc.
│   └── utils/             # DB helpers, validators
│
└── database/          # MySQL schema + seed
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MySQL 8.0+

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python run.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shopez

# Auth
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Email (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=ShopEZ <noreply@shopez.com>

# AI (optional — falls back to rule-based)
ANTHROPIC_API_KEY=sk-ant-...

# App
FRONTEND_URL=http://localhost:5173
```

---

## 🔑 Default Admin Account
```
Email:    admin@shopez.com
Password: Admin@123
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/shops` | List/create stores |
| GET | `/api/shops/public/:slug` | Public store data |
| GET/POST | `/api/products/shop/:id` | Products |
| POST | `/api/orders` | Place order |
| GET | `/api/analytics/shop/:id` | Analytics |
| POST | `/api/builder/download/:id` | Download store ZIP |
| POST | `/api/builder/github/:id` | Push to GitHub |
| POST | `/api/upload/image` | Upload image |
| POST | `/api/ai/chat` | AI assistant |

---

## 🎨 Templates
- 👗 Fashion
- 💻 Electronics  
- 🛋️ Furniture
- 💎 Luxury
- ⬜ Minimal
- 🎨 Creative
- 🚀 Modern

---

## 📦 Store Export

Downloaded ZIP includes:
- `index.html` — Full store with cart & checkout
- `style.css` — Premium animations + responsive
- `app.js` — Cart, search, filters, WhatsApp
- `{slug}-database.sql` — Complete database dump

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, TailwindCSS, Framer Motion, GrapesJS, Chart.js, Lucide Icons

**Backend:** Python Flask, PyMySQL, JWT, bcrypt, Anthropic Claude, requests

**Database:** MySQL 8.0

---

## 📄 License
MIT © 2024 ShopEZ
