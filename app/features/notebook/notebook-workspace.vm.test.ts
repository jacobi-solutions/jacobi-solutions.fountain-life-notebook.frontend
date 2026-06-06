import { describe, expect, it } from "vitest";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import type { DocumentSummary } from "../../services/documents-service";
import {
  addSelectedDocumentId,
  appendThreadUpdate,
  createNotebookQuestionRequest,
  normalizeSelectedDocumentIds,
  toErrorMessage,
  toggleDocumentSelection,
  toggleEveryDocumentSelection,
} from "./notebook-workspace.vm";

describe("notebook workspace view model", () => {
  it("normalizes selected document ids against the current document list", () => {
    expect(
      normalizeSelectedDocumentIds([" document-1 ", "missing", "document-1"], documents),
    ).toEqual(["document-1"]);
  });

  it("toggles individual and all document selections without retaining stale ids", () => {
    expect(toggleDocumentSelection(["document-1"], "document-1")).toEqual([]);
    expect(toggleDocumentSelection([], "document-2")).toEqual(["document-2"]);
    expect(toggleEveryDocumentSelection(["stale-document"], documents)).toEqual([
      "document-1",
      "document-2",
    ]);
    expect(toggleEveryDocumentSelection(["document-1", "document-2"], documents)).toEqual([]);
  });

  it("adds uploaded documents to the current selection once", () => {
    expect(addSelectedDocumentId(["document-1"], "document-1")).toEqual(["document-1"]);
    expect(addSelectedDocumentId(["document-1"], "document-2")).toEqual([
      "document-1",
      "document-2",
    ]);
  });

  it("creates trimmed assistant requests and omits empty document filters", () => {
    expect(
      createNotebookQuestionRequest({
        conversationId: "conversation-1",
        question: "  What happens first?  ",
        selectedDocumentIds: ["document-1", "document-1"],
      }),
    ).toEqual({
      conversationId: "conversation-1",
      documentIds: ["document-1"],
      message: "What happens first?",
    });
    expect(
      createNotebookQuestionRequest({
        question: "   ",
        selectedDocumentIds: [],
      }),
    ).toBeUndefined();
  });

  it("appends only message updates to the visible chat transcript", () => {
    const statusUpdate = {
      conversationId: "conversation-1",
      role: "system",
      text: "Searching.",
      type: "status",
    } as AssistantThreadUpdate;
    const messageUpdate = {
      conversationId: "conversation-1",
      role: "assistant",
      text: "Answer.",
      type: "message",
    } as AssistantThreadUpdate;

    expect(appendThreadUpdate([], statusUpdate)).toEqual([]);
    expect(appendThreadUpdate([], messageUpdate)).toEqual([messageUpdate]);
  });

  it("normalizes unknown errors to an optional fallback message", () => {
    expect(toErrorMessage(new Error("Failed"))).toBe("Failed");
    expect(toErrorMessage("failed", "Fallback")).toBe("Fallback");
  });
});

const documents: DocumentSummary[] = [
  {
    byteSize: 10,
    chunkCount: 1,
    contentType: "text/plain",
    createdDateUtc: "2026-01-01T00:00:00.000Z",
    id: "document-1",
    lastUpdatedDateUtc: "2026-01-01T00:00:00.000Z",
    originalFileName: "one.txt",
    status: "ready",
  },
  {
    byteSize: 20,
    chunkCount: 2,
    contentType: "text/plain",
    createdDateUtc: "2026-01-01T00:00:00.000Z",
    id: "document-2",
    lastUpdatedDateUtc: "2026-01-01T00:00:00.000Z",
    originalFileName: "two.txt",
    status: "ready",
  },
];
