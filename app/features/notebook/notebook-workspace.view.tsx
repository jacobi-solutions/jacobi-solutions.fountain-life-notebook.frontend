import { useState } from "react";
import type { FormEvent } from "react";
import type {
  NotebookInviteDraft,
  NotebookSummary,
  NotebookWorkspaceModel,
} from "./notebook-workspace.model";
import {
  filterNotebooks,
  formatNotebookDate,
  orderNotebooksByMostRecent,
} from "./notebook-workspace.vm";

const STUDIO_ACTIONS = [
  "Audio Overview",
  "Slide Deck",
  "Mind Map",
  "Reports",
  "Flashcards",
  "Quiz",
  "Data Table",
];

const WORKING_FEATURES = [
  "Upload PDF, TXT, or Markdown source files.",
  "Ask Zori questions across uploaded sources.",
  "Select, clear, and delete source documents.",
  "Create, rename, and delete notebooks.",
  "Start a fresh chat thread inside a notebook.",
];

const APP_VERSION = `v${__APP_VERSION__}`;
const INVITE_ROLES: NotebookInviteDraft["role"][] = [
  "patient",
  "clinician",
  "viewer",
];

export function NotebookWorkspaceView(model: NotebookWorkspaceModel) {
  return (
    <main
      className={`notebook-shell ${model.isNotebookListVisible ? "notebook-shell-gallery" : "notebook-shell-detail"}`}
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
              <h1>{model.activeNotebook.title}</h1>
            ) : (
              <h1>
                Detect. Prevent. <em>Reverse.</em>
              </h1>
            )}
          </div>
        </div>
        <div className="notebook-session">
          <span className={`auth-pill auth-pill-${model.authState.status}`}>
            {model.authState.status}
          </span>
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

  return (
    <>
      <section
        className="notebook-gallery-toolbar"
        aria-label="Notebook controls"
      >
        <label className="notebook-search">
          <span>Search notebooks</span>
          <input
            type="search"
            value={model.notebookSearch}
            placeholder="Search notebooks"
            onChange={(event) =>
              model.onNotebookSearchChange(event.currentTarget.value)
            }
          />
        </label>
        <button type="button" onClick={model.onCreateNotebook}>
          + Create notebook
        </button>
      </section>

      {model.notebooksError ? (
        <p className="inline-error">{model.notebooksError}</p>
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
            className="create-notebook-card"
            onClick={model.onCreateNotebook}
          >
            <span aria-hidden="true">+</span>
            <strong>Create new notebook</strong>
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
  const selectedCount = model.selectedDocumentIds.length;
  const allDocumentsSelected =
    model.documents.length > 0 && selectedCount === model.documents.length;
  const isViewingDocument = Boolean(model.activeDocumentId);
  const canInviteMembers = model.activeNotebook?.role === "owner";
  const canAsk =
    model.authState.status === "authenticated" &&
    model.question.trim().length > 0 &&
    !model.isAsking;

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    model.onAskQuestion();
  }

  function showWorkspaceSection(sectionId: string) {
    setActiveWorkspaceSection(sectionId);
  }

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
        {model.activeNotebook ? (
          <button
            type="button"
            className="ghost-button"
            onClick={() => model.onEditNotebook(model.activeNotebook!.id)}
          >
            Rename
          </button>
        ) : null}
        {canInviteMembers ? (
          <button
            type="button"
            className="ghost-button"
            onClick={model.onStartInviteMember}
          >
            Add user
          </button>
        ) : null}
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
            <button
              type="button"
              className="ghost-button compact-button"
              disabled={model.documents.length === 0}
              onClick={model.onToggleEveryDocument}
            >
              {allDocumentsSelected ? "Clear" : "Select all"}
            </button>
          </div>

          <label className="upload-target">
            <input
              accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
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
                const isOpen = model.activeDocumentId === document.id;
                const isDeletingThisDocument =
                  model.isDeleting && model.deleteDocumentId === document.id;

                return (
                  <article
                    className={`document-row ${isSelected ? "selected" : ""} ${isOpen ? "open" : ""}`}
                    key={document.id}
                  >
                    <label>
                      <input
                        checked={isSelected}
                        type="checkbox"
                        onChange={() => model.onToggleDocument(document.id)}
                      />
                      <span>
                        <strong>{document.originalFileName}</strong>
                        <small>
                          {formatBytes(document.byteSize)} /{" "}
                          {document.chunkCount} chunks
                        </small>
                      </span>
                    </label>
                    <div className="document-row-actions">
                      <button
                        type="button"
                        className="ghost-button compact-button"
                        aria-current={isOpen ? "true" : undefined}
                        onClick={() => {
                          model.onOpenDocument(document.id);
                          showWorkspaceSection("notebook-chat");
                        }}
                      >
                        {isOpen ? "Reading" : "View"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button danger-button compact-button"
                        disabled={isDeletingThisDocument}
                        onClick={() => model.onDeleteDocument(document.id)}
                      >
                        {isDeletingThisDocument ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
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
                  : (model.conversationId ??
                    model.activeNotebook?.category ??
                    "New thread")}
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
              {model.messages.length === 0 ? (
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
              />
              <button type="submit" disabled={!canAsk}>
                {model.isAsking ? "Answering" : "Ask"}
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
  return (
    <section
      className="unavailable-feature-popover"
      role="status"
      aria-live="polite"
    >
      <div>
        <p>{model.activeUnavailableFeature}</p>
        <strong>Sorry. This feature is not implemented yet.</strong>
      </div>
      <span>Please try one of the working features:</span>
      <ul>
        {WORKING_FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
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
  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
            <span key={`${member.email ?? member.userId ?? "member"}-${member.role}-${index}`}>
              {member.email ?? member.userId} / {member.role} / {member.status}
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
              model.isInvitingMember ||
              model.notebookInviteDraft.email.trim().length === 0
            }
          >
            {model.isInvitingMember ? "Inviting" : "Send invite"}
          </button>
        </div>
      </form>
    </div>
  );
}

function parseInviteRole(value: string): NotebookInviteDraft["role"] | undefined {
  return INVITE_ROLES.find((role) => role === value);
}

function formatRole(role: NotebookInviteDraft["role"]) {
  return role.charAt(0).toLocaleUpperCase() + role.slice(1);
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
