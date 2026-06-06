import type { ApiClient } from "./api-client";
import type { components } from "../api/generated/fountain-life-api";
import type { BaseResponse } from "./base-contracts";
import { unwrapResponse } from "./base-contracts";

export type AssistantSummary = components["schemas"]["AssistantSummaryDto"];

export type AssistantThreadUpdate = components["schemas"]["AssistantThreadUpdateDto"];

export type AssistantConversation = components["schemas"]["AssistantConversationDto"];

export type SendAssistantMessageRequest = components["schemas"]["SendAssistantMessagePayloadDto"];

export class AssistantService {
  constructor(private readonly api: ApiClient) {}

  async listAssistants() {
    return unwrapResponse(
      await this.api.post<BaseResponse<AssistantSummary[]>>("/assistants/list", {}),
    );
  }

  async getConversation(conversationId: string) {
    return unwrapResponse(
      await this.api.post<BaseResponse<AssistantConversation>>("/assistants/conversation/get", {
        payload: { conversationId },
      }),
    );
  }

  streamMessage(
    assistantKey: string,
    request: SendAssistantMessageRequest,
    onUpdate: (update: AssistantThreadUpdate) => void,
  ) {
    return this.api.stream(`/assistants/${assistantKey}/messages/stream`, { payload: request }, (event) =>
      onUpdate(unwrapResponse(event as BaseResponse<AssistantThreadUpdate>)),
    );
  }
}
