import type { FormEvent } from "react";
import type { NotebookWorkspaceModel } from "./notebook-workspace.model";

export function NotebookWorkspaceView(model: NotebookWorkspaceModel) {
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
            <h1>
              Detect. Prevent. <em>Reverse.</em>
            </h1>
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
              <p>Source library</p>
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

          {model.documentsError ? <p className="inline-error">{model.documentsError}</p> : null}

          <div className="document-list" aria-busy={model.isDocumentsLoading}>
            {model.documents.length === 0 ? (
              <p className="empty-state">
                {model.isDocumentsLoading ? "Loading member documents." : "No member documents yet."}
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
              <p>{model.conversationId ?? "New thread"}</p>
              <h2>Healthspan briefing</h2>
            </div>
            <button type="button" className="ghost-button compact-button" onClick={model.onNewThread}>
              New thread
            </button>
          </div>

          <div className="message-list" aria-live="polite">
            {model.messages.length === 0 ? (
              <div className="empty-state tall-empty">
                <strong>Optimize what is ahead.</strong>
                <span>Ask Zori to synthesize the member record when documents are ready.</span>
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
      </section>
    </main>
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
