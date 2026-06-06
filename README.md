# Fountain Life Notebook Frontend

React Router UI for the Fountain Life interview NotebookLM-style app.

## Stack Shape

- App shell: React Router SPA served by Vite.
- Server state: TanStack Query.
- Service layer: `app/services` owns auth, streaming, and app-specific API orchestration.
- UI organization: feature containers compose services and query state, view files hold JSX, and `*.vm.ts` files hold testable view-model logic.
- Contracts: Orval generates callable TypeScript API functions and schemas in `app/api/generated/fountain-life-api.ts`.
- Auth: local interview mode by default, Cognito OIDC mode available with `VITE_AUTH_MODE=cognito`.
- API client: generated API functions use `app/api/generated-api-client.ts` for base URL and auth header injection. `ApiClient` remains for SSE streaming.

## Local Setup

### Option A: One Command With Docker

The backend repo includes a local Docker Compose file that starts MongoDB, the backend, and this frontend together.
It assumes the repos are cloned as siblings:

```text
Ramin/
  FountainLifeNotebook.Backend/
  fountain-life-notebook.frontend/
```

From `/Users/shanedrye/jacobi/Ramin/FountainLifeNotebook.Backend`:

```bash
docker compose -f docker-compose.local.yml up
```

Then open:

```text
http://localhost:5173
```

### Option B: VS Code Debugger

The backend repo includes `FountainLifeNotebook.code-workspace`, which opens both repos and provides a full-stack debugger configuration.

From this frontend repo alone, VS Code also exposes `Frontend: Debug Chrome`. That configuration starts the normal frontend dev server through `npm run dev` and opens Chrome at `http://localhost:5173`. The backend still needs to be running separately.

### Option C: Manual Local Development

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

This runs Orval against the backend OpenAPI document and regenerates callable API functions. Frontend services should import those generated functions instead of hard-coding normal JSON endpoint paths.

The assistant streaming endpoint still uses the hand-written SSE client because it is not a normal JSON request/response operation.

For convenience, either sibling repo can run the full backend export plus frontend generate flow:

```bash
npm run contract:sync
```

This assumes the repos are checked out as siblings:

```text
Ramin/
  FountainLifeNotebook.Backend/
  fountain-life-notebook.frontend/
```

## Checks

```bash
npm run verify
```

This regenerates contracts, typechecks, runs tests, and builds the app.
