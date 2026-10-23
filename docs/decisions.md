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
