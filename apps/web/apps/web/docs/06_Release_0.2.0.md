# Genesis 0.2.0 — Production AI Backend

## Frontend
- Keeps the improved mobile Talk layout from 0.1.3b.
- Shows clearer AI status for real AI vs fallback mode.
- Stops treating local Codespaces API fallback as a crash.

## Backend
- Adds a Vite dev API middleware so `/api/chat` and `/api/ai-status` no longer 404 in Codespaces.
- Keeps Vercel serverless functions in `apps/web/api` for deployed production AI.
- Adds Vercel config for Vite + serverless API routes.
- Uses `OPENAI_API_KEY` only on the server side.

## Notes
- Real AI on Vercel requires `OPENAI_API_KEY` in Vercel Environment Variables and a fresh redeploy.
- Local Codespaces real AI requires `OPENAI_API_KEY` in the Codespaces environment; otherwise it safely uses local fallback.
