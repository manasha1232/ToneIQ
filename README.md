# ToneIQ 🎤

> *Practice hard conversations before they happen in real life.*

AI-powered voice roleplay app. Speak your response, get instant tone feedback,
and improve communication under pressure.

---

## Quick Start (Local)

```bash
# 1. Backend
cd backend
cp .env.example .env       # edit if you have API keys (optional)
npm install
npm run dev                # → http://localhost:3001

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                # → http://localhost:5173
```

**All paid API keys are optional.** The app runs fully with mocks when keys are absent.

---

## Architecture

```
User (browser)
  │  voice (WebM)
  ▼
Frontend (React + Vite)  ──────►  Backend (Node + Express)
                                      │
                          ┌───────────┼────────────────┐
                          ▼           ▼                ▼
                       Whisper      Rule engine      Hume AI
                       (STT)        (always on)      (tone)
                          │           │                │
                          └─────── Score engine ───────┘
                                      │
                          ┌───────────┴────────────┐
                          ▼                        ▼
                      Claude Sonnet           ElevenLabs
                    (AI reply + rewrite)       (TTS)
                          │
                          ▼
                      Supabase / SQLite
                    (scores + transcripts)
```

Audio is **never stored long-term**. Buffer purged ≤ 60 seconds after transcription.

---

## Smoke Test Checklist

After starting both servers:

- [ ] `curl http://localhost:3001/health` → `{"status":"ok"}`
- [ ] Open `http://localhost:5173` → Home page with 6 scenario cards
- [ ] Click "Start practice" on any card → Session screen loads
- [ ] Click 🎤 → record a few seconds → "Stop & Send"
- [ ] AI reply appears in chat + feedback card shown
- [ ] "Next turn →" advances; after 6 turns → report page

---

## Running Tests

```bash
# Unit tests (rule engine + API)
cd backend && npm test

# E2E tests (Playwright)
cd frontend && npm install @playwright/test && npx playwright install chromium
npx playwright test
```

---

## Cloud Deployment

See `deploy.sh` for exact commands. Summary:

| Service   | Purpose     | Free tier           |
|-----------|-------------|---------------------|
| Supabase  | Database    | 500MB, 50k rows     |
| Railway   | Backend     | 500 hrs/mo          |
| Vercel    | Frontend    | Unlimited static    |

Full flow: `bash deploy.sh`

---

## Cost Estimate (1,000 MAU / month)

| Service       | Cost    |
|---------------|---------|
| Whisper STT   | ~$15    |
| Claude Sonnet | ~$25    |
| ElevenLabs    | ~$22    |
| Hume AI       | ~$30    |
| Supabase Pro  | $25     |
| Railway       | ~$10    |
| Vercel Hobby  | $0      |
| **Total**     | **~$127/mo** |

---

## Privacy

- Audio deleted ≤ 60 seconds after transcription
- Transcripts stored encrypted, 90-day retention
- Right-to-erasure: `DELETE /api/user/:id/data`
- See `privacy-statement.md` for full policy

---

## Repo Structure

```
toneiq/
├── backend/
│   ├── src/
│   │   ├── adapters/   (stt, ai, hume, tts — each with mock fallback)
│   │   ├── services/   (session, ruleEngine, rules.json)
│   │   ├── routes/     (session, user)
│   │   ├── jobs/       (audioTtl)
│   │   └── db/         (SQLite fallback)
│   └── tests/          (Jest unit + integration)
├── frontend/
│   ├── src/
│   │   ├── pages/      (Home, Session, Report)
│   │   └── components/ (VoiceRecorder, FeedbackCard, ChatBubble, ScenarioPicker)
│   └── e2e/            (Playwright)
├── infra/supabase/     (schema.sql)
├── demo/               (scenario JSONs, record-demo.sh)
├── .github/workflows/  (backend.yml, frontend.yml)
├── deploy.sh
├── privacy-statement.md
└── privacy-delete-endpoint.md
```

---

## Performance Targets

| Metric              | Target    |
|---------------------|-----------|
| API p95 latency     | < 2.5s    |
| Session completion  | ≥ 70%     |
| Feedback view rate  | ≥ 85%     |
| D7 retention        | ≥ 40%     |
| Score delta (30d)   | +12 pts   |

---

## Prompt Safety

All AI interactions include a system guardrail:
> *"Do not provide medical, legal, financial, or therapeutic advice. If the user's message indicates personal distress, respond with a referral to appropriate support."*

---

*Built with React, Node.js, Claude (Anthropic), Whisper (OpenAI), Hume AI, ElevenLabs, Supabase.*
