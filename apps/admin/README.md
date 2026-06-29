# Fikiri Traffic — Admin Dashboard

Next.js 16 admin dashboard for traffic monitoring and analysis. Uses shared UI components from `@fikiri/ui` (shadcn/ui).

**Dev URL:** [http://localhost:7541](http://localhost:7541)

---

## Prerequisites

Install dependencies from the **monorepo root** (required for workspace packages):

```bash
cd ../..   # repository root
pnpm install
```

Do **not** run `npm install` inside `apps/admin` alone — `@fikiri/ui` is linked via pnpm workspaces (`workspace:*`).

---

## Development

From the repository root:

```bash
pnpm --filter @fikiri/admin dev
```

Or from this directory (after root `pnpm install`):

```bash
pnpm dev
```

Optional environment file:

```bash
cp .env.example .env
```

---

## Shared UI package

Components are imported from the workspace package:

```tsx
import { Card } from "@fikiri/ui/components/card";
import { cn } from "@fikiri/ui/lib/utils";
```

Global styles are pulled in via `app/globals.css`:

```css
@import "@fikiri/ui/globals.css";
```

The UI package lives in `packages/ui/`. Next.js transpiles it via `transpilePackages: ["@fikiri/ui"]` in `next.config.ts`.

---

## API integration

See [docs/integration-api-frontend.md](../../docs/integration-api-frontend.md) (JWT auth, endpoints, `NEXT_PUBLIC_API_URL`).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Can't resolve '@fikiri/ui/...'` | Run `pnpm install` from the **repository root** |
| `Can't resolve '@tanstack/react-query'` | Same — root `pnpm install` links all workspace deps |
| Port 7541 already in use | Stop the existing process or change the port in `package.json` |
| TypeScript can't find `@fikiri/ui` | Paths are configured in `tsconfig.json`; restart the TS server |

---

## Build

```bash
pnpm --filter @fikiri/admin build
pnpm --filter @fikiri/admin start
```
