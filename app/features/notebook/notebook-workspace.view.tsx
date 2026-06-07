import type { FormEvent } from "react";
import type { NotebookSummary, NotebookWorkspaceModel } from "./notebook-workspace.model";
import {
  filterNotebooks,
  formatNotebookDate,
  orderNotebooksByMostRecent,
} from "./notebook-workspace.vm";

export function NotebookWorkspaceView(model: NotebookWorkspaceModel) {
  return (
    <main className="notebook-shell">
      <div className="notebook-ribbon">AI-Guided Diagnostics / Restorative Therapeutics / Always-on Care</div>
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
            <button type="button" className="ghost-button" onClick={model.onSignOut}>
              Sign out
            </button>
          ) : (
            <button type="button" onClick={model.onSignIn}>
              Sign in
            </button>
          )}
        </div>
      </header>

      {model.isNotebookListVisible ? <NotebookGallery model={model} /> : <NotebookDetail model={model} />}
      {model.editingNotebook ? <NotebookEditor model={model} /> : null}
    </main>
  );
}

function NotebookGallery({ model }: { model: NotebookWorkspaceModel }) {
  const visibleNotebooks = filterNotebooks(model.notebooks, model.notebookSearch);
  const featuredNotebooks = visibleNotebooks.filter((notebook) => notebook.featured);
  const recentNotebooks = orderNotebooksByMostRecent(visibleNotebooks);

  return (
    <>
      <section className="notebook-gallery-toolbar" aria-label="Notebook controls">
        <label className="notebook-search">
          <span>Search notebooks</span>
          <input
            type="search"
            value={model.notebookSearch}
            placeholder="Search notebooks"
            onChange={(event) => model.onNotebookSearchChange(event.currentTarget.value)}
          />
        </label>
        <button type="button" onClick={model.onCreateNotebook}>
          + Create notebook
        </button>
      </section>

      {featuredNotebooks.length > 0 ? (
        <NotebookCardSection heading="Featured notebooks" model={model} notebooks={featuredNotebooks} />
      ) : null}

      <section className="notebook-card-section" aria-labelledby="recent-notebooks-heading">
        <div className="section-heading">
          <h2 id="recent-notebooks-heading">Recent notebooks</h2>
        </div>
        <div className="notebook-card-grid">
          <button type="button" className="create-notebook-card" onClick={model.onCreateNotebook}>
            <span aria-hidden="true">+</span>
            <strong>Create new notebook</strong>
          </button>
          {recentNotebooks.map((notebook) => (
            <NotebookCard key={notebook.id} model={model} notebook={notebook} />
          ))}
        </div>
      </section>
    </>
  );
}

function NotebookCardSection({
  heading,
  model,
  notebooks,
}: {
  heading: string;
  model: NotebookWorkspaceModel;
  notebooks: NotebookSummary[];
}) {
  const headingId = `${heading.replace(/\s/g, "-").toLocaleLowerCase()}-heading`;

  return (
    <section className="notebook-card-section" aria-labelledby={headingId}>
      <div className="section-heading">
        <h2 id={headingId}>{heading}</h2>
      </div>
      <div className="notebook-card-grid">
        {notebooks.map((notebook) => (
          <NotebookCard key={notebook.id} model={model} notebook={notebook} />
        ))}
      </div>
    </section>
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
          {formatNotebookDate(notebook.createdDateUtc)} / {model.sourceCountsByNotebookId[notebook.id] ?? 0} sources
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
          <button type="button" onClick={() => model.onSelectNotebook(notebook.id)}>
            Open
          </button>
          <button type="button" onClick={() => model.onEditNotebook(notebook.id)}>
            Rename
          </button>
          <button type="button" onClick={() => model.onDuplicateNotebook(notebook.id)}>
            Duplicate
          </button>
          <button type="button" className="danger-button" onClick={() => model.onDeleteNotebook(notebook.id)}>
            Delete
          </button>
        </div>
      </details>
    </article>
  );
}

