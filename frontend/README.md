# Health Tracker Frontend

The Next.js client for [Health Tracker](../README.md), a personal health-tracking application with a separate Spring Boot API.

## Stack and code map

Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query, Zustand, Recharts, and React Aria Components. See [package.json](package.json) for exact versions.

- [src/app](src/app): App Router pages and layouts for dashboard, workouts, nutrition, and other tracking views.
- [src/components](src/components): Shared interface and navigation components.
- [src/lib/api](src/lib/api): Typed feature API modules and the shared HTTP client.
- [src/lib/stores](src/lib/stores): Authentication, theme, timer, and UI state.
- [src/types](src/types): Shared TypeScript data models.

## Run locally

Requires Node.js 20.9 or newer and npm. Follow the [root setup guide](../README.md#local-development) to configure PostgreSQL and start the backend first.

From this directory:

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The [API client](src/lib/api/client.ts) defaults to `http://localhost:9147`. Set `NEXT_PUBLIC_API_URL` in an uncommitted `.env.local` to use a different development backend; do not place secrets in browser-exposed `NEXT_PUBLIC_` variables.

Use synthetic data when evaluating the interface. Optional backend integrations require their own server-side configuration.

## Validation

```bash
npm run lint
npm run build
# After a successful build:
npm start
```

There is no frontend test script in the current package. The repository's [CodeQL workflow](../.github/workflows/codeql.yml) covers JavaScript/TypeScript and Java; its [Security checks workflow](../.github/workflows/security-checks.yml) audits frontend npm dependencies. The audit is non-blocking, so check logs rather than interpreting a green badge as zero vulnerabilities. See the [root validation notes](../README.md#validation-and-security-checks) for coverage limits.

## Framework credits and deployment

Originally bootstrapped with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app). The layout uses [next/font](https://nextjs.org/docs/app/getting-started/fonts) with [Geist](https://vercel.com/font).

- [Next.js documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js source](https://github.com/vercel/next.js)
- [Next.js deployment guide](https://nextjs.org/docs/app/getting-started/deploying)
- [Vercel](https://vercel.com/new)

Deployment requires a reachable backend and matching API/CORS configuration. Follow the repository's [contribution and attribution guidance](../CONTRIBUTING.md).
