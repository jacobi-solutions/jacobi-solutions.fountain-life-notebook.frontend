import { useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import type {
  NotebookInviteDraft,
  NotebookSummary,
  NotebookWorkspaceModel,
} from "./notebook-workspace.model";
import {
  filterNotebooks,
  formatAuthStatus,
  formatNotebookDate,
  isLocalAuthSession,
  orderNotebooksByMostRecent,
  shouldRequestSignIn,
} from "./notebook-workspace.vm";
import { StepAwayFlow } from "./step-away-flow";

const STUDIO_ACTIONS = [
  "Audio Overview",
  "Ask a doctor",
  "Visit prep brief",
  "Source guide",
  "Compare sources",
  "Timeline",
  "Follow-ups",
  "Learning mode",
];

const STUDIO_FEATURE_DESCRIPTIONS: Record<string, string> = {
  "Ask a doctor": "Send a source-grounded question and AI draft for clinician review.",
  "Audio Overview": "Generate a short spoken walkthrough of the selected sources.",
  "Compare sources": "Highlight what agrees, conflicts, or changed across documents.",
  "Follow-ups": "Extract recommended next steps and questions to track.",
  "Learning mode": "Explain medical terms from these files in plain language.",
  "Source guide": "Create a quick guide to what each uploaded file contains.",
  "Timeline": "Arrange findings, visits, labs, and reports in date order.",
  "Visit prep brief": "Build a concise summary and agenda for an upcoming visit.",
};

const APP_VERSION = `v${__APP_VERSION__}`;
const INVITE_ROLES: NotebookInviteDraft["role"][] = [
  "patient",
  "clinician",
  "viewer",
];
const DEPLOYED_FRONTEND_URL =
  import.meta.env.VITE_DEPLOYED_FRONTEND_URL ??
  "https://d10nrh49pw7gmt.cloudfront.net";
const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, summary, label, [role='button'], [role='link'], [tabindex]";
const AUTH_BYPASS_SELECTOR = "[data-auth-bypass='true']";

function isDesktopInputDevice() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }

  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function NotebookWorkspaceView(model: NotebookWorkspaceModel) {
  const authStatusLabel = formatAuthStatus(model.authState);
  const requiresSignIn = shouldRequestSignIn(model.authState.status);

  function requestSignInForSignedOutAction(event: MouseEvent<HTMLElement>) {
    if (!requiresSignIn || !(event.target instanceof Element)) {
      return;
    }

    const interactiveElement = event.target.closest(INTERACTIVE_SELECTOR);
    if (
      !interactiveElement ||
      !event.currentTarget.contains(interactiveElement) ||
      interactiveElement.closest(AUTH_BYPASS_SELECTOR)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    model.onSignIn();
  }

  function requestSignInForSignedOutKey(event: KeyboardEvent<HTMLElement>) {
    if (
      !requiresSignIn ||
      !(event.target instanceof Element) ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    const interactiveElement = event.target.closest(INTERACTIVE_SELECTOR);
    if (
      !interactiveElement ||
      !event.currentTarget.contains(interactiveElement) ||
      interactiveElement.closest(AUTH_BYPASS_SELECTOR)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    model.onSignIn();
  }

  function requestSignInForSignedOutSubmit(event: FormEvent<HTMLElement>) {
    if (!requiresSignIn) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    model.onSignIn();
  }

  return (
    <main
      className={`notebook-shell ${model.isNotebookListVisible ? "notebook-shell-gallery" : "notebook-shell-detail"}`}
      onClickCapture={requestSignInForSignedOutAction}
      onKeyDownCapture={requestSignInForSignedOutKey}
      onSubmitCapture={requestSignInForSignedOutSubmit}
    >
      <div className="notebook-ribbon">
        AI-Guided Diagnostics / Restorative Therapeutics / Always-on Care
      </div>
      <header className="notebook-topbar">
        <div className="brand-cluster" aria-label="Fountain Life Notebook">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="brand-wordmark">Fountain Life</span>
          </div>
          <div>
            <p className="notebook-eyebrow">Member intelligence notebook</p>
            {model.activeNotebook ? (
              <h1
                role="button"
                tabIndex={0}
                aria-label={`Rename ${model.activeNotebook.title}`}
                onClick={() => model.onEditNotebook(model.activeNotebook!.id)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }

                  event.preventDefault();
                  model.onEditNotebook(model.activeNotebook!.id);
                }}
              >
                {model.activeNotebook.title}
              </h1>
            ) : (
              <h1>
                Detect. Prevent. <em>Reverse.</em>
              </h1>
            )}
          </div>
        </div>
        <div className="notebook-session" data-auth-bypass="true">
          <span className={`auth-pill auth-pill-${model.authState.status}`}>
            {authStatusLabel}
          </span>
          {model.activeNotebook?.role === "owner" ? (
            <button
              type="button"
              className="ghost-button"
              onClick={model.onStartInviteMember}
            >
              Add user
            </button>
          ) : null}
          {model.authState.status === "authenticated" ? (
            <button
              type="button"
              className="ghost-button"
              onClick={model.onSignOut}
            >
              Sign out
            </button>
          ) : (
            <button type="button" onClick={model.onSignIn}>
              Sign in
            </button>
          )}
        </div>
      </header>

      {model.isNotebookListVisible ? (
        <NotebookGallery model={model} />
      ) : (
        <NotebookDetail model={model} />
      )}
      <footer className="notebook-footer" aria-label="Application version">
        <span>Fountain Life Notebook {APP_VERSION}</span>
        <span>&copy; 2026 Fountain Life</span>
      </footer>
      {model.editingNotebook ? <NotebookEditor model={model} /> : null}
      {model.isInviteMemberVisible ? <NotebookInviteDialog model={model} /> : null}
    </main>
  );
}

function NotebookGallery({ model }: { model: NotebookWorkspaceModel }) {
  const visibleNotebooks = filterNotebooks(
    model.notebooks,
    model.notebookSearch,
  );
  const recentNotebooks = orderNotebooksByMostRecent(visibleNotebooks);
  const requiresSignIn = shouldRequestSignIn(model.authState.status);
  const isAuthLoading = model.authState.status === "loading";
  const createNotebookLabel = requiresSignIn
    ? "Sign in to create notebook"
    : "Create notebook";

  return (
    <>
      {requiresSignIn ? (
        <section className="sign-in-callout" aria-live="polite">
          <div>
            <strong>You are signed out</strong>
            <span>Sign in to view notebooks or create a new one.</span>
          </div>
          <button type="button" onClick={model.onSignIn}>
            Sign in
          </button>
        </section>
      ) : null}

      <section
        className="notebook-gallery-toolbar"
        aria-label="Notebook controls"
      >
        <label className="notebook-search">
          <span>Search notebooks</span>
          <input
            readOnly={requiresSignIn}
            type="search"
            value={model.notebookSearch}
            placeholder={
              requiresSignIn ? "Sign in to search notebooks" : "Search notebooks"
            }
            onChange={(event) =>
              model.onNotebookSearchChange(event.currentTarget.value)
            }
          />
        </label>
        <button
          type="button"
          disabled={isAuthLoading}
          onClick={model.onCreateNotebook}
        >
          {requiresSignIn ? createNotebookLabel : `+ ${createNotebookLabel}`}
        </button>
      </section>

      {model.notebooksError ? (
        <p className="inline-error">{model.notebooksError}</p>
      ) : null}
      {model.operationError ? (
        <p className="inline-error">{model.operationError}</p>
      ) : null}

      <section
        className="notebook-card-section"
        aria-labelledby="recent-notebooks-heading"
      >
        <div className="section-heading">
          <h2 id="recent-notebooks-heading">Recent notebooks</h2>
        </div>
        <div className="notebook-card-grid">
          <button
            type="button"
            className={`create-notebook-card ${
              requiresSignIn ? "create-notebook-card-auth" : ""
            }`}
            disabled={isAuthLoading}
            onClick={model.onCreateNotebook}
          >
            <span aria-hidden="true">+</span>
            <strong>
              {requiresSignIn
                ? "Sign in to create notebook"
                : "Create new notebook"}
            </strong>
          </button>
          {recentNotebooks.map((notebook) => (
            <NotebookCard key={notebook.id} model={model} notebook={notebook} />
          ))}
          {recentNotebooks.length === 0 ? (
            <p className="empty-state">
              {model.isNotebooksLoading
                ? "Loading notebooks."
                : "Create a notebook to start adding sources."}
            </p>
          ) : null}
        </div>
      </section>
      <div data-auth-bypass="true">
        <StepAwayFlow className="gallery-step-away" />
      </div>
    </>
  );
}

function NotebookCard({
  model,
  notebook,
}: {
  model: NotebookWorkspaceModel;
  notebook: NotebookSummary;
}) {
  return (
    <article className={`notebook-card notebook-card-${notebook.tone}`}>
      <button
        type="button"
        className="notebook-card-open"
        aria-label={`Open ${notebook.title}`}
        onClick={() => model.onSelectNotebook(notebook.id)}
      >
        <span className="notebook-card-icon" aria-hidden="true" />
        <span className="notebook-card-category">{notebook.category}</span>
        <strong>{notebook.title}</strong>
        <small>{notebook.description}</small>
        <span className="notebook-card-meta">
          {formatNotebookDate(notebook.createdDateUtc)} /{" "}
          {model.sourceCountsByNotebookId[notebook.id] ?? 0} sources
          {model.insightCountsByNotebookId[notebook.id]
            ? ` / ${model.insightCountsByNotebookId[notebook.id]} insights`
            : ""}
        </span>
      </button>
      <details className="notebook-card-menu">
        <summary aria-label={`${notebook.title} actions`}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </summary>
        <div className="notebook-card-menu-popover">
          <button
            type="button"
            onClick={() => model.onSelectNotebook(notebook.id)}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => model.onEditNotebook(notebook.id)}
          >
            Rename
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => model.onDeleteNotebook(notebook.id)}
          >
            Delete
          </button>
        </div>
      </details>
    </article>
  );
}

