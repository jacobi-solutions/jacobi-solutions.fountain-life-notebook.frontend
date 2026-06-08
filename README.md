# Fountain Life Notebook Frontend

## Project Summary / Repo Layout

Fountain Life Notebook is an interview project split across three repositories:
a NestJS backend API, a React Router frontend, and Terraform infrastructure for
the AWS deployment path. The milestone branches preserve the build-out history.

This frontend repo provides the React Router UI for the interview app and is
meant to be reviewed with the sibling backend and infra repos:

```text
FountainLifeNotebook/
  JacobiSolutions.FountainLifeNotebook.Backend/
  jacobi-solutions.fountain-life-notebook.frontend/
  JacobiSolutions.FountainLifeNotebook.Infra/
```

## Project Map / Milestone Summary

| Milestone | Major idea | Backend | Frontend | Infra |
| --- | --- | --- | --- | --- |
| 00 Starter Stack | App shells, local defaults, repo boundaries. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F00-starter-stack) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F00-starter-stack) | starts in Milestone 2 |
| 01 Core Notebook | Local notebook workflow, documents, notebooks, generated contracts, local auth. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F01-core-notebook) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F01-core-notebook) | starts in Milestone 2 |
| 02 AWS Ready Foundation | Cognito, S3/CloudFront, ECS, Secrets Manager, deployment variables. Infra starts here. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F02-aws-ready-foundation) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F02-aws-ready-foundation) | [infra](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Infra/tree/milestone%2F02-aws-ready-foundation) |
| 03 Bedrock KB Notebooks | Bedrock Knowledge Bases, notebook retrieval, notebook/user isolation. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F03-bedrock-kb-notebooks) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F03-bedrock-kb-notebooks) | [infra](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Infra/tree/milestone%2F03-bedrock-kb-notebooks) |

## At A Glance

- Purpose: browser app, local/Cognito auth wiring, notebook UI, source/document
  reader, API service layer, streaming client, and generated OpenAPI client
  usage.
- Running app: [https://d10nrh49pw7gmt.cloudfront.net](https://d10nrh49pw7gmt.cloudfront.net)
- Fast-track setup: `npm run setup:local`, then `npm run dev`.
- Local dependency: backend running at `VITE_API_BASE_URL` in `.env`.
- Main review areas: `app/services`, `app/features/notebook`,
  `app/api/generated-api-client.ts`, `app/app.css`, and
  [orval.config.ts](orval.config.ts).
- More detail: [run locally](#details-run-locally),
  [frontend only](#details-frontend-only), [checks](#details-checks),
  [contracts](#details-api-contracts), [code tour](#details-what-to-look-at),
  [deployment context](#details-deployment-context),
  [supporting docs](#details-supporting-docs).

## Interview Review Path

For a quick codebase review:

1. Run or inspect the app with the terminal commands below.
2. Skim `app/services`, `app/features/notebook`, and
   `app/api/generated-api-client.ts`.
3. Check contract generation in [orval.config.ts](orval.config.ts).
4. Review `app/app.css` and `app/features/notebook/notebook-workspace.css` for
   the Fountain Life-inspired base styling and notebook chrome.
5. Run `npm run verify` before judging final readiness.

## Details: Run Locally

Prerequisites:

- Node.js 22 or newer
- MongoDB at `mongodb://localhost:27017/fountain-life-notebook`, or another
  MongoDB URI set in the backend `.env`

Terminal 1, from the sibling backend repo:

```bash
cd ../JacobiSolutions.FountainLifeNotebook.Backend
npm run setup:local
npm run start:dev
```

Terminal 2, from this frontend repo:

```bash
npm run setup:local
npm run dev
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

The setup script is only a shortcut for normal local setup. The manual
equivalent is:

```bash
npm ci
test -f .env || cp .env.example .env
```

## Details: Frontend Only

Use this if the backend is already running at `http://localhost:3000/api`.

Prerequisites:

- Node.js 22 or newer

```bash
npm run setup:local
npm run dev
```

Open:

```text
http://localhost:5173
```

The default `.env.example` uses local auth and points to the local backend.
Cognito is not required for local development.

## Details: Optional Docker

The sibling backend repo includes `docker-compose.local.yml` for a containerized
local stack, and the deployed app is built around containerized backend
infrastructure. The Compose path has not been the primary verified local
interview workflow, so we recommend the terminal setup above.

If you want to try it from this frontend repo:

```bash
cd ../JacobiSolutions.FountainLifeNotebook.Backend
docker compose -f docker-compose.local.yml up
```

## Details: Checks

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

## Details: API Contracts

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

## Details: What To Look At

- `app/services`: auth, API clients, streaming, and service composition.
- `app/features/notebook`: main product workflow, view-model logic, responsive
  notebook workspace tabs, chat, sources, and document reader.
- `app/app.css`: global base styles that apply to every route.
- `app/features/notebook/notebook-workspace.css`: notebook-specific brand chrome
  and responsive layout.
- `app/api/generated-api-client.ts`: auth header injection and base URL wiring.
- `app/api/generated/fountain-life-api.ts`: generated OpenAPI client.
- `vite.config.ts` and `react-router.config.ts`: build/runtime setup.

## Details: Local Defaults

```text
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AUTH_MODE=local
VITE_LOCAL_AUTH_EMAIL=local.user@fountainlife.local
```

For the full list, see [.env.example](.env.example).

## Details: Deployment Context

The deployed frontend is a static React Router build served from private S3
through CloudFront. CloudFront also proxies `/api/*` to the backend, so the
browser uses one HTTPS origin. The running app is
[https://d10nrh49pw7gmt.cloudfront.net](https://d10nrh49pw7gmt.cloudfront.net).
Terraform lives in the sibling infra repo.
The deploy workflow validates the committed generated API client with
typecheck, tests, and build; contract regeneration is a local review step.

## Details: Supporting Docs

- [Architecture decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Feature ideas](docs/FEATURE_IDEAS.md)
- [Technical debt](docs/TECH_DEBT.md)
- [Engineering workflow](CONTRIBUTING.md)

## Details: Troubleshooting

- If frontend API calls fail, check `http://localhost:3000/api/health`.
- If generated types are stale, run `npm run contract:sync`.
- If `npm run contract:generate` cannot find OpenAPI, run
  `npm run contract:export` in the sibling backend repo.
