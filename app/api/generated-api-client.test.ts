import { afterEach, describe, expect, it, vi } from "vitest";
import { configureGeneratedApiClient, generatedApiClient } from "./generated-api-client";

describe("generatedApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds auth headers and returns the Orval fetch response shape", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("window", { fetch: fetchMock });
    configureGeneratedApiClient({
      baseUrl: "http://localhost:3000/api",
      getRequestHeaders: vi.fn(async () => ({
        "X-Local-User-Id": "local-user",
      })),
    });

    await expect(
      generatedApiClient<{ data: { ok: boolean }; headers: Headers; status: number }>("/example", {
        body: JSON.stringify({ value: 1 }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    ).resolves.toMatchObject({
      data: { ok: true },
      status: 200,
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/example", {
      body: JSON.stringify({ value: 1 }),
      headers: {
        "Content-Type": "application/json",
        "X-Local-User-Id": "local-user",
      },
      method: "POST",
    });
  });
});
