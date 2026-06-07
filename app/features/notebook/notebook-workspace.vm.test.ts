import { describe, expect, it } from "vitest";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import type { DocumentSummary } from "../../services/documents-service";
import {
  addSelectedDocumentId,
  appendThreadUpdate,
  createEmptyNotebookSession,
  createNotebookEditorDraft,
  createNotebookQuestionRequest,
  createNotebookSessionMap,
  createNotebookSummary,
  duplicateNotebookSummary,
  filterNotebooks,
  formatNotebookDate,
  getNotebookSourceCount,
  inferNotebookTitleFromPrompt,
  INITIAL_NOTEBOOKS,
  normalizeSelectedDocumentIds,
  orderNotebooksByMostRecent,
  shouldAutoNameNotebook,
  toErrorMessage,
  toggleDocumentSelection,
  toggleEveryDocumentSelection,
  updateNotebookFromDraft,
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

  it("creates new notebooks as untitled empty workspaces", () => {
    const notebook = createNotebookSummary(3, "2026-06-06T12:00:00.000Z");

    expect(notebook.title).toBe("Untitled notebook");
    expect(notebook.category).toBe("New workspace");
    expect(createEmptyNotebookSession()).toEqual({
      messages: [],
      question: "",
      selectedDocumentIds: [],
    });
  });

  it("builds a session map for every notebook", () => {
    expect(Object.keys(createNotebookSessionMap(INITIAL_NOTEBOOKS))).toEqual(
      INITIAL_NOTEBOOKS.map((notebook) => notebook.id),
    );
  });

  it("updates notebook metadata from a trimmed draft", () => {
    const draft = createNotebookEditorDraft({
      ...INITIAL_NOTEBOOKS[0],
      category: "Diagnostics",
      description: "Old description",
      title: "Old title",
    });

    expect(
      updateNotebookFromDraft(INITIAL_NOTEBOOKS[0], {
        ...draft,
        category: "  Labs  ",
        description: "  Updated description  ",
        title: "  Updated title  ",
      }),
    ).toMatchObject({
      category: "Labs",
      description: "Updated description",
      title: "Updated title",
    });
  });

  it("duplicates notebook metadata without carrying the original id or featured flag", () => {
    const duplicatedNotebook = duplicateNotebookSummary(
      INITIAL_NOTEBOOKS[0],
      INITIAL_NOTEBOOKS.length,
      "2026-06-07T12:00:00.000Z",
    );

    expect(duplicatedNotebook.id).not.toBe(INITIAL_NOTEBOOKS[0].id);
    expect(duplicatedNotebook.featured).toBe(false);
    expect(duplicatedNotebook.title).toBe(`${INITIAL_NOTEBOOKS[0].title} Copy`);
  });

  it("filters and orders notebooks for the gallery", () => {
    expect(filterNotebooks(INITIAL_NOTEBOOKS, "care")).toEqual([INITIAL_NOTEBOOKS[1]]);
    expect(orderNotebooksByMostRecent(INITIAL_NOTEBOOKS).map((notebook) => notebook.id)).toEqual([
      "healthspan-diagnostics",
      "care-plan-builder",
      "physician-briefing",
    ]);
  });

  it("formats notebook dates and source counts", () => {
    expect(formatNotebookDate("2026-06-06T12:00:00.000Z")).toBe("Jun 6, 2026");
    expect(
      getNotebookSourceCount(
        {
          ...createEmptyNotebookSession(),
          selectedDocumentIds: ["document-1"],
        },
        4,
      ),
    ).toBe(1);
    expect(getNotebookSourceCount(createEmptyNotebookSession(), 4)).toBe(4);
  });

  it("auto-names untitled notebooks from the first topic prompt", () => {
    expect(shouldAutoNameNotebook(createNotebookSummary(3, "2026-06-06T12:00:00.000Z"))).toBe(true);
    expect(inferNotebookTitleFromPrompt("Summarize cardiovascular risk from the latest labs")).toBe(
      "Cardiovascular Risk Latest Labs",
    );
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
