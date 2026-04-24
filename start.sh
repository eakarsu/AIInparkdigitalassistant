#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}   ${CYAN}🏰 Adventure Kingdom Park Assistant${NC}        ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}   ${YELLOW}Starting all services...${NC}                    ${PURPLE}║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Source .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
DB_NAME="${DB_NAME:-parkassistant}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# ── Step 1: Aggressively free up ports ──
echo -e "${YELLOW}[1/6] Cleaning up ports ${FRONTEND_PORT} and ${BACKEND_PORT}...${NC}"

free_port() {
  local PORT=$1
  local RETRIES=5
  for i in $(seq 1 $RETRIES); do
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -z "$PIDS" ]; then
      return 0
    fi
    echo -e "  ${RED}Killing PIDs on port $PORT: $PIDS (attempt $i)${NC}"
    # Kill the processes AND their parent process trees
    for PID in $PIDS; do
      # Find and kill parent npm/node processes that may respawn children
      PARENT_PID=$(ps -o ppid= -p $PID 2>/dev/null | tr -d ' ')
      if [ -n "$PARENT_PID" ] && [ "$PARENT_PID" != "1" ]; then
        kill -9 $PARENT_PID 2>/dev/null || true
      fi
      kill -9 $PID 2>/dev/null || true
    done
    sleep 2
  done
  # Final check
  if lsof -ti :$PORT &>/dev/null; then
    echo -e "  ${RED}ERROR: Cannot free port $PORT${NC}"
    return 1
  fi
}

for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  free_port $PORT
  echo -e "  ${GREEN}Port $PORT is free${NC}"
done

# ── Step 2: Check PostgreSQL ──
echo ""
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"
if command -v pg_isready &>/dev/null; then
  if pg_isready -q 2>/dev/null; then
    echo -e "  ${GREEN}PostgreSQL is running${NC}"
  else
    echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &>/dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 3
    if pg_isready -q 2>/dev/null; then
      echo -e "  ${GREEN}PostgreSQL started${NC}"
    else
      echo -e "  ${RED}Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
  fi
else
  echo -e "  ${YELLOW}pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ── Step 3: Create database if not exists ──
echo ""
echo -e "${YELLOW}[3/6] Setting up database...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  ${GREEN}Database '$DB_NAME' exists${NC}"
else
  echo -e "  ${CYAN}Creating database '$DB_NAME'...${NC}"
  createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || \
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo -e "  ${GREEN}Database created${NC}"
fi

# ── Step 4: Install dependencies ──
echo ""
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${CYAN}Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -1

echo -e "  ${CYAN}Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent 2>&1 | tail -1

cd "$PROJECT_DIR"

# ── Step 5: Seed database ──
echo ""
echo -e "${YELLOW}[5/6] Seeding database with park data...${NC}"
cd "$PROJECT_DIR/backend"
node src/seeds/seed.js
cd "$PROJECT_DIR"

# Ensure DB pool from seed is fully released
sleep 2

# ── Step 6: Start services with hot reload ──
echo ""
echo -e "${YELLOW}[6/6] Starting services with hot reload...${NC}"
echo ""

# Final port check before starting
for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  if lsof -ti :$PORT &>/dev/null; then
    echo -e "  ${RED}Port $PORT occupied before launch! Killing...${NC}"
    lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
  fi
done

# Start backend with nodemon (hot reload)
echo -e "${BLUE}Starting backend on port ${BACKEND_PORT}...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon src/server.js &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# Wait for backend to fully start - check OUR specific health response
echo -e "  ${CYAN}Waiting for backend to start...${NC}"
BACKEND_UP=false
for i in $(seq 1 20); do
  HEALTH=$(curl -s http://localhost:${BACKEND_PORT}/api/health 2>/dev/null || true)
  if echo "$HEALTH" | grep -q "Adventure Kingdom"; then
    echo -e "  ${GREEN}Backend is running on port ${BACKEND_PORT}${NC}"
    BACKEND_UP=true
    break
  fi
  sleep 1
done

if [ "$BACKEND_UP" = false ]; then
  echo -e "  ${RED}Backend failed to start! Check logs above.${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  exit 1
fi

# Start frontend with React's built-in hot reload
# CI=true prevents interactive prompts (e.g., "port in use, use another?")
echo -e "${BLUE}Starting frontend on port ${FRONTEND_PORT}...${NC}"
cd "$PROJECT_DIR/frontend"
CI=true BROWSER=none PORT=${FRONTEND_PORT} npm start &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

# Wait for frontend to start
echo -e "  ${CYAN}Waiting for frontend to compile...${NC}"
FRONTEND_UP=false
for i in $(seq 1 60); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${FRONTEND_PORT} 2>/dev/null || true)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}Frontend is running on port ${FRONTEND_PORT}${NC}"
    FRONTEND_UP=true
    break
  fi
  sleep 1
done

if [ "$FRONTEND_UP" = false ]; then
  echo -e "  ${YELLOW}Frontend may still be compiling. Check http://localhost:${FRONTEND_PORT} in your browser.${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}🏰 Adventure Kingdom is ready!${NC}              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}Frontend:${NC}  http://localhost:${FRONTEND_PORT}          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}Backend:${NC}   http://localhost:${BACKEND_PORT}          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${PURPLE}Login:${NC}     admin@adventurekingdom.com       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${PURPLE}Password:${NC}  password123                      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${RED}Press Ctrl+C to stop all services${NC}           ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Handle shutdown
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  sleep 1
  # Kill all child processes
  pkill -P $$ 2>/dev/null || true
  # Force free ports
  for PORT in $FRONTEND_PORT $BACKEND_PORT; do
    lsof -ti :$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  done
  echo -e "${GREEN}All services stopped. Goodbye! 🏰${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait
