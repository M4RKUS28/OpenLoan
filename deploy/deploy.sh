#!/usr/bin/env bash
#
# Production deploy for openloan.m4rkus28.de.
#
# Runs the prod compose stack (Docker nginx on :4568, behind CloudPanel) using
# .env.production for variable interpolation. DB migrations are applied
# automatically by the backend container's entrypoint (alembic upgrade head).
#
# Usage:
#   ./deploy/deploy.sh              # pull (ff-only) + build + up
#   SKIP_PULL=1 ./deploy/deploy.sh  # don't touch git, just rebuild + up
#   ENV_FILE=.env.staging ./deploy/deploy.sh
#
set -euo pipefail

# Repo root = parent of this script's dir, regardless of where it's called from.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="docker-compose.yml"

log() { printf '\033[1;34m▶ %s\033[0m\n' "$*"; }
die() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "docker not found in PATH"
docker compose version >/dev/null 2>&1 || die "docker compose (v2) not available"

[ -f "$ENV_FILE" ] || die "$ENV_FILE missing — copy it and fill in the secrets."

if grep -q "__CHANGE_ME__" "$ENV_FILE"; then
  die "$ENV_FILE still contains __CHANGE_ME__ placeholders — fill them in first."
fi

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

# ── Pull latest code (fast-forward only; skip with SKIP_PULL=1) ────────────────
if [ "${SKIP_PULL:-0}" != "1" ] && [ -d .git ]; then
  log "Pulling latest code (ff-only)…"
  git pull --ff-only || die "git pull failed (diverged/dirty tree?) — resolve manually or run with SKIP_PULL=1"
else
  log "Skipping git pull."
fi

# ── Build + start ─────────────────────────────────────────────────────────────
log "Building images…"
compose build

log "Starting stack…"
compose up -d --remove-orphans

# ── Cleanup + status ──────────────────────────────────────────────────────────
log "Pruning dangling images…"
docker image prune -f >/dev/null

log "Current status:"
compose ps

cat <<EOF

✓ Deployed.
  App:      https://openloan.m4rkus28.de
  Keycloak: https://auth.openloan.m4rkus28.de
  (Docker nginx listens on 127.0.0.1:4568 — CloudPanel proxies to it.)

Logs:  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs -f
EOF
