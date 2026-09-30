# Core Self

**Genesis 1.4 — Second-Self Runtime**

Core Self is Dylan Core: a private personal-intelligence operating system designed to learn Dylan, preserve continuity, connect his life and projects, reason over current context, prepare and execute safe internal work, and grow toward a trustworthy digital second self.

## Genesis 1.4

- **Identity Core** — confirmed roles, values, preferences, boundaries, development stages and private Seed Vault support.
- **Memory Brain** — weighted contextual retrieval, memory integrity scoring, duplicate/conflict review and compression.
- **Second-Self Runtime** — one live loop connecting perception, memory, reasoning, planning, controlled action and reflection.
- **Execution Learning** — completed actions become evidence for future reasoning without overriding Dylan's authority.
- **Digital Twin / Life Graph** — connects family, career, money, health, projects, businesses, creative work and outcomes.
- **Operator Runtime** — safe internal tools execute their real deterministic engines; external writes remain permission-gated.
- **Cloud Brain** — Firebase Auth/Firestore persistence for identity, memories, plans, actions, tools, outcomes and audit state.
- **Offline Dylan Core** — cached PWA shell plus rule-based identity, family, career, finance, business, project and creative reasoning.
- **AI Routing** — capability-aware model routing with Identity Core, Digital Twin, runtime state and retrieved memory in context.
- **Genesis 1.4 Interface** — redesigned neural command deck with live capability telemetry, runtime loop, evolution targets and responsive futuristic UI.

## Architecture

- Frontend: React + Vite in `apps/web`
- AI backend: Vercel server routes including `/api/chat`
- Cloud: Firebase Auth + Firestore
- Security: user-scoped Firestore rules, approval gates, permission matrix and audit logs
- Offline: service worker + local persistent Core state
- Private personal data: imported into the signed-in Core; never required in the public repository

## Local development

```bash
cd apps/web
npm install
npm run build
npm run check
npm run dev
```

## Core rule

Core Self must never pretend a tool, deployment or external action happened. Dylan remains the final authority over identity changes, external communications, financial actions, destructive changes and production writes.
