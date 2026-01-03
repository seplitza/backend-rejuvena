#!/bin/bash

echo "🚀 Starting Rejuvena Backend & Admin Panel"
echo ""

# Check if MongoDB is running
echo "📊 Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null
then
    echo "⚠️  MongoDB is not running!"
    echo "   Please start MongoDB first:"
    echo "   - macOS: brew services start mongodb-community"
    echo "   - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    exit 1
fi
echo "✅ MongoDB is running"
echo ""

# Check if database is seeded
echo "🌱 Initializing database..."
npm run seed
echo ""

# Start backend
echo "🖥️  Starting Backend API..."
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start admin panel
echo "🎨 Starting Admin Panel..."
cd admin-panel
npm run dev &
FRONTEND_PID=$!
echo "   Admin Panel PID: $FRONTEND_PID"
echo ""

echo "✅ All services started!"
echo ""
echo "📍 Access points:"
echo "   Backend API: http://localhost:5000"
echo "   Admin Panel: http://localhost:5173"
echo ""
echo "🔐 Login credentials:"
echo "   Email: seplitza@gmail.com"
echo "   Password: 1234back"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
