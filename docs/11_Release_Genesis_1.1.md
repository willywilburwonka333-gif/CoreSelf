# Core Self Genesis 1.1 — Capability Router

This release turns the provider list into a working server-side routing policy.

## What changed

- Routine requests can use an optional Gemini worker when both `GEMINI_API_KEY` and `GEMINI_MODEL` exist.
- Coding, deep reasoning and live-web requests remain on the configured OpenAI path.
- When both providers are available, routine Gemini failures fall back to OpenAI.
- `/api/ai-status` reports safe routing readiness without exposing keys or model identifiers.
- Realtime voice and agentic video understanding are recorded as gated capability paths, not falsely marked as working.

## Safety rules

- Provider keys remain server-side.
- No model can bypass the existing command policy or approval gates.
- Realtime voice must use short-lived session credentials before browser access is enabled.
- External writes remain disabled until a server route, audit log and explicit approval exist.

## Optional Vercel setup

1. Add `GEMINI_API_KEY` as a Sensitive environment variable.
2. Add `GEMINI_MODEL` using the exact model ID available to the account.
3. Redeploy.
4. Check `/api/ai-status` for `routing.mode: multi-provider`.
5. Compare routine task quality, latency and cost before keeping the route enabled.

OpenAI remains required for the current web-search, coding and deep-reasoning profiles.
