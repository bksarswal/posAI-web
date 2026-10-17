# AGENTS.md - posai-web (Frontend)

Project spec: `docs/master-prompt.md`. This repo is the FRONTEND only. The backend lives in `posai-api`.

## Working Rules

- Build ONE sprint at a time, ONE small task at a time. Stop after each task and wait for my review.
- For a new sprint, plan first (screens, modules, data flow). Write no code until I approve.
- If a requirement is unclear or a decision is risky, ask before assuming.
- Never commit secrets. Only `.env.example` is committed.

---

## General Rules

- Use TypeScript only (strict). No `any` without a comment explaining why.
- Use ES Modules. Use pnpm as the package manager.
- Keep code simple, readable, and production-ready.
- Avoid unnecessary abstractions, extra folders, and over-engineering.
- Prefer consistency over cleverness.
- Keep the frontend structure as close as possible to the backend (`posai-api`). Same module names, same file naming.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Ant Design (forms only), Axios, TanStack Query, Zod.

## Dependencies

- Ask before adding any new dependency.
- Pre-approved for project setup only: eslint, prettier, husky, lint-staged, axios, antd, @ant-design/nextjs-registry, @tanstack/react-query, zod, openapi-typescript, clsx, tailwind-merge, lucide-react, and what shadcn/ui needs.

---

## Architecture: Module-Based

One feature = one module. Module names match the backend modules.

```
src/
├── app/                      # Routing only. Thin pages that compose modules.
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
│
├── modules/
│   └── auth/
│       ├── components/       # LoginForm.tsx, SignupForm.tsx, ForgotPassword.tsx
│       ├── auth.api.ts       # Axios calls
│       ├── auth.schema.ts    # Zod schemas
│       ├── auth.types.ts
│       ├── auth.constants.ts
│       ├── auth.utils.ts
│       └── index.ts          # Public exports
│
├── shared/
│   ├── ui/                   # shadcn/ui components
│   ├── components/           # Reusable app-wide components
│   ├── lib/
│   │   ├── axios.ts          # The only Axios instance
│   │   └── utils.ts
│   ├── types/                # Generated API types (do not edit by hand)
│   └── constants/
│
└── middleware.ts             # Use the file name the installed Next.js version requires (middleware.ts or proxy.ts)
```

Module rules:
- Pages in `app/` stay thin: layout plus module components. No business logic or API calls in pages.
- Outside a module, import only from that module's `index.ts`, never from its internal files.
- A module never imports another module's internals. If two modules need the same thing, move it to `shared/`.
- `shared/` never imports from `modules/`.
- Create a module, folder, or file only when it has real content. Do not pre-create empty modules. A module is added when its sprint starts.
- Not every module needs every file. Skip `constants` or `utils` if empty.
- Naming mirrors the backend: `<feature>.api.ts`, `<feature>.schema.ts`, `<feature>.types.ts`, `<feature>.constants.ts`, `<feature>.utils.ts`.
- TanStack Query hooks go in a single flat file `<feature>.hooks.ts` inside the module, only when the module needs them. Do not create a `hooks/` folder.

## Server and Client Components

- Default to Server Components. Add `"use client"` only where needed (forms, interactivity, sockets).
- Keep client components small and at the leaves of the tree.

---

## API Layer (Axios)

- One Axios instance in `shared/lib/axios.ts`: base URL from env, `withCredentials`, response interceptor for token refresh and one consistent error shape.
- Each module calls the backend only through its `<feature>.api.ts`. Components never call Axios directly.
- Types for backend responses are generated from the backend OpenAPI spec (`openapi-typescript`) into `shared/types`. Never hand-write them.
- If an API is missing or wrong, tell me so the backend can be fixed. Do not hide the problem with mocks.

## Data Fetching

- TanStack Query for server state. Do not copy server data into local state or global stores.
- Query keys for a module are defined in one place in that module.

## Forms (Ant Design)

- Use Ant Design only for forms: `Form`, `Input`, `Select`, `DatePicker`, `Switch`, and similar form controls. Everything else (layout, buttons, cards, tables, dialogs) uses shadcn/ui and Tailwind.
- Zod is the single source of validation. Schemas live in `<feature>.schema.ts`. Use one small shared helper in `shared/lib` that turns a Zod schema into an Ant Design form rule, so rules are not written twice. Types come from `z.infer`.
- Show server errors on the form.
- Ant Design must be set up for the Next.js App Router with `@ant-design/nextjs-registry`, and its styles must not break Tailwind or shadcn styles.

## Money

- The API sends money as integer paise. Convert to rupees only at display time with one helper in `shared/lib`. Never do money math with floats in components.

## Auth

- Tokens in httpOnly cookies where possible. Refresh and logout handled in the Axios interceptor and one auth utility. Redirect unauthenticated users in the middleware file.
- Role-aware UI: hide what a role cannot use, but never rely on the UI for security, the backend enforces it.

---

## UI Rules

- Reuse shadcn/ui and `shared/components`. Build small reusable components, avoid duplication.
- Handle loading, empty, and error states on every screen.
- POS screens (orders, KOT, billing) are used in a rush on tablets: large tap targets, minimal clicks, high contrast.
- Tablet-first for staff screens, desktop for the owner dashboard.

## Code Style

- Function components with named exports (default export only where Next.js requires it, like `page.tsx`).
- Keep components small. Move logic into the module's utils or hooks file.
- Early return. Meaningful names. No duplicate code.
- Comments only to explain WHY.

## Testing and Git

- Test utilities (especially money), schemas, and important forms.
- Conventional commits, small commits, one branch per feature (`feat/sprintN-name`, same name as the backend branch).

---

## AI Rules

- Follow the existing project structure. Never change architecture without asking.
- Ask before introducing a new dependency.
- Generate production-ready code. No placeholder code, no unused files.

## Definition of Done

Screen works against the real API, loading/empty/error states handled, lint and build pass, API types regenerated from the latest OpenAPI, no secrets in diff.

## Lessons Learned (add agent mistakes here)

- (empty)
