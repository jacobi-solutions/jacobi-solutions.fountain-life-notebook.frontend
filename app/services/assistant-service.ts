import {
  clearNotebookConversation,
  getConversation,
  getNotebookConversation,
  getStreamAssistantMessageUrl,
  listAssistants,
  type AssistantConversation as GeneratedAssistantConversation,
  type AssistantSummary as GeneratedAssistantSummary,
  type AssistantThreadUpdate as GeneratedAssistantThreadUpdate,
  type SendAssistantMessageRequest as GeneratedSendAssistantMessageRequest,
} from "../api/generated/fountain-life-api";
import type { ApiClient } from "./api-client";
import { assertResponseSuccess, type ApiBaseResponse } from "./base-contracts";

export type AssistantSummary = GeneratedAssistantSummary;

export type AssistantThreadUpdate = GeneratedAssistantThreadUpdate;

export type AssistantConversation = GeneratedAssistantConversation;

export type SendAssistantMessageRequest = GeneratedSendAssistantMessageRequest;

export class AssistantService {
  constructor(private readonly api: ApiClient) {}

  async listAssistants() {
    const response = await listAssistants({});
    assertResponseSuccess(response.data);
    return response.data.assistants;
  }

  async getConversation(conversationId: string) {
    const response = await getConversation({ conversationId });
    assertResponseSuccess(response.data);
    return response.data.conversation;
  }

  async getNotebookConversation(assistantKey: string, notebookId: string) {
    const response = await getNotebookConversation(assistantKey, { notebookId });
    assertResponseSuccess(response.data);
    return response.data.conversation;
  }

  async clearNotebookConversation(assistantKey: string, notebookId: string) {
    const response = await clearNotebookConversation(assistantKey, { notebookId });
    assertResponseSuccess(response.data);
  }

  streamMessage(
    assistantKey: string,
    request: SendAssistantMessageRequest,
    onUpdate: (update: AssistantThreadUpdate) => void,
  ) {
    return this.api.stream(getStreamAssistantMessageUrl(assistantKey), request, (event) => {
      const response = event as ApiBaseResponse & { update: AssistantThreadUpdate };
      assertResponseSuccess(response);
      onUpdate(response.update);
    });
  }
}
