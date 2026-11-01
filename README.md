# POSAI Web (posai-web)

Frontend application for **POSAI** — a multi-tenant Restaurant POS SaaS platform, built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Ant Design (strictly for form controls), and TanStack Query.

---

## Requirements

- **Node.js**: `>= 20.9.0` (Node 22 recommended)
- **npm**: `>= 10.0.0`
- **Backend API**: Running `posai-api` (default: `http://localhost:8080`)

---

## Running Locally with the API

Run both services in **separate terminals**. The web app calls the backend directly via Axios; there is no Next.js proxy involved.

### Backend (`posai-api`) — port 8080

```bash
cd posai-api
cp .env.example .env      # then fill in the values below
npm run dev               # or: npm start
```

Required env vars on the **API side** (matching `posAI-api/.env.example`):

| Variable                   | Example / Default                 | Description                                                                      |
| -------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`                 | `development`                     | Server environment (`development`, `test`, `production`)                         |
| `PORT`                     | `8080`                            | Port Express listens on                                                          |
| `MONGODB_URI`              | `mongodb://localhost:27017/posai` | Connection string (replica set e.g. `?replicaSet=rs0` required for transactions) |
| `JWT_ACCESS_SECRET`        | `min 32 random chars`             | Secret used to sign and verify access token JWTs                                 |
| `ACCESS_TOKEN_TTL_MINUTES` | `15`                              | Access token lifetime in minutes                                                 |
| `REFRESH_TOKEN_TTL_DAYS`   | `7`                               | Refresh token lifetime in days                                                   |
| `CLIENT_URL`               | `http://localhost:3000`           | Allowed CORS origin — frontend origin (no trailing slash)                        |
| `BCRYPT_ROUNDS`            | `12`                              | Bcrypt salt rounds (4–15)                                                        |
| `AUTO_VERIFY_EMAIL`        | `false` (or `true` in dev)        | Auto-verifies email at signup when `true`                                        |
| `TRUST_PROXY`              | `0`                               | Number of reverse proxies in front of Express                                    |
| `EMAIL_PROVIDER`           | `log`                             | `log` prints verification & reset links to terminal; `smtp` sends email          |
| `EMAIL_FROM`               | `noreply@posai.app`               | Sender address (required when `EMAIL_PROVIDER=smtp`)                             |
| `SMTP_HOST`                | `smtp.mailgun.org`                | SMTP server host (required when `EMAIL_PROVIDER=smtp`)                           |
| `SMTP_PORT`                | `587`                             | SMTP server port (required when `EMAIL_PROVIDER=smtp`)                           |
| `SMTP_USER`                | `postmaster@posai.app`            | SMTP username (required when `EMAIL_PROVIDER=smtp`)                              |
| `SMTP_PASS`                | `secret-smtp-password`            | SMTP password (required when `EMAIL_PROVIDER=smtp`)                              |
| `LOG_LEVEL`                | `info`                            | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`)    |

> [!NOTE]
> `JWT_REFRESH_SECRET` is not used by the runtime auth service because `posai-api` issues opaque cryptographically-random tokens stored as SHA-256 hashes in MongoDB, not signed JWTs.

### Frontend (`posai-web`) — port 3000

```bash
cd posai-web
cp .env.example .env.local   # already contains the correct default below
npm run dev
```

Required env vars on the **web side**:

| Variable              | Value                          |
| --------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` |

> [!NOTE]
> With `EMAIL_PROVIDER=log`, verification and password-reset links are printed to the **API terminal**. Copy the link and open it in the browser.
> With `AUTO_VERIFY_EMAIL=true`, new accounts are verified immediately and the signup form shows "Account created — you can log in now" without sending any email.

### Both services at a glance

```
posAI/
├── posai-api/    →  npm run dev    →  http://localhost:8080
└── posai-web/    →  npm run dev    →  http://localhost:3000
```

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
