# AGENTS.md - posai-web (Frontend)

Project spec: `docs/master-prompt.md`. This repo is the FRONTEND only. The backend lives in `posai-api`.

## Working Rules
- Build ONE sprint at a time, ONE small task at a time. Stop after each task and wait for my review.
- For a new sprint, plan first (screens, components, data flow). Write no code until I approve.
- If a requirement is unclear or a decision is risky, ask before assuming.
- Never commit secrets. Only `.env.example` is committed.

## Stack
Next.js (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod.

## API and Types
- Never hand-write types for backend responses. Generate them from the backend OpenAPI spec (`openapi-typescript`) and use the typed API client wrapper.
- If an API is missing or wrong, tell me so the backend can be fixed. Do not work around it with mocks that hide the problem.
- All server calls go through TanStack Query hooks, not scattered `fetch` calls in components.

## Money
- The API sends money as integer paise. Convert to rupees only at display time, using one shared formatting helper. Never do money math with floats in components.

## UI Rules
- Reuse shadcn/ui components. Build small reusable components, avoid duplication.
- Forms: React Hook Form + Zod, with clear validation messages.
- Handle loading, empty, and error states on every screen.
- POS screens (orders, KOT, billing) are used on tablets and in a rush: large tap targets, minimal clicks, high contrast.
- Responsive: tablet-first for staff screens, desktop for owner dashboard.
- Role-aware UI: hide what a role cannot use, but never rely on the UI for security (the backend enforces it).

## Auth
- Store tokens safely (httpOnly cookies preferred). Handle refresh and logout in one place. Redirect unauthenticated users.

## Code Quality
- TypeScript strict. No `any` without a comment explaining why.
- Keep components small. Move logic into hooks and utilities.
- Conventional commits, small commits, one branch per feature (`feat/sprintN-name`, same name as the backend branch).

## Definition of Done
Screen works against the real API, loading/empty/error states handled, lint and build pass, types regenerated from the latest OpenAPI, no secrets in diff.

## Lessons Learned (add agent mistakes here)
- (empty)
