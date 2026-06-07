import { describe, expect, it, vi } from "vitest";
import * as generatedApi from "../api/generated/fountain-life-api";
import type { ApiClient } from "./api-client";
import { AssistantService } from "./assistant-service";
import { NOTEBOOK_ASSISTANT_KEY } from "../features/notebook/notebook.constants";

vi.mock("../api/generated/fountain-life-api", () => ({
  getConversation: vi.fn(),
  getStreamAssistantMessageUrl: vi.fn((assistantKey: string) => `/assistants/${assistantKey}/stream-message`),
  listAssistants: vi.fn(),
}));

describe("AssistantService", () => {
  it("lists assistants through the generated API client", async () => {
    const assistants = [
      {
        description: "Ask questions grounded in your uploaded documents.",
        key: NOTEBOOK_ASSISTANT_KEY,
        name: "Notebook Assistant",
      },
    ];
    vi.mocked(generatedApi.listAssistants).mockResolvedValue({
      data: {
        assistants,
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const api = {} as unknown as ApiClient;
    const service = new AssistantService(api);

    await expect(service.listAssistants()).resolves.toEqual(assistants);
    expect(generatedApi.listAssistants).toHaveBeenCalledWith({});
  });

  it("streams assistant updates through the API client", async () => {
    const update = {
      conversationId: "conversation-1",
      citations: [
        {
          chunkIndex: 0,
          documentId: "document-1",
          documentName: "notes.txt",
          snippet: "A cited detail.",
        },
      ],
      role: "assistant",
      text: "Hello",
      type: "message",
    };
    const api = {
      stream: vi.fn(async (_path, _body, onEvent) =>
        onEvent({
          errors: [],
          isSuccess: true,
          update,
        }),
      ),
    } as unknown as ApiClient;
    const service = new AssistantService(api);
    const onUpdate = vi.fn();

    await service.streamMessage(
      NOTEBOOK_ASSISTANT_KEY,
      { documentIds: ["document-1"], message: "hello", notebookId: "notebook-1" },
      onUpdate,
    );

    expect(api.stream).toHaveBeenCalledWith(
      `/assistants/${NOTEBOOK_ASSISTANT_KEY}/stream-message`,
      { documentIds: ["document-1"], message: "hello", notebookId: "notebook-1" },
      expect.any(Function),
    );
    expect(onUpdate).toHaveBeenCalledWith(update);
  });

  it("loads a conversation by id", async () => {
    const conversation = {
      assistantKey: NOTEBOOK_ASSISTANT_KEY,
      createdDateUtc: "2026-01-01T00:00:00.000Z",
      id: "conversation-1",
      lastUpdatedDateUtc: "2026-01-01T00:00:00.000Z",
      messages: [],
      participants: [],
    };
    vi.mocked(generatedApi.getConversation).mockResolvedValue({
      data: {
        conversation,
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const api = {} as unknown as ApiClient;
    const service = new AssistantService(api);

    await expect(service.getConversation("conversation-1")).resolves.toEqual(conversation);
    expect(generatedApi.getConversation).toHaveBeenCalledWith({
      conversationId: "conversation-1",
    });
  });
});
