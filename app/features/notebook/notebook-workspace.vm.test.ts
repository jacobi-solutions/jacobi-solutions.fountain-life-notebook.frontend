import { describe, expect, it } from "vitest";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import type { DocumentSummary } from "../../services/documents-service";
import {
  addSelectedDocumentId,
  appendThreadUpdate,
  createEmptyNotebookSession,
  createNotebookEditorDraft,
  createNotebookQuestionRequest,
  decorateNotebookSummary,
  filterNotebooks,
  formatNotebookDate,
  getNotebookSourceCount,
  inferNotebookTitleFromPrompt,
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
        notebookId: "notebook-1",
        question: "  What happens first?  ",
        selectedDocumentIds: ["document-1", "document-1"],
      }),
    ).toEqual({
      conversationId: "conversation-1",
      documentIds: ["document-1"],
      message: "What happens first?",
      notebookId: "notebook-1",
    });
    expect(
      createNotebookQuestionRequest({
        notebookId: "notebook-1",
        question: "   ",
        selectedDocumentIds: [],
      }),
    ).toBeUndefined();
    expect(
      createNotebookQuestionRequest({
        question: "What changed?",
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

  it("decorates persisted notebook summaries for presentation", () => {
    const notebook = decorateNotebookSummary(persistedNotebooks[0]);

    expect(notebook).toMatchObject({
      id: "healthspan-diagnostics",
      sourceCount: 2,
      tone: "gold",
    });
    expect(createEmptyNotebookSession()).toEqual({
      messages: [],
      question: "",
      selectedDocumentIds: [],
    });
  });

  it("updates notebook metadata from a trimmed draft", () => {
    const draft = createNotebookEditorDraft({
      ...notebooks[0],
      category: "Diagnostics",
      description: "Old description",
      title: "Old title",
    });

    expect(
      updateNotebookFromDraft(notebooks[0], {
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

  it("filters and orders notebooks for the gallery", () => {
    expect(filterNotebooks(notebooks, "care")).toEqual([notebooks[1]]);
    expect(orderNotebooksByMostRecent(notebooks).map((notebook) => notebook.id)).toEqual([
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
    expect(
      shouldAutoNameNotebook(
        decorateNotebookSummary(
          {
            category: "Member notebook",
            createdDateUtc: "2026-06-06T12:00:00.000Z",
            description: "",
            id: "notebook-4",
            lastUpdatedDateUtc: "2026-06-06T12:00:00.000Z",
            members: [notebookMember],
            role: "owner",
            sourceCount: 0,
            title: "Untitled notebook",
          },
        ),
      ),
    ).toBe(true);
    expect(inferNotebookTitleFromPrompt("Summarize cardiovascular risk from the latest labs")).toBe(
      "Cardiovascular Risk Latest Labs",
    );
  });
});

const notebookMember = {
  email: "owner@example.com",
  role: "owner" as const,
  status: "active" as const,
  userId: "owner-1",
};

const persistedNotebooks = [
  {
    category: "Diagnostics",
    createdDateUtc: "2026-06-06T12:00:00.000Z",
    description: "A source set for diagnostics.",
    id: "healthspan-diagnostics",
    lastUpdatedDateUtc: "2026-06-06T12:00:00.000Z",
    members: [notebookMember],
    role: "owner" as const,
    sourceCount: 2,
    title: "Healthspan Diagnostics",
  },
  {
    category: "Care Planning",
    createdDateUtc: "2026-06-05T12:00:00.000Z",
    description: "Care plan source materials.",
    id: "care-plan-builder",
    lastUpdatedDateUtc: "2026-06-05T12:00:00.000Z",
    members: [notebookMember],
    role: "owner" as const,
    sourceCount: 1,
    title: "Care Plan Builder",
  },
  {
    category: "Briefing",
    createdDateUtc: "2026-06-04T12:00:00.000Z",
    description: "Physician briefing notes.",
    id: "physician-briefing",
    lastUpdatedDateUtc: "2026-06-04T12:00:00.000Z",
    members: [notebookMember],
    role: "owner" as const,
    sourceCount: 3,
    title: "Physician Briefing",
  },
];

const notebooks = persistedNotebooks.map((notebook) => decorateNotebookSummary(notebook));

const documents: DocumentSummary[] = [
  {
    byteSize: 10,
    chunkCount: 1,
    contentType: "text/plain",
    createdDateUtc: "2026-01-01T00:00:00.000Z",
    id: "document-1",
    lastUpdatedDateUtc: "2026-01-01T00:00:00.000Z",
    notebookId: "notebook-1",
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
    notebookId: "notebook-1",
    originalFileName: "two.txt",
    status: "ready",
  },
];
