# Fountain Life Notebook Frontend

React Router UI for the Fountain Life interview NotebookLM-style app.

## Stack Shape

- App shell: React Router SPA served by Vite.
- Server state: TanStack Query.
- Service layer: `app/services` owns API, auth, and backend contract usage.
- Contracts: generated TypeScript API schemas live in `app/api/generated/fountain-life-api.ts`.
- Auth: local interview mode by default, Cognito OIDC mode available with `VITE_AUTH_MODE=cognito`.
- API client: centralized `ApiClient` injects auth headers and parses JSON/SSE responses.

## Local Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and points to `http://localhost:3000/api` by default.

Local auth is enabled by default:

```bash
VITE_AUTH_MODE=local
VITE_LOCAL_AUTH_EMAIL=local.user@fountainlife.local
```

To use Cognito instead, set `VITE_AUTH_MODE=cognito` and provide `VITE_COGNITO_AUTHORITY`, `VITE_COGNITO_CLIENT_ID`, and `VITE_COGNITO_REDIRECT_URI`.

## Contracts

After backend DTO changes and backend OpenAPI export:

```bash
npm run contract:generate
```

## Checks

```bash
npm run verify
```

This regenerates contracts, typechecks, runs tests, and builds the app.
