# Frontend Architecture Decisions

This file records high-level decisions visible in the codebase and supporting
config.

## React Router SPA

- Decision: use React Router with Vite for the browser app.
- Why we chose it: it keeps the interview app lightweight while supporting a
  static deployment path.
- Tradeoffs considered: deployment needs SPA fallback behavior at the hosting
  layer.
- Evidence/source: `react-router.config.ts`, `vite.config.ts`, and
  `package.json`.

## Shared README Shape

- Decision: each repo uses the same README structure with one compact milestone
  branch table.
- Why we chose it: interview reviewers get consistent navigation while still
  seeing how the project evolved.
- Tradeoffs considered: milestone notes stay high-level; deeper context belongs
  in supporting docs and the milestone branch code itself.
- Evidence/source: `README.md` and the `milestone/*` branches.

## Transparent Local Setup

- Decision: `npm run setup:local` wraps normal setup without hiding the manual
  commands.
- Why we chose it: reviewers can start faster while still seeing exactly what
  the script does.
- Tradeoffs considered: the script intentionally does not start the backend, so
  the API remains an explicit prerequisite.
- Evidence/source: `README.md`, `scripts/setup-local.sh`, `package.json`, and
  `.env.example`.

## Service Layer Around UI

- Decision: UI components coordinate state and rendering while `app/services`
  owns auth, API clients, streaming, and service composition.
- Why we chose it: the main notebook workflow stays easier to review when
  transport and auth details are not embedded directly in view code.
- Tradeoffs considered: small features have more structure than a
  single-component prototype.
- Evidence/source: `app/services`, `app/features/notebook`, and
  `app/services/service-context.tsx`.

## Generated API Client For JSON Calls

- Decision: Orval generates API functions from the backend OpenAPI document for
  normal JSON request/response calls.
- Why we chose it: the backend contract remains the source of truth and frontend
  calls stay typed.
- Tradeoffs considered: backend contract changes need an explicit generation
  step.
- Evidence/source: `orval.config.ts`, `app/api/generated/fountain-life-api.ts`,
  `app/api/generated-api-client.ts`, and `package.json`.

## Notebook Detail Uses A Full-Width Workspace

- Decision: the active notebook view uses the available page width for source,
  chat, and Studio panels instead of keeping the product UI inside a narrow
  centered shell.
- Why we chose it: the notebook workflow is a work surface for repeated review,
  source selection, and source-backed questions. Giving the panels more room
  makes the interview demo easier to scan while preserving Fountain Life
  styling.
- Tradeoffs considered: a narrower marketing-style shell is visually simpler,
  but it made the working panels feel crowded once source inputs, chat, and
  Studio actions were visible together.
- Evidence/source: thread notes comparing the NotebookLM reference with the
  Fountain Life notebook workspace, `app/features/notebook/notebook-workspace.view.tsx`,
  and `app/features/notebook/notebook-workspace.css`.

## Unimplemented Studio Actions Are Explicitly Marked

- Decision: Studio actions that are not implemented keep their visual affordance
  but open a small "not implemented yet" notice that lists working features.
- Why we chose it: the UI can communicate intended product direction without
  letting reviewers mistake placeholder controls for completed behavior.
- Tradeoffs considered: hiding every future Studio action would make the demo
  less expressive. Showing inactive actions without feedback would be confusing.
- Evidence/source: thread notes requesting clear feedback for unimplemented
  features, plus `STUDIO_ACTIONS`, `WORKING_FEATURES`,
  `UnavailableFeatureNotice`, and `.unavailable-feature-popover` in
  `app/features/notebook/notebook-workspace.view.tsx` and
  `app/features/notebook/notebook-workspace.css`.

## Hand-Written Streaming Client

- Decision: assistant streaming uses a custom client instead of the generated
  JSON client.
- Why we chose it: server-sent events are not the same shape as normal
  request/response JSON operations.
- Tradeoffs considered: streaming transport must be maintained separately from
  generated client code.
- Evidence/source: `app/services/api-client.ts` and
  `app/services/assistant-service.ts`.

## Notebook Workspace Reads Source Documents In Place

- Decision: the notebook workspace can switch the center work area between chat
  and a document reader while citation controls open the relevant uploaded
  source. On desktop, sources and studio stay in place while chat and document
  text scroll internally.
- Why we chose it: source review should stay inside the notebook context, so
  reviewers can inspect uploaded document text and cited sources without leaving
  the workflow.
