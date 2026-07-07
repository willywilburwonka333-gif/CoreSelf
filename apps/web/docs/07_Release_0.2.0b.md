# Genesis 0.2.0b — Vercel Runtime Fix

This patch fixes the failed Vercel deployment from Genesis 0.2.0.

## Fixed
- Removed unsupported Vercel function runtime config.
- Kept API routes in `apps/web/api` for Vercel Root Directory `apps/web`.
- Removed nested duplicate project folder from the ZIP.
- Preserved Firebase/Auth/Firestore, AI diagnostics, mobile Talk UX, and production AI backend.

## Vercel Settings
Use these project settings:
- Root Directory: `apps/web`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Environment variable required:
- `OPENAI_API_KEY` for Production and Preview.
