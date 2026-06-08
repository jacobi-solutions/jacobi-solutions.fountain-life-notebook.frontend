# Engineering Workflow

## Local Setup

```bash
npm run setup:local
npm run dev
```

Manual equivalent:

```bash
npm ci
test -f .env || cp .env.example .env
```

The backend must be running at `VITE_API_BASE_URL` in `.env`.

## Checks

```bash
npm run verify
```

Focused commands:

```bash
npm run typecheck
npm test
npm run build
npm run contract:generate
```

## Contract Changes

When backend request or response shapes change:

```bash
npm run contract:sync
```

Normal JSON backend calls should use generated functions from
`app/api/generated/fountain-life-api.ts`. Keep custom transport code for
streaming behavior.

## Safety Rules

- Do not commit `.env`, secrets, tokens, or account-specific deployment values.
- Do not use real PHI in local fixtures, screenshots, prompts, browser storage,
  analytics, or error-reporting payloads unless the compliance scope and approved
  handling process are explicit.
- Keep local auth as the default unless Cognito behavior is being tested.
- Keep service logic in `app/services` and view/model behavior in feature
  folders.
- AI-agent specific workflow notes live in
  [codex/ENGINEERING_DELIVERY_WORKFLOW.md](codex/ENGINEERING_DELIVERY_WORKFLOW.md).
