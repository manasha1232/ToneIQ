#!/usr/bin/env bash
# =============================================================================
# ToneIQ — One-shot deploy helper
# Usage: bash deploy.sh
# =============================================================================
set -euo pipefail

BOLD="\033[1m"; RESET="\033[0m"; GREEN="\033[32m"; YELLOW="\033[33m"

step() { echo -e "\n${BOLD}${GREEN}▶ $1${RESET}"; }
note() { echo -e "${YELLOW}  ℹ $1${RESET}"; }

step "ToneIQ Deployment Script"
echo "This script prints exact commands. Run them in order."

step "1. Supabase — Create project + run migrations"
note "Go to https://supabase.com → New project → copy DATABASE_URL"
cat <<CMDS

  # Install Supabase CLI
  brew install supabase/tap/supabase  # macOS
  # or: npm i -g supabase

  cd infra/supabase
  supabase login
  supabase link --project-ref YOUR_PROJECT_REF
  supabase db push  # applies schema.sql

CMDS

step "2. Backend — Deploy to Railway"
note "Go to https://railway.app → New project → GitHub repo → backend dir"
cat <<CMDS

  npm i -g @railway/cli
  cd backend
  railway login
  railway up

  # Set environment variables in Railway dashboard or:
  railway variables set OPENAI_API_KEY=sk-...
  railway variables set ANTHROPIC_API_KEY=sk-ant-...
  railway variables set HUME_API_KEY=...
  railway variables set ELEVENLABS_API_KEY=...
  railway variables set DATABASE_URL=postgresql://...
  railway variables set JWT_SECRET=\$(openssl rand -hex 32)
  railway variables set CORS_ORIGIN=https://your-vercel-app.vercel.app
  railway variables set NODE_ENV=production

CMDS

step "3. Frontend — Deploy to Vercel"
note "Set VITE_API_URL to your Railway backend URL first"
cat <<CMDS

  npm i -g vercel
  cd frontend

  # Create .env.production.local
  echo "VITE_API_URL=https://your-backend.up.railway.app" > .env.production.local

  vercel --prod
  # Follow prompts → project name: toneiq → framework: Vite

CMDS

step "4. Smoke tests (post-deploy)"
cat <<CMDS

  # Health check
  curl https://your-backend.up.railway.app/health

  # Start session
  curl -X POST https://your-backend.up.railway.app/api/session/start \\
    -H 'Content-Type: application/json' \\
    -d '{"scenarioId":"missed-deadline","scenarioText":"You missed a deadline."}'

  # Open frontend
  open https://your-vercel-app.vercel.app

CMDS

step "5. Cost estimate (1,000 MAU / month)"
cat <<TABLE
  Whisper STT    ~\$15
  Claude Sonnet  ~\$25
  ElevenLabs     ~\$22
  Hume AI        ~\$30
  Supabase Pro   \$25
  Railway        \$10
  Vercel Hobby   \$0
  ─────────────────────
  Total          ~\$127/mo
TABLE

echo -e "\n${GREEN}✅ Deploy guide complete. All paid APIs have free tiers for initial testing.${RESET}"
