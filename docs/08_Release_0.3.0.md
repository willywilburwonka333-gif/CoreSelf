# Genesis 0.3.0 — Real AI Conversations + Long-Term Memory

## Frontend
- Talk screen now treats chat as a persistent Core conversation, not just local messages.
- Mobile chat auto-scrolls after new messages.
- Chat status now reports Cloud conversation memory.

## Backend / Cloud Brain
- Conversations are stored under `users/{uid}/conversations/{conversationId}`.
- Messages are stored under `users/{uid}/conversations/{conversationId}/messages`.
- The OpenAI route remains server-side through Vercel `/api/chat`.
- The browser never receives `OPENAI_API_KEY`.

## AI
- The AI receives relevant memories, projects, goals, plans, and recent conversation context.
- Local fallback remains active if the backend or OpenAI fails.

## Security
- Data remains user-scoped under `users/{uid}`.
- Existing Firestore rules support this layout.
