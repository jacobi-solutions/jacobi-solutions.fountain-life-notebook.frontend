# Frontend Technical Debt

Known deferred work and review notes.

## Local And Interview Workflow

- The local setup assumes the backend is already running at
  `VITE_API_BASE_URL`.
- The Docker Compose local path exists in the sibling backend repo, but the
  recommended interview workflow is the terminal setup because that is the
  verified local path.
- Generated API code must be refreshed after backend contract changes.
- The streaming client is intentionally hand-written and should remain covered by
  focused tests as behavior grows.
- Deployed Cognito behavior depends on compile-time Vite variables, so deployment
  variables need to stay aligned with Terraform outputs.
- Studio output controls currently use an explicit "not implemented yet" notice.
  Each control should either graduate to a real feature with tests or remain
  clearly marked as unavailable.
- Global base styles apply to every route through `app/app.css`, but the
  branded ribbon, wordmark, and notebook chrome are still scoped to the notebook
  workspace until another page justifies a shared shell component.

## Product And UX Debt

- Upload, ingestion, retry, delete, and failed-source states need richer UI if
  backend ingestion becomes asynchronous.
- Source provenance labels need to scale beyond uploaded documents to clinician
  documents, system-generated reports, audio transcripts, AI outputs, and
  doctor-reviewed notes.
- Ask-a-doctor and doctor-review status flows are not implemented yet.
- Add-user is intentionally narrow. Invitation history, resend/revoke, role
  management, notifications, and role-specific doctor/patient views are
  deferred.
- Source guide, notebook guide, FAQ, timeline, comparison, visit-prep, audio
  overview, visual overview, and learning-mode surfaces are candidate follow-ups,
  not current product behavior.
- Mobile notebook tabs currently use local view state and responsive CSS. Add
  dedicated UI coverage if this becomes a critical workflow.
- Patient-friendly result summaries and follow-up extraction need careful
  citation UX so patients can see what came from source material.
- View-model tests should expand around streaming, doctor-review states,
  selected-source behavior, and consent flows as those features are added.
- The document reader displays extracted chunks from the API. Page-faithful PDF
  rendering, in-reader search, and citation-to-chunk scrolling are deferred.

## Compliance And Data Protection Debt

- Privacy, consent, export, and delete UX are not complete enough for real
  patient data.
- Screens need consistent labeling for AI-only, source-backed, doctor-reviewed,
  and doctor-corrected content.
- Health-data pages should avoid ad-tech, tracking pixels, or nonessential
  analytics unless a compliance review explicitly approves them.
- The frontend should avoid placing PHI in URLs, browser storage, analytics
  events, console logs, screenshots, or error-reporting payloads.
- Patient-facing audio recording, transcription, AI processing, and clinician
  review need explicit consent and status messaging before real use.
