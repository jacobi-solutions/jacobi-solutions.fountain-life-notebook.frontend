export const API_ROUTES = {
  assistants: {
    conversationGet: "/assistants/conversation/get",
    list: "/assistants/list",
    streamMessages: (assistantKey: string) => `/assistants/${encodeURIComponent(assistantKey)}/messages/stream`,
  },
  documents: {
    delete: "/documents/delete",
    list: "/documents/list",
    upload: "/documents/upload",
  },
} as const;
