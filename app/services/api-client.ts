import type { AuthService } from "./auth-service";

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly authService: AuthService,
  ) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  }

  async stream(
    path: string,
    body: unknown,
    onEvent: (event: unknown) => void,
  ): Promise<void> {
    const response = await this.fetch(path, {
      body: JSON.stringify(body),
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.body) {
      throw new Error("The server did not return a response stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");
      let boundary = buffer.indexOf("\n\n");

      while (boundary >= 0) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice("data:".length).trim())
          .join("\n");

        if (data) {
          onEvent(JSON.parse(data));
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetch(path, init);
    return (await response.json()) as T;
  }

  private async fetch(path: string, init: RequestInit) {
    const authHeaders = await this.authService.getRequestHeaders();
    const response = await window.fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error((await response.text()) || `Request failed with ${response.status}.`);
    }

    return response;
  }
}
