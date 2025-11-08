#!/bin/bash

# Install dependencies for both frontend and backend
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

echo "Installing frontend dependencies..."
npm install

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend with API proxy
echo "Starting frontend server..."
npm run dev -- --host 0.0.0.0 --port 8080

# Cleanup when script exits
trap "kill $BACKEND_PID" EXIT