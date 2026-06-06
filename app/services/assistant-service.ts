import {
  getConversation,
  getStreamAssistantMessageUrl,
  listAssistants,
  type AssistantConversation as GeneratedAssistantConversation,
  type AssistantSummary as GeneratedAssistantSummary,
  type AssistantThreadUpdate as GeneratedAssistantThreadUpdate,
  type SendAssistantMessagePayload,
} from "../api/generated/fountain-life-api";
import type { ApiClient } from "./api-client";
import type { BaseResponse } from "./base-contracts";
import { unwrapResponse } from "./base-contracts";

export type AssistantSummary = GeneratedAssistantSummary;

export type AssistantThreadUpdate = GeneratedAssistantThreadUpdate;

export type AssistantConversation = GeneratedAssistantConversation;

export type SendAssistantMessageRequest = SendAssistantMessagePayload;

export class AssistantService {
  constructor(private readonly api: ApiClient) {}

  async listAssistants() {
    const response = await listAssistants({});
    return unwrapResponse(response.data);
  }

  async getConversation(conversationId: string) {
    const response = await getConversation({ payload: { conversationId } });
    return unwrapResponse(response.data);
  }

  streamMessage(
    assistantKey: string,
    request: SendAssistantMessageRequest,
    onUpdate: (update: AssistantThreadUpdate) => void,
  ) {
    return this.api.stream(getStreamAssistantMessageUrl(assistantKey), { payload: request }, (event) =>
      onUpdate(unwrapResponse(event as BaseResponse<AssistantThreadUpdate>)),
    );
  }
}
