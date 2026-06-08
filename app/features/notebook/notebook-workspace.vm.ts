import type {
  AssistantThreadUpdate,
  SendAssistantMessageRequest,
} from "../../services/assistant-service";
import type { AuthSnapshot } from "../../services/auth-service";
import type { DocumentSummary } from "../../services/documents-service";
import type { NotebookSummary as PersistedNotebookSummary } from "../../services/notebooks-service";
import type {
  NotebookEditorDraft,
  NotebookInviteDraft,
  NotebookSummary,
  NotebookTone,
} from "./notebook-workspace.model";

export interface NotebookQuestionInput {
  conversationId?: string;
  notebookId?: string;
  question: string;
  selectedDocumentIds: string[];
}

export interface NotebookSessionState {
  conversationId?: string;
  messages: AssistantThreadUpdate[];
  question: string;
  selectedDocumentIds: string[];
  statusText?: string;
}

const NOTEBOOK_TONES: NotebookTone[] = ["aqua", "gold", "graphite", "violet"];

export function shouldRequestSignIn(status: AuthSnapshot["status"]) {
  return status === "signed-out";
}

export function formatAuthStatus(status: AuthSnapshot["status"]) {
  switch (status) {
    case "authenticated":
      return "Signed in";
    case "loading":
      return "Checking sign in";
    case "signed-out":
      return "Signed out";
  }
}

export function createEmptyNotebookSession(): NotebookSessionState {
  return {
    messages: [],
    question: "",
    selectedDocumentIds: [],
  };
}

export function decorateNotebookSummary(
  notebook: PersistedNotebookSummary,
): NotebookSummary {
  return {
    ...notebook,
    tone: NOTEBOOK_TONES[hashString(notebook.id) % NOTEBOOK_TONES.length],
  };
}

export function createNotebookEditorDraft(notebook?: NotebookSummary): NotebookEditorDraft {
  return {
    category: notebook?.category ?? "Member notebook",
    description:
      notebook?.description ??
      "A focused workspace for sources, questions, citations, and Zori insights.",
    title: notebook?.title ?? "",
  };
}

export function createNotebookInviteDraft(): NotebookInviteDraft {
  return {
    email: "",
    role: "patient",
  };
}

export function updateNotebookFromDraft(
  notebook: NotebookSummary,
  draft: NotebookEditorDraft,
): NotebookSummary {
  const title = draft.title.trim();

  return {
    ...notebook,
    category: draft.category.trim() || "Member notebook",
    description:
      draft.description.trim() ||
      "A focused workspace for sources, questions, citations, and Zori insights.",
    title: title || notebook.title,
  };
}

export function shouldAutoNameNotebook(notebook?: NotebookSummary) {
  return !notebook || /^untitled notebook/i.test(notebook.title.trim());
}

export function inferNotebookTitleFromPrompt(prompt: string) {
  const words = prompt
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
    .filter((word) => !COMMON_TITLE_WORDS.has(word.toLocaleLowerCase()))
    .slice(0, 5);

  if (words.length === 0) {
    return "Member Intelligence Brief";
  }

  return words
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
    .join(" ");
}

export function filterNotebooks(notebooks: NotebookSummary[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return notebooks;
  }

  return notebooks.filter((notebook) =>
    [notebook.title, notebook.category, notebook.description]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}

export function orderNotebooksByMostRecent(notebooks: NotebookSummary[]) {
  return [...notebooks].sort(
    (first, second) =>
      new Date(second.createdDateUtc).getTime() - new Date(first.createdDateUtc).getTime(),
  );
}

export function formatNotebookDate(createdDateUtc: string) {
  const createdDate = new Date(createdDateUtc);
  if (Number.isNaN(createdDate.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(createdDate);
}

export function getNotebookSourceCount(session: NotebookSessionState, totalDocumentCount: number) {
  return session.selectedDocumentIds.length || totalDocumentCount;
}

export function normalizeSelectedDocumentIds(
  selectedDocumentIds: string[],
  documents: DocumentSummary[],
) {
  const documentIds = new Set(documents.map((document) => document.id));
  return uniqueDocumentIds(selectedDocumentIds).filter((documentId) => documentIds.has(documentId));
}

export function addSelectedDocumentId(selectedDocumentIds: string[], documentId: string) {
  return uniqueDocumentIds([...selectedDocumentIds, documentId]);
}

export function toggleDocumentSelection(selectedDocumentIds: string[], documentId: string) {
  return selectedDocumentIds.includes(documentId)
    ? selectedDocumentIds.filter((selectedId) => selectedId !== documentId)
    : [...selectedDocumentIds, documentId];
}

export function toggleEveryDocumentSelection(
  selectedDocumentIds: string[],
  documents: DocumentSummary[],
) {
  const availableDocumentIds = documents.map((document) => document.id);
  const normalizedSelection = normalizeSelectedDocumentIds(selectedDocumentIds, documents);

  return normalizedSelection.length === availableDocumentIds.length ? [] : availableDocumentIds;
}

export function createNotebookQuestionRequest(
  input: NotebookQuestionInput,
): SendAssistantMessageRequest | undefined {
  const message = input.question.trim();
  if (!message) {
    return undefined;
  }

  const selectedDocumentIds = uniqueDocumentIds(input.selectedDocumentIds);
  if (!input.notebookId) {
    return undefined;
  }

  const request: SendAssistantMessageRequest = { message, notebookId: input.notebookId };

  if (input.conversationId) {
    request.conversationId = input.conversationId;
  }

  if (selectedDocumentIds.length > 0) {
    request.documentIds = selectedDocumentIds;
  }

  return request;
}

export function appendThreadUpdate(
  messages: AssistantThreadUpdate[],
  update: AssistantThreadUpdate,
) {
  return update.type === "message" ? [...messages, update] : messages;
}

export function toErrorMessage(error: unknown, fallback?: string) {
  return error instanceof Error ? error.message : fallback;
}

function uniqueDocumentIds(documentIds: string[]) {
  return Array.from(
    new Set(documentIds.map((documentId) => documentId.trim()).filter(Boolean)),
  );
}

function hashString(value: string) {
  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
}

const COMMON_TITLE_WORDS = new Set([
  "about",
  "across",
  "after",
  "analysis",
  "analyze",
  "brief",
  "build",
  "create",
  "document",
  "documents",
  "does",
  "from",
  "give",
  "health",
  "member",
  "notebook",
  "please",
  "question",
  "review",
  "show",
  "summarize",
  "tell",
  "that",
  "the",
  "this",
  "what",
  "with",
  "zori",
]);
