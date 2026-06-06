# Engineering Delivery Workflow (Fountain Life Notebook Frontend)

Central policy:
- Read `/Users/shanedrye/jacobi/codex/ENGINEERING_DELIVERY_WORKFLOW.md` first.
- This file is a Fountain Life Notebook frontend overlay for repo-specific commands, ports, and risks.
- If this file conflicts with the central workflow, the central workflow wins unless the user explicitly overrides it.

## Purpose

- Keep React code service-oriented without recreating Angular.
- Preserve a clear service boundary between UI rendering, API calls, auth, and streaming.

## Repo Scope

Repository root:
- `/Users/shanedrye/jacobi/Ramin/fountain-life-notebook.frontend`

Key areas:
- `app/services` for Angular-inspired service classes, auth, API clients, and React provider hooks
- `app/routes` for React Router screens
- `capacitor.config.ts` for the mobile shell path

## Default Fast Loop

Run from this repo root:

1. `npm run verify`

## Architecture Rules

- Components render and coordinate UI state; services own auth, API, generated-contract usage, and streaming behavior.
- Keep local auth as the default unless Cognito is explicitly needed.
- Use React Context for service composition and small hooks for component access.
- Use TanStack Query for server state and service-level stores only for session/client state.
- Keep environment defaults documented in `.env.example`; do not commit local secrets.

## Contract Rule

If backend request or response shapes change:
- run backend `npm run contract:export`
- run frontend `npm run contract:generate`
- update service wrappers around generated contracts
- update the route/component usage intentionally
- run frontend typecheck/build and the relevant backend build/test
