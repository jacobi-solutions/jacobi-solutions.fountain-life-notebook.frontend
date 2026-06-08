# Frontend Feature Ideas

These are candidate follow-ups, not commitments.

- Improve notebook organization and navigation as the number of notebooks grows.
- Add richer upload status, ingestion progress, retry, and failure states if the
  backend moves ingestion to asynchronous processing.
- Add citation-focused UI that highlights source documents and passages used by
  assistant answers.
- Add a doctor visit prep brief or physician briefing output that turns selected
  sources into a concise clinician-facing summary. This is a candidate follow-up
  because it maps well to the doctor-review vision and the current Studio output
  placeholders, but it is not implemented yet.
- Add an "ask a clinician" escalation surface if the backend adds review cases.
- Add NotebookLM-style source guides, whole-notebook guides, generated FAQs,
  source comparison, timelines, audio overviews, visual summaries, and learning
  mode for medical terms found in patient records.
- Add audio-session transcript views for recorded calls or visits, including
  source labels, timestamps when available, and doctor-review status where
  relevant.
- Add Epic-inspired action handoffs such as creating a doctor-review request,
  adding a visit-agenda item, marking a follow-up, or drafting a patient message
  for clinician review.
- Add privacy and consent surfaces for upload, AI processing, transcription,
  clinician review, export, and deletion before any real patient data use.
- Add local Cognito-mode review notes if reviewers need to exercise deployed
  auth behavior from a local frontend build.
- Expand tests around view-model behavior, streaming edge cases, auth mode
  changes, and notebook membership interactions.
- Add automated responsive coverage for the mobile Sources, Chat, and Studio
  tab-panel interaction.
- Replace the current synthesized Step Away chime with a reviewed sound-bowl
  style audio asset if the audio cue remains part of the experience. Keep mute
  controls and reduced-distraction defaults.
- Add more Step Away release options, such as a longer unguided nature scene,
  a user-selected breathing duration, or a clinician-reviewed set of grounding
  prompts.
- Extract a shared `AppShell` or `BrandHeader` only after additional pages need
  the Fountain Life notebook chrome beyond the current notebook workspace.
- Add richer source-reader affordances such as in-document search, citation
  anchors, or PDF-like rendering if reviewers need page-level document review.
