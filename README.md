# Fountain Life Notebook Frontend

React Router UI for the Fountain Life Notebook interview app.

This repo is meant to be reviewed with the sibling backend and infra repos:

```text
Ramin/
  JacobiSolutions.FountainLifeNotebook.Backend/
  jacobi-solutions.fountain-life-notebook.frontend/
  JacobiSolutions.FountainLifeNotebook.Infra/
```

## Interview Review Path

For a quick codebase review:

1. Run or inspect the app with the Docker command below.
2. Skim `app/services`, `app/features/notebook`, and
   `app/api/generated-api-client.ts`.
3. Check contract generation in [orval.config.ts](orval.config.ts).
4. Run `npm run verify` before judging final readiness.

## Run The Full App Locally

Fastest path, from this frontend repo:

```bash
cd ../JacobiSolutions.FountainLifeNotebook.Backend
docker compose -f docker-compose.local.yml up
```

Open:

```text
http://localhost:5173
```

Useful URLs:

```text
Frontend:   http://localhost:5173
API health: http://localhost:3000/api/health
API docs:   http://localhost:3000/api/docs
```

Stop it from the backend repo:

```bash
docker compose -f docker-compose.local.yml down
```

Docker starts MongoDB, the backend, and this frontend. Node.js and MongoDB do
not need to be installed locally for this path.

## Manual Frontend Run

Use this if the backend is already running at `http://localhost:3000/api`.

Prerequisites:

- Node.js 22 or newer

```bash
npm ci
test -f .env || cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

The default `.env.example` uses local auth and points to the local backend.
Cognito is not required for local development.

## Checks

```bash
npm run verify
```

This regenerates API contracts, typechecks, runs tests, and builds the app.

Focused commands:

```bash
npm run typecheck
npm test
npm run build
npm run contract:generate
```

## API Contracts

Generated API functions live at:

```text
app/api/generated/fountain-life-api.ts
```

When backend request or response shapes change:

```bash
npm run contract:sync
```

That exports the sibling backend OpenAPI document and regenerates this client.
Normal JSON API calls should use generated functions. Streaming still uses the
hand-written SSE client.

## What To Look At

- `app/services`: auth, API clients, streaming, and service composition.
- `app/features/notebook`: main product workflow and view-model logic.
- `app/api/generated-api-client.ts`: auth header injection and base URL wiring.
- `app/api/generated/fountain-life-api.ts`: generated OpenAPI client.
- `vite.config.ts` and `react-router.config.ts`: build/runtime setup.

## Local Defaults

```text
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AUTH_MODE=local
VITE_LOCAL_AUTH_EMAIL=local.user@fountainlife.local
```

For the full list, see [.env.example](.env.example).

## Deployment Context

The deployed frontend is a static React Router build served from private S3
through CloudFront. CloudFront also proxies `/api/*` to the backend, so the
browser uses one HTTPS origin. Terraform lives in the sibling infra repo.

## Troubleshooting

- If frontend API calls fail, check `http://localhost:3000/api/health`.
- If generated types are stale, run `npm run contract:sync`.
- If `npm run contract:generate` cannot find OpenAPI, run
  `npm run contract:export` in the sibling backend repo.
