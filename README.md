# POSAI Web (posai-web)

Frontend application for **POSAI** — a multi-tenant Restaurant POS SaaS platform, built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Ant Design (strictly for form controls), and TanStack Query.

---

## Requirements

- **Node.js**: `>= 20.9.0` (Node 22 recommended)
- **npm**: `>= 10.0.0`
- **Backend API**: Running `posai-api` (default: `http://localhost:8080`)

---

## Setup & Getting Started

1. **Repository Layout**:
   Clone `posai-web` and `posai-api` as sibling folders under one common parent workspace directory:

   ```text
   posAI/
   ├── posai-api/
   └── posai-web/
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:

   ```bash
   cp .env.example .env.local
   ```

   Default configuration:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```

4. **Run the Backend**:
   Ensure `posai-api` is running on `http://localhost:8080`.

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application is available at `http://localhost:3000`.

---

## Main npm Scripts

| Script                 | Command                               | Purpose                                          |
| ---------------------- | ------------------------------------- | ------------------------------------------------ |
| `npm run dev`          | `next dev -p 3000`                    | Start Next.js development server on port 3000    |
| `npm run build`        | `next build`                          | Compile optimized production build               |
| `npm start`            | `next start -p 3000`                  | Start built production server on port 3000       |
| `npm run lint`         | `eslint .`                            | Lint codebase with ESLint 9                      |
| `npm run lint:fix`     | `eslint . --fix`                      | Automatically fix fixable lint issues            |
| `npm run format`       | `prettier --write .`                  | Format files with Prettier                       |
| `npm run format:check` | `prettier --check .`                  | Verify formatting compliance with Prettier       |
| `npm run typecheck`    | `tsc --noEmit`                        | Check types across the project                   |
| `npm test`             | `vitest run`                          | Run automated Vitest test suites                 |
| `npm run test:watch`   | `vitest`                              | Run Vitest in interactive watch mode             |
| `npm run api:types`    | `node scripts/generate-api-types.mjs` | Regenerate TypeScript types from backend OpenAPI |

---

## Regenerating API Types

API types in [`src/shared/types/api.d.ts`](src/shared/types/api.d.ts) are auto-generated from the backend OpenAPI specification. Whenever the backend API contract changes:

```bash
npm run api:types
```

By default, the script reads `../posai-api/openapi.json`. You can also generate directly from a running backend:

```bash
OPENAPI_SOURCE=http://localhost:8080/api/v1/docs/openapi.json npm run api:types
```

_Note: Never manually edit `src/shared/types/api.d.ts`._

---

## Project Structure

```text
src/
├── app/          # Thin Next.js App Router pages and layouts
├── modules/      # Feature modules (auth, orders, menu, etc.)
└── shared/       # App-wide shared infrastructure
    ├── components/ # Shared React providers and components
    ├── lib/        # Core utilities (axios, env, money, zodAntdRule)
    ├── types/      # OpenAPI contract types (api.d.ts, api.ts)
    └── ui/         # Base UI components (shadcn/ui)
```

---

## Windows Exact-Case Folder Path Warning

> [!WARNING]
> On Windows systems, always open and run commands from the exact folder casing (`posAI-web`).
> Windows is case-insensitive, but differing path casings (e.g. `posai-web` vs `posAI-web`) will cause Node module resolution to import duplicate copies of React in memory, resulting in `TypeError: Cannot read properties of null (reading 'useContext')` during Next.js static prerendering.

---

## Architecture & Technical Decisions

For architectural conventions, versions, and technical rationale, see [docs/decisions.md](docs/decisions.md).