function NotebookDetail({ model }: { model: NotebookWorkspaceModel }) {
  const selectedCount = model.selectedDocumentIds.length;
  const allDocumentsSelected = model.documents.length > 0 && selectedCount === model.documents.length;
  const canAsk =
    model.authState.status === "authenticated" &&
    model.question.trim().length > 0 &&
    !model.isAsking;

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    model.onAskQuestion();
  }

  return (
    <>
      <section className="notebook-actionbar" aria-label="Notebook actions">
        <button type="button" className="ghost-button" onClick={model.onBackToNotebooks}>
          All notebooks
        </button>
        {model.activeNotebook ? (
          <button type="button" className="ghost-button" onClick={() => model.onEditNotebook(model.activeNotebook!.id)}>
            Rename
          </button>
        ) : null}
        <button type="button" onClick={model.onCreateNotebook}>
          + Create notebook
        </button>
      </section>

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
          <span>Zori</span>
          <p>Medical expert mode</p>
        </div>
      </section>

      <section className="notebook-layout" aria-label="Notebook workspace">
        <aside className="document-panel" aria-label="Document library">
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
            <span>{model.isUploading ? "Uploading..." : "Upload source files"}</span>
            <small>PDF, TXT, Markdown</small>
          </label>

          <div className="source-search-shell" aria-hidden="true">
            <span>Search the web for new sources</span>
            <div>
              <small>Web</small>
              <small>Fast Research</small>
            </div>
          </div>

          {model.documentsError ? <p className="inline-error">{model.documentsError}</p> : null}

          <div className="document-list" aria-busy={model.isDocumentsLoading}>
            {model.documents.length === 0 ? (
              <p className="empty-state">
                {model.isDocumentsLoading ? "Loading member documents." : "Saved sources will appear here."}
              </p>
            ) : (
              model.documents.map((document) => {
                const isSelected = model.selectedDocumentIds.includes(document.id);
                const isDeletingThisDocument = model.isDeleting && model.deleteDocumentId === document.id;

                return (
                  <article className={`document-row ${isSelected ? "selected" : ""}`} key={document.id}>
                    <label>
                      <input
                        checked={isSelected}
                        type="checkbox"
                        onChange={() => model.onToggleDocument(document.id)}
                      />
                      <span>
                        <strong>{document.originalFileName}</strong>
                        <small>
                          {formatBytes(document.byteSize)} / {document.chunkCount} chunks
                        </small>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="ghost-button danger-button compact-button"
                      disabled={isDeletingThisDocument}
                      onClick={() => model.onDeleteDocument(document.id)}
                    >
                      {isDeletingThisDocument ? "Deleting" : "Delete"}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </aside>

        <section className="chat-panel" aria-label="Notebook chat">
          <div className="panel-heading">
            <div>
              <p>{model.conversationId ?? model.activeNotebook?.category ?? "New thread"}</p>
              <h2>Chat</h2>
            </div>
            <button type="button" className="ghost-button compact-button" onClick={model.onNewThread}>
              New thread
            </button>
          </div>

          <div className="message-list" aria-live="polite">
            {model.messages.length === 0 ? (
              <div className="empty-state tall-empty notebook-empty-workspace">
                <strong>Create a clinical overview from your sources</strong>
                <span>Upload member records, labs, reports, or notes to start a Fountain Life notebook.</span>
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
                        <li key={`${citation.documentId}-${citation.chunkIndex}-${citationIndex}`}>
                          <strong>
                            [{citationIndex + 1}] {citation.documentName}
                          </strong>
                          <p>{citation.snippet}</p>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </article>
              ))
            )}
          </div>

          {model.statusText ? <p className="status-line">{model.statusText}</p> : null}
          {model.operationError ? <p className="inline-error">{model.operationError}</p> : null}

          <form className="question-box" onSubmit={submitQuestion}>
            <textarea
              value={model.question}
              placeholder={
                selectedCount > 0
                  ? `Ask Zori across ${selectedCount} selected document${selectedCount === 1 ? "" : "s"}`
                  : "Ask Zori across all uploaded documents"
              }
              rows={3}
              onChange={(event) => model.onQuestionChange(event.currentTarget.value)}
            />
            <button type="submit" disabled={!canAsk}>
              {model.isAsking ? "Answering" : "Ask"}
            </button>
          </form>
        </section>

        <aside className="studio-panel" aria-label="Notebook studio">
          <div className="panel-heading">
            <div>
              <p>Studio</p>
              <h2>Outputs</h2>
            </div>
          </div>
          <div className="studio-grid">
            {["Audio Overview", "Slide Deck", "Mind Map", "Reports", "Flashcards", "Quiz", "Data Table"].map(
              (item) => (
                <button type="button" className="studio-action" key={item}>
                  <span aria-hidden="true" />
                  {item}
                </button>
              ),
            )}
          </div>
          <div className="studio-empty">
            <strong>Studio output will be saved here.</strong>
            <span>After adding sources, create overviews, study guides, and care-plan artifacts.</span>
          </div>
          <button type="button" className="studio-note-button">
            Add note
          </button>
        </aside>
      </section>
    </>
  );
}

function NotebookEditor({ model }: { model: NotebookWorkspaceModel }) {
  function submitNotebook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    model.onSaveNotebook();
  }

  return (
    <div className="notebook-editor-backdrop" role="presentation">
      <form className="notebook-editor" aria-label="Edit notebook" onSubmit={submitNotebook}>
        <div className="panel-heading">
          <div>
            <p>Notebook settings</p>
            <h2>Rename notebook</h2>
          </div>
          <button type="button" className="ghost-button compact-button" onClick={model.onCancelEditNotebook}>
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
          <button type="button" className="ghost-button" onClick={model.onCancelEditNotebook}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
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
