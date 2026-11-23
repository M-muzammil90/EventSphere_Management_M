#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  EventSphere — one-command local development launcher
#  Starts MongoDB (if needed), the API, the seeder and Vite.
# ─────────────────────────────────────────────────────────────
set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'
say() { echo -e "${CYAN}▸${NC} $1"; }

say "Checking Node.js…"
node -v >/dev/null 2>&1 || { echo "✖ Node.js 18+ is required"; exit 1; }
echo "  $(node -v)"

say "Checking MongoDB…"
if command -v mongod >/dev/null 2>&1; then
  if mongosh --quiet --eval "db.runCommand({ping:1})" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} MongoDB is already running"
  else
    say "Starting mongod…"
    mkdir -p /tmp/mongodb-data && mongod --dbpath /tmp/mongodb-data --fork --logpath /tmp/mongodb.log >/dev/null 2>&1 \
      || { echo "  ⚠ Could not auto-start mongod — start it manually and re-run"; }
  fi
else
  echo "  ⚠ mongod not found. On Windows run: net start MongoDB"
fi

say "Installing server dependencies…"
(cd server && npm install --silent)

say "Creating server/.env if missing…"
[ -f server/.env ] || cp server/.env.example server/.env

say "Seeding the database (creates the Admin account)…"
(cd server && npm run seed)

say "Starting the API on http://localhost:5000 …"
(cd server && npm run dev) &
API_PID=$!

say "Installing frontend dependencies…"
npm install --silent

say "Starting the frontend on http://localhost:5173 …"
npm run dev &
WEB_PID=$!

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  EventSphere is running${NC}"
echo ""
echo "  Frontend : http://localhost:5173"
echo "  API      : http://localhost:5000/api/v1"
echo "  Health   : http://localhost:5000/api/health"
echo ""
echo -e "  ${BOLD}Admin login${NC}"
echo "   email    : admin@eventsphere.io"
echo "   password : ChangeMe!2026"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"

trap "kill $API_PID $WEB_PID 2>/dev/null" EXIT
wait
