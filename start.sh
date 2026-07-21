#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
require_setting(){ local name="$1"; if [ -z "${!name:-}" ] && ! grep -Eq "^${name}=.+" "$project_dir/.env" 2>/dev/null; then echo "Missing required setting: $name" >&2; exit 1; fi; }
[ -f "$project_dir/.env" ] || { echo 'Create .env from .env.example first.' >&2; exit 1; }
[ -d "$project_dir/backend/node_modules" ] && [ -d "$project_dir/frontend/node_modules" ] || { echo 'Dependencies are absent; install them explicitly with npm ci in backend/ and frontend/.' >&2; exit 1; }
for name in JWT_SECRET DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD; do require_setting "$name"; done
cleanup(){ kill "${backend_pid:-}" "${frontend_pid:-}" 2>/dev/null || true; wait "${backend_pid:-}" "${frontend_pid:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd "$project_dir/backend" && npm start) & backend_pid=$!
(cd "$project_dir/frontend" && npm start) & frontend_pid=$!
echo 'Services started without installing dependencies, changing ports, or mutating the database.'
wait "$backend_pid" "$frontend_pid"
