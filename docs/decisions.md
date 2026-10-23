# Architecture & Technical Decisions (posai-web)

This document records architectural, technical, and operational decisions agreed upon for the `posai-web` frontend.

---

## 1. Package Manager: npm

- **Decision**: Use `npm` exclusively as the package manager. Plain `npm install` without `--legacy-peer-deps`.
- **Context**: Keeps workflows standardized and consistent across both `posai-api` and `posai-web` repositories.

---

## 2. Tailwind CSS v3

- **Decision**: Tailwind CSS v3 (`^3.4.17`) is chosen on purpose over Tailwind v4.
- **Context**: Provides full stability with the established shadcn/ui component system, CSS custom property theming, PostCSS, and `tailwindcss-animate`.

---

## 3. Ant Design for Forms Only

- **Decision**: Ant Design is used strictly for form components (`Form`, `Input`, `Select`, `DatePicker`, `Switch`, etc.). All other UI elements (layouts, cards, buttons, dialogs, tables) use shadcn/ui and Tailwind CSS.
- **Context**: Leverages Ant Design's mature form controls and validation state management while preserving modern Tailwind/shadcn styling across the rest of the application.

---

## 4. AntdRegistry in Root Layout

- **Decision**: The root layout (`src/app/layout.tsx`) is wrapped in `<AntdRegistry>` from `@ant-design/nextjs-registry`.
- **Context**: Enables server-side CSS-in-JS style extraction for the Next.js App Router, preventing Flash of Unstyled Content (FOUC) and hydration mismatches.

---

## 5. tailwind-merge Version Pinning

- **Decision**: Use `tailwind-merge` v2 (`^2.6.0`) because the project uses Tailwind CSS v3; revisit when moving to Tailwind v4.
- **Context**: `tailwind-merge` v3 was redesigned specifically for Tailwind CSS v4 class grammars. Version 2.6 is the proper version for Tailwind CSS v3 class conflict resolution.

---

## 6. OpenAPI Type Generation

- **Decision**: Frontend API types are generated using `openapi-typescript` into [`src/shared/types/api.d.ts`](../src/shared/types/api.d.ts) and surfaced via [`src/shared/types/api.ts`](../src/shared/types/api.ts). The generation script (`npm run api:types`) defaults `OPENAPI_SOURCE` to `../posai-api/openapi.json`.
- **Context**:
  - Referencing the committed sibling repository file allows types to be generated without requiring a live backend or database connection during development and CI.
  - Specifying a live server URL (for example `OPENAPI_SOURCE=http://localhost:8080/api/v1/docs/openapi.json npm run api:types`) is also supported.
  - The generated file `src/shared/types/api.d.ts` must never be edited by hand and is excluded from ESLint and Prettier. Whenever the backend API contract changes, run `npm run api:types`.
  - CI must never run `api:types` because the backend repo is not available in frontend CI workflows; the committed `api.d.ts` is the source of truth.
  - [`src/shared/lib/health.ts`](../src/shared/lib/health.ts) is only a temporary type-level proof and must be deleted once a real module API file uses the generated types.

---

## 7. TypeScript 5.x Strict Mode

- **Decision**: Use TypeScript 5.9.x (`^5.9.3`) in strict mode with bundler module resolution.
- **Context**: Guarantees type safety across both frontend application components and shared infrastructure.

---

## 8. Literal Environment Variable Inlining

- **Decision**: Read client environment variables through explicit literal member access (e.g. `process.env.NEXT_PUBLIC_API_URL`) in [`src/shared/lib/env.ts`](../src/shared/lib/env.ts) rather than passing the whole `process.env` object into parsers.
- **Context**: Next.js compiler replaces literal `process.env.NEXT_PUBLIC_*` identifiers with their compile-time values in browser bundles. Passing `process.env` dynamically prevents static inlining in client-side code.

---

## 9. Money Rules & Decimal Handling

- **Decision**: The API communicates currency strictly in integer paise. Convert to rupees only at display time using [`formatPaise`](../src/shared/lib/money.ts).
- **Decimal Safety in `rupeesToPaise`**:
  - `rupeesToPaise rejects more than 2 decimals; never truncates silently.`
  - Inputs with more than two decimal places (such as `1.005` or `1.999`) throw `TypeError`.
  - Exponent notation (e.g. `1e-7`, `1e21`) is rejected with `TypeError`.
  - Values whose paise result exceeds `Number.isSafeInteger` are rejected with `TypeError`.
  - Whitespace in string rupee inputs is trimmed before parsing.

---

## 10. Co-located Tests Next to Code

- **Decision**: Frontend unit tests are co-located next to code (`src/**/*.test.ts`), whereas the backend repository organizes tests in a root `tests/` directory.
- **Context**: Keeps unit tests directly next to modular utilities (`money.test.ts`, `zodAntdRule.test.ts`, `env.test.ts`) for developer ergonomics. Test suites do not require a `.env` file on disk.

---

## 11. Windows Exact-Case Folder Path

- **Decision**: Always open and run the repository from the exact-case folder path (`posAI-web`).
- **Context**: On Windows, accessing the directory with different casing (e.g. `posai-web` vs `posAI-web`) causes Node module resolution to evaluate `react` and other shared libraries twice in different paths. This breaks React 19 dispatcher contexts during `next build` prerendering with `"Cannot read properties of null (reading 'useContext')"`.
