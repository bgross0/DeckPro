#!/bin/bash
cd /mnt/c/users/owner/code/local/betas/deckpro/deckpro-react

echo "Starting DeckPro development server..."
echo "=================================="
echo ""
echo "If you're using WSL, try these URLs:"
echo "  http://localhost:5173"
echo "  http://127.0.0.1:5173"
echo ""
echo "For Windows browser access from WSL2:"
echo "  1. Open Windows PowerShell as Administrator"
echo "  2. Run: netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=localhost"
echo "  3. Open http://localhost:5173 in your Windows browser"
echo ""
echo "Starting server..."
echo ""

npm run dev -- --host 0.0.0.0