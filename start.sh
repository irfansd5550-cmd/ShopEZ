#!/bin/bash
# ShopEZ Quick Start Script

echo "🛍️ ShopEZ v2.0 — Starting Platform..."
echo ""

# Check MySQL
if ! command -v mysql &>/dev/null; then
  echo "⚠️  MySQL not found. Install MySQL 8.0+ first."
fi

# Backend
echo "▶ Starting Backend (Flask)..."
cd backend
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created .env from .env.example — edit it before running!"
fi
pip install -r requirements.txt -q
python run.py &
BACKEND_PID=$!

# Frontend
echo "▶ Starting Frontend (React)..."
cd ../frontend
npm install -q
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ ShopEZ is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   Admin:    admin@shopez.com / Admin@123"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Stopped.'" INT
wait