- Tradeoffs considered: rendering extracted chunks is faster to ship and matches
  the backend detail API, but it is not a page-faithful PDF viewer. Fixed desktop
  panels require explicit internal scroll regions for the chat and reader
  surfaces.
- Evidence/source: `app/features/notebook/notebook-workspace.view.tsx`,
  `app/features/notebook/notebook-workspace.tsx`,
  `app/features/notebook/notebook-workspace.css`, and
  `app/services/documents-service.ts`.

## Step Away Flow Stays Frontend-Local And Privacy-Safe

- Decision: the Step Away wellness interruption flow is a self-contained
  frontend component mounted inside the notebook UI. It uses local React state,
  CSS-driven animation, Web Audio chimes, and a bundled nature image instead
  of backend state, persisted events, document mutations, or screenshot/canvas
  capture of medical content.
- Why we chose it: the feature is meant to help a patient pause when medical
  information feels overwhelming. It should not create new health data, copy
  document text into pixels, alter notebook state, or couple the interruption to
  assistant behavior.
- Tradeoffs considered: a screenshot-like crumble could look more literal, but
  it risks rasterizing sensitive document content. The implemented CSS fragment
  layer is less exact but more stable and privacy-safe. The chime is synthesized
  in browser code rather than shipped as a polished meditation-audio asset. The
  breathing-benefit message includes citations, but patient-facing clinical
  copy should still be reviewed before any real health-data use.
- Evidence/source: `app/features/notebook/step-away-flow.tsx`,
  `app/features/notebook/step-away-flow.css`,
  `app/features/notebook/step-away-flow.vm.ts`,
  `app/features/notebook/step-away-flow.vm.test.ts`,
  `public/wellness/step-away-nature.jpg`, and the Step Away mount points in
  `app/features/notebook/notebook-workspace.view.tsx`.

## Persisted Notebook Gallery Instead Of Demo Fixtures

- Decision: the notebook gallery reads notebooks from the backend and shows
  empty/loading/error states instead of hardcoded demo notebooks.
- Why we chose it: a fresh app should reflect real persisted state, and demo
  seed documents should remain optional artifacts rather than frontend source
  data.
- Tradeoffs considered: the first-load experience is quieter than a populated
  mock gallery, but it better proves persistence, membership, and source
  isolation during review.
- Evidence/source: `app/features/notebook/notebook-workspace.tsx`,
  `app/features/notebook/notebook-workspace.view.tsx`,
  `app/services/notebooks-service.ts`, and
  `app/services/notebooks-service.test.ts`.

## Lightweight Role Invite UI

- Decision: notebook owners can open an Add user dialog, choose `patient`,
  `clinician`, or `viewer`, and submit an email through the generated notebook
  invite API.
- Why we chose it: the demo needs separate reviewer/friend/clinician accounts
  that can share one workspace without implementing a full sharing center.
- Tradeoffs considered: the UI does not yet include invitation history,
  notification routing, resend/revoke flows, or role-specific workspace views.
- Evidence/source: `app/features/notebook/notebook-workspace.view.tsx`,
  `app/features/notebook/notebook-workspace.tsx`,
  `app/features/notebook/notebook-workspace.model.ts`,
  `app/services/notebooks-service.ts`, and
  `app/services/notebooks-service.test.ts`.

## Fountain Life Base Styling

- Decision: global route styling uses the Fountain Life-inspired base palette,
  DM Sans, dark premium surfaces, aqua/gold accents, and pill controls.
- Why we chose it: this thread explicitly aligned the frontend with Fountain
  Life's current website aesthetics while keeping the notebook as the first
  screen.
- Tradeoffs considered: `app/app.css` gives new pages the base visual language,
  but notebook-specific chrome stays scoped to the notebook stylesheet until
  more pages need a shared app shell.
- Evidence/source: thread notes, `app/root.tsx`, `app/app.css`,
  `app/features/notebook/notebook-workspace.view.tsx`, and
  `app/features/notebook/notebook-workspace.css`.

## Mobile Notebook Tabs Swap Panels

- Decision: on mobile, the notebook detail view uses top-level Sources, Chat,
  and Studio tabs that swap the visible panel. Desktop keeps the three-column
  workspace visible at once.
- Why we chose it: the interaction matches the expected NotebookLM-style mobile
  behavior and avoids unexpected jump-link movement.
- Tradeoffs considered: stacked panels with anchor links are simpler, but they
  do not match the expected mobile notebook behavior.
- Evidence/source: `app/features/notebook/notebook-workspace.view.tsx` and
  `app/features/notebook/notebook-workspace.css`.
