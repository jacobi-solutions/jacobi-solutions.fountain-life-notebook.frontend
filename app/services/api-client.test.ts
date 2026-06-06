import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./api-client";
import type { AuthService } from "./auth-service";

describe("ApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds auth service headers to requests", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("window", { fetch: fetchMock });
    const auth = {
      getRequestHeaders: vi.fn(async () => ({
        "X-Local-User-Id": "local-user",
      })),
    } as unknown as AuthService;
    const api = new ApiClient("http://localhost:3000/api", auth);

    await expect(api.post("/example", { value: 1 })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/example", {
      body: JSON.stringify({ value: 1 }),
      headers: {
        "Content-Type": "application/json",
        "X-Local-User-Id": "local-user",
      },
      method: "POST",
    });
  });

  it("does not force a JSON content type on uploads", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("window", { fetch: fetchMock });
    const auth = {
      getRequestHeaders: vi.fn(async () => ({
        "X-Local-User-Id": "local-user",
      })),
    } as unknown as AuthService;
    const formData = new FormData();
    const api = new ApiClient("http://localhost:3000/api", auth);

    await expect(api.upload("/documents/upload", formData)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/documents/upload", {
      body: formData,
      headers: {
        "X-Local-User-Id": "local-user",
      },
      method: "POST",
    });
  });
});
