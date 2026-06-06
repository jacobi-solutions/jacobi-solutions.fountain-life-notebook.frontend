import type {
  AssistantThreadUpdate,
  SendAssistantMessageRequest,
} from "../../services/assistant-service";
import type { DocumentSummary } from "../../services/documents-service";

export interface NotebookQuestionInput {
  conversationId?: string;
  question: string;
  selectedDocumentIds: string[];
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
  const request: SendAssistantMessageRequest = { message };

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
