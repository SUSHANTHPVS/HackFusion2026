#!/bin/bash
# Restart server script

echo "════════════════════════════════════════════════════════════════"
echo "🔄 RESTARTING SERVER WITH FIX"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🛑 Stopping current server instances..."
# Kill any node processes running on port 5000
npx lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "   No running instances found"

echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2

echo ""
echo "🚀 Starting server with fixed code..."
echo ""

cd server
npm start

# Alternative for development:
# npm run dev