function NotebookDetail({ model }: { model: NotebookWorkspaceModel }) {
  const [activeWorkspaceSection, setActiveWorkspaceSection] =
    useState("notebook-sources");
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const selectedCount = model.selectedDocumentIds.length;
  const allDocumentsSelected =
    model.documents.length > 0 && selectedCount === model.documents.length;
  const isViewingDocument = Boolean(model.activeDocumentId);
  const requiresSignIn = shouldRequestSignIn(model.authState.status);
  const isAuthLoading = model.authState.status === "loading";
  const chatContextLabel = model.conversationId
    ? "Active thread"
    : (model.activeNotebook?.category ?? "New thread");
  const canAsk =
    model.authState.status === "authenticated" &&
    model.question.trim().length > 0 &&
    !model.isAsking;

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requiresSignIn) {
      model.onSignIn();
      return;
    }

    model.onAskQuestion();
  }

  function submitQuestionFromKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.nativeEvent.isComposing ||
      !isDesktopInputDevice()
    ) {
      return;
    }

    event.preventDefault();
    if (requiresSignIn) {
      model.onSignIn();
      return;
    }

    if (canAsk) {
      model.onAskQuestion();
    }
  }

  function showWorkspaceSection(sectionId: string) {
    setActiveWorkspaceSection(sectionId);
  }

  useLayoutEffect(() => {
    const questionInput = questionInputRef.current;
    if (!questionInput) {
      return;
    }

    questionInput.style.height = "auto";
    questionInput.style.height = `${questionInput.scrollHeight}px`;
  }, [model.question]);

  return (
    <>
      <section className="notebook-actionbar" aria-label="Notebook actions">
        <button
          type="button"
          className="ghost-button"
          onClick={model.onBackToNotebooks}
        >
          All notebooks
        </button>
        <button type="button" onClick={model.onCreateNotebook}>
          + Create notebook
        </button>
      </section>

      <nav
        className="mobile-workspace-tabs"
        aria-label="Notebook workspace sections"
      >
        <button
          type="button"
          aria-current={
            activeWorkspaceSection === "notebook-sources" ? "page" : undefined
          }
          className={
            activeWorkspaceSection === "notebook-sources" ? "active" : undefined
          }
          aria-controls="notebook-sources"
          onClick={() => showWorkspaceSection("notebook-sources")}
        >
          Sources
        </button>
        <button
          type="button"
          aria-current={
            activeWorkspaceSection === "notebook-chat" ? "page" : undefined
          }
          className={
            activeWorkspaceSection === "notebook-chat" ? "active" : undefined
          }
          aria-controls="notebook-chat"
          onClick={() => showWorkspaceSection("notebook-chat")}
        >
          Chat
        </button>
        <button
          type="button"
          aria-current={
            activeWorkspaceSection === "notebook-studio" ? "page" : undefined
          }
          className={
            activeWorkspaceSection === "notebook-studio" ? "active" : undefined
          }
          aria-controls="notebook-studio"
          onClick={() => showWorkspaceSection("notebook-studio")}
        >
          Studio
        </button>
      </nav>

      <section className="insight-strip" aria-label="Notebook status overview">
        <div>
          <span>{model.documents.length}</span>
          <p>Uploaded sources</p>
        </div>
        <div>
          <span>{selectedCount || "All"}</span>
          <p>Selected for review</p>
        </div>
        <div>
          <span>{model.messages.length}</span>
          <p>Thread insights</p>
        </div>
        <div>
          <span>{model.activeNotebook?.members.length ?? 1}</span>
          <p>Workspace users</p>
        </div>
      </section>

      <section className="notebook-layout" aria-label="Notebook workspace">
        <aside
          className={`document-panel workspace-panel ${activeWorkspaceSection === "notebook-sources" ? "active" : ""}`}
          id="notebook-sources"
          aria-label="Document library"
        >
          <div className="panel-heading">
            <div>
              <p>Sources</p>
              <h2>Member documents</h2>
            </div>
          </div>

          <label className="upload-target">
            <input
              accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
              disabled={requiresSignIn || isAuthLoading}
              multiple
              type="file"
              onChange={(event) => {
                model.onUploadFiles(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
            <span>
              {model.isUploading ? "Uploading..." : "Upload source files"}
            </span>
            <small>PDF, TXT, Markdown</small>
          </label>

          <div
            className="source-search-shell"
            aria-label="Source search features in progress"
          >
            <span className="source-search-heading">
              Search the web for new sources
            </span>
            <div>
              {["Web", "Fast Research"].map((featureName) => (
                <button
                  type="button"
                  className="source-search-option"
                  key={featureName}
                  onClick={() => model.onUnavailableFeature(featureName)}
                >
                  <span>{featureName}</span>
                </button>
              ))}
            </div>
          </div>

          {model.documentsError ? (
            <p className="inline-error">{model.documentsError}</p>
          ) : null}

          {model.documents.length > 0 ? (
            <label className="document-select-all">
              <input
                aria-label="Select all documents"
                checked={allDocumentsSelected}
                disabled={isAuthLoading}
                type="checkbox"
                onChange={() => {
                  if (requiresSignIn) {
                    model.onSignIn();
                    return;
                  }

                  model.onToggleEveryDocument();
                }}
              />
              <span>Select all</span>
            </label>
          ) : null}

          <div className="document-list" aria-busy={model.isDocumentsLoading}>
            {model.documents.length === 0 ? (
              <p className="empty-state">
                {model.isDocumentsLoading
                  ? "Loading member documents."
                  : "Saved sources will appear here."}
              </p>
            ) : (
              model.documents.map((document) => {
                const isSelected = model.selectedDocumentIds.includes(
                  document.id,
                );
                const isDeletingThisDocument =
                  model.isDeleting && model.deleteDocumentId === document.id;

                return (
                  <article
                    className={`document-row ${isSelected ? "selected" : ""}`}
                    key={document.id}
                  >
                    <label className="document-row-select">
                      <input
                        aria-label={`Select ${document.originalFileName}`}
                        checked={isSelected}
                        type="checkbox"
                        onChange={() => {
                          if (requiresSignIn) {
                            model.onSignIn();
                            return;
                          }

                          model.onToggleDocument(document.id);
                        }}
                      />
                    </label>
                    <div className="document-row-copy">
                      <strong title={document.originalFileName}>
                        {document.originalFileName}
                      </strong>
                      <small>{formatBytes(document.byteSize)}</small>
                    </div>
                    <details className="document-row-menu">
                      <summary aria-label={`Source actions for ${document.originalFileName}`}>
                        <span aria-hidden="true">⋮</span>
                      </summary>
                      <button
                        type="button"
                        className="document-menu-item danger-button"
                        disabled={isAuthLoading || isDeletingThisDocument}
                        onClick={() => {
                          if (requiresSignIn) {
                            model.onSignIn();
                            return;
                          }

                          model.onDeleteDocument(document.id);
                        }}
                      >
                        {isDeletingThisDocument ? "Deleting" : "Delete"}
                      </button>
                    </details>
                  </article>
                );
              })
            )}
          </div>
          <div data-auth-bypass="true">
            <StepAwayFlow className="document-step-away" />
          </div>
        </aside>

        <section
          className={`chat-panel workspace-panel ${activeWorkspaceSection === "notebook-chat" ? "active" : ""}`}
          id="notebook-chat"
          aria-label="Notebook chat"
        >
          <div className="panel-heading">
            <div>
              <p>
                {isViewingDocument
                  ? (model.activeDocument?.originalFileName ?? "Opening source")
                  : chatContextLabel}
              </p>
              <h2>{isViewingDocument ? "Document" : "Chat"}</h2>
            </div>
            <div className="panel-heading-actions">
              {isViewingDocument ? (
                <button
                  type="button"
                  className="ghost-button compact-button"
                  onClick={model.onShowChat}
                >
                  Chat
                </button>
              ) : null}
              <button
                type="button"
                className="ghost-button compact-button"
                onClick={model.onNewThread}
              >
                New thread
              </button>
            </div>
          </div>

          {isViewingDocument ? (
            <DocumentReader model={model} />
          ) : (
            <div className="message-list" aria-live="polite">
              {model.messages.length === 0 && model.documents.length === 0 ? (
                <div className="empty-state tall-empty notebook-empty-workspace">
                  <strong>Create a clinical overview from your sources</strong>
                  <span>
                    Upload member records, labs, reports, or notes to start a
                    Fountain Life notebook.
                  </span>
                  <div className="drop-zone-preview">
                    <p>or drop your files</p>
                    <small>PDF, TXT, Markdown</small>
                    <label>
                      <input
                        accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                        disabled={requiresSignIn || isAuthLoading}
                        multiple
                        type="file"
                        onChange={(event) => {
                          model.onUploadFiles(event.currentTarget.files);
                          event.currentTarget.value = "";
                        }}
                      />
                      <span>Upload files</span>
                    </label>
                  </div>
                </div>
              ) : model.messages.length === 0 ? (
                <p className="empty-state chat-empty-hint">
                  Ask questions here about your files.
                </p>
              ) : (
                model.messages.map((message, index) => (
                  <article
                    className={`chat-message chat-message-${message.role}`}
                    key={`${message.messageId ?? message.conversationId}-${index}`}
                  >
                    <span>{message.role}</span>
                    <p>{message.text}</p>
                    {message.citations?.length ? (
                      <ol className="citation-list">
                        {message.citations.map((citation, citationIndex) => (
                          <li
                            key={`${citation.documentId}-${citation.chunkIndex}-${citationIndex}`}
                          >
                            <button
                              type="button"
                              className="citation-source-button"
                              onClick={() => {
                                model.onOpenDocument(citation.documentId);
                                showWorkspaceSection("notebook-chat");
                              }}
                            >
                              [{citationIndex + 1}] {citation.documentName}
                            </button>
                            <p>{citation.snippet}</p>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          )}

          {model.statusText ? (
            <p className="status-line">{model.statusText}</p>
          ) : null}
          {model.operationError ? (
            <p className="inline-error">{model.operationError}</p>
          ) : null}

          {isViewingDocument ? null : (
            <form className="question-box" onSubmit={submitQuestion}>
              <textarea
                ref={questionInputRef}
                value={model.question}
                placeholder={
                  selectedCount > 0
                    ? `Ask Zori across ${selectedCount} selected document${selectedCount === 1 ? "" : "s"}`
                    : "Ask Zori across this notebook's uploaded documents"
                }
                rows={3}
                onChange={(event) =>
                  model.onQuestionChange(event.currentTarget.value)
                }
                onKeyDown={submitQuestionFromKeyboard}
              />
              <button
                type="submit"
                disabled={isAuthLoading || (!requiresSignIn && !canAsk)}
              >
                {requiresSignIn
                  ? "Sign in to ask"
                  : model.isAsking
                    ? "Answering"
                    : "Ask"}
              </button>
            </form>
          )}
        </section>

        <aside
          className={`studio-panel workspace-panel ${activeWorkspaceSection === "notebook-studio" ? "active" : ""}`}
          id="notebook-studio"
          aria-label="Notebook studio"
        >
          <div className="panel-heading">
            <div>
              <p>Studio</p>
              <h2>Outputs</h2>
            </div>
          </div>
          <div className="studio-grid">
            {STUDIO_ACTIONS.map((item) => (
              <button
                type="button"
                className="studio-action"
                key={item}
                onClick={() => model.onUnavailableFeature(item)}
              >
                <span className="studio-action-dot" aria-hidden="true" />
                <span className="studio-action-label">{item}</span>
              </button>
            ))}
          </div>
          {model.activeUnavailableFeature ? (
            <UnavailableFeatureNotice model={model} />
          ) : null}
          <div className="studio-empty">
            <strong>Studio output will be saved here.</strong>
            <span>
              After adding sources, create overviews, study guides, and
              care-plan artifacts.
            </span>
          </div>
          <button
            type="button"
            className="studio-note-button"
            onClick={() => model.onUnavailableFeature("Add note")}
          >
            Add note
          </button>
        </aside>
      </section>
    </>
  );
}

function DocumentReader({ model }: { model: NotebookWorkspaceModel }) {
  if (model.isDocumentLoading) {
    return (
      <p className="empty-state document-reader-empty">
        Loading source document.
      </p>
    );
  }

  if (model.activeDocumentError) {
    return <p className="inline-error">{model.activeDocumentError}</p>;
  }

  if (!model.activeDocument) {
    return (
      <p className="empty-state document-reader-empty">
        Select a source to read its extracted text.
      </p>
    );
  }

  return (
    <article
      className="document-reader"
      aria-label={`Document reader for ${model.activeDocument.originalFileName}`}
    >
      <header className="document-reader-header">
        <div>
          <strong>{model.activeDocument.originalFileName}</strong>
          <span>
            {formatBytes(model.activeDocument.byteSize)} /{" "}
            {model.activeDocument.chunkCount} chunks /{" "}
            {model.activeDocument.contentType}
          </span>
        </div>
      </header>
      <div className="document-reader-body">
        {model.activeDocument.chunks.length === 0 ? (
          <p className="empty-state document-reader-empty">
            No extracted text is available for this source.
          </p>
        ) : (
          model.activeDocument.chunks.map((chunk) => (
            <section className="document-reader-section" key={chunk.chunkIndex}>
              <span>Section {chunk.chunkIndex + 1}</span>
              <p>{chunk.text}</p>
            </section>
          ))
        )}
      </div>
    </article>
  );
}

function UnavailableFeatureNotice({
  model,
}: {
  model: NotebookWorkspaceModel;
}) {
  const featureDescription =
    STUDIO_FEATURE_DESCRIPTIONS[model.activeUnavailableFeature ?? ""] ??
    "This planned feature will create a source-grounded output from the selected files.";

  return (
    <section
      className="unavailable-feature-popover"
      role="status"
      aria-live="polite"
    >
      <div>
        <p>{model.activeUnavailableFeature}</p>
        <strong>{featureDescription}</strong>
      </div>
      <span>This feature is not implemented yet.</span>
      <span>
        For now, try uploading documents, asking questions about them, deleting
        documents, or adding users.
      </span>
      <button
        type="button"
        className="ghost-button compact-button"
        onClick={model.onDismissUnavailableFeature}
      >
        Close
      </button>
    </section>
  );
}

function NotebookEditor({ model }: { model: NotebookWorkspaceModel }) {
  function submitNotebook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    model.onSaveNotebook();
  }

  return (
    <div className="notebook-editor-backdrop" role="presentation">
      <form
        className="notebook-editor"
        aria-label="Edit notebook"
        onSubmit={submitNotebook}
      >
        <div className="panel-heading">
          <div>
            <p>Notebook settings</p>
            <h2>Rename notebook</h2>
          </div>
          <button
            type="button"
            className="ghost-button compact-button"
            onClick={model.onCancelEditNotebook}
          >
            Close
          </button>
        </div>
        <label>
          <span>Title</span>
          <input
            value={model.notebookDraft.title}
            onChange={(event) =>
              model.onNotebookDraftChange({
                ...model.notebookDraft,
                title: event.currentTarget.value,
              })
            }
          />
        </label>
        <label>
          <span>Category</span>
          <input
            value={model.notebookDraft.category}
            onChange={(event) =>
              model.onNotebookDraftChange({
                ...model.notebookDraft,
                category: event.currentTarget.value,
              })
            }
          />
        </label>
        <label>
          <span>Description</span>
          <textarea
            rows={3}
            value={model.notebookDraft.description}
            onChange={(event) =>
              model.onNotebookDraftChange({
                ...model.notebookDraft,
                description: event.currentTarget.value,
              })
            }
          />
        </label>
        <div className="notebook-editor-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={model.onCancelEditNotebook}
          >
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}

function NotebookInviteDialog({ model }: { model: NotebookWorkspaceModel }) {
  const requiresSignIn = shouldRequestSignIn(model.authState.status);
  const isAuthLoading = model.authState.status === "loading";
  const isLocalSession = isLocalAuthSession(model.authState);

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLocalSession) {
      return;
    }

    if (requiresSignIn) {
      model.onSignIn();
      return;
    }

    model.onSendInvite();
  }

  return (
    <div className="notebook-editor-backdrop" role="presentation">
      <form
        className="notebook-editor"
        aria-label="Invite workspace user"
        onSubmit={submitInvite}
      >
        <div className="panel-heading">
          <div>
            <p>Workspace access</p>
            <h2>Add user</h2>
          </div>
          <button
            type="button"
            className="ghost-button compact-button"
            onClick={model.onCancelInviteMember}
          >
            Close
          </button>
        </div>
        {isLocalSession ? (
          <>
            <div className="notebook-local-resource-message">
              <p>
                Adding users is only available in the deployed resource.
              </p>
              <a
                href={DEPLOYED_FRONTEND_URL}
                target="_blank"
                rel="noreferrer"
              >
                Open deployed Fountain Life Notebook
              </a>
            </div>
            <div className="notebook-editor-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={model.onCancelInviteMember}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                type="email"
                value={model.notebookInviteDraft.email}
                onChange={(event) =>
                  model.onInviteDraftChange({
                    ...model.notebookInviteDraft,
                    email: event.currentTarget.value,
                  })
                }
              />
            </label>
            <label>
              <span>Role</span>
              <select
                value={model.notebookInviteDraft.role}
                onChange={(event) => {
                  const role = parseInviteRole(event.currentTarget.value);
                  if (!role) {
                    return;
                  }

                  model.onInviteDraftChange({
                    ...model.notebookInviteDraft,
                    role,
                  });
                }}
              >
                {INVITE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatRole(role)}
                  </option>
                ))}
              </select>
            </label>
            <div className="notebook-member-list" aria-label="Workspace members">
              {(model.activeNotebook?.members ?? []).map((member, index) => (
                <span
                  key={`${member.email ?? member.userId ?? "member"}-${member.role}-${index}`}
                >
                  <strong>{member.email ?? "Signed-in member"}</strong>
                  <small>
                    {formatRole(member.role)} · {formatMemberStatus(member.status)}
                  </small>
                </span>
              ))}
            </div>
            <div className="notebook-editor-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={model.onCancelInviteMember}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isAuthLoading ||
                  (!requiresSignIn &&
                    (model.isInvitingMember ||
                      model.notebookInviteDraft.email.trim().length === 0))
                }
              >
                {requiresSignIn
                  ? "Sign in to invite"
                  : model.isInvitingMember
                    ? "Inviting"
                    : "Send invite"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function parseInviteRole(value: string): NotebookInviteDraft["role"] | undefined {
  return INVITE_ROLES.find((role) => role === value);
}

function formatRole(role: string) {
  return role.charAt(0).toLocaleUpperCase() + role.slice(1);
}

function formatMemberStatus(status: string) {
  return status.charAt(0).toLocaleUpperCase() + status.slice(1);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
