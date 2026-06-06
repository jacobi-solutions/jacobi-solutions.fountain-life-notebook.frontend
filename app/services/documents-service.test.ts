import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "./api-client";
import { API_ROUTES } from "./api-routes";
import { DocumentsService } from "./documents-service";

describe("DocumentsService", () => {
  it("uploads documents with multipart form data", async () => {
    const document = {
      byteSize: 12,
      chunkCount: 1,
      contentType: "text/plain",
      createdDateUtc: "2026-01-01T00:00:00.000Z",
      id: "document-1",
      lastUpdatedDateUtc: "2026-01-01T00:00:00.000Z",
      originalFileName: "notes.txt",
      status: "ready",
    };
    const api = {
      upload: vi.fn().mockResolvedValue({
        data: document,
        errors: [],
        isSuccess: true,
      }),
    } as unknown as ApiClient;
    const service = new DocumentsService(api);

    await expect(service.uploadDocument(new File(["hello"], "notes.txt"))).resolves.toEqual(document);
    expect(api.upload).toHaveBeenCalledWith(API_ROUTES.documents.upload, expect.any(FormData));
  });

  it("deletes documents by id", async () => {
    const api = {
      post: vi.fn().mockResolvedValue({
        data: { deleted: true },
        errors: [],
        isSuccess: true,
      }),
    } as unknown as ApiClient;
    const service = new DocumentsService(api);

    await expect(service.deleteDocument("document-1")).resolves.toEqual({ deleted: true });
    expect(api.post).toHaveBeenCalledWith(API_ROUTES.documents.delete, {
      payload: { documentId: "document-1" },
    });
  });

  it("lists documents through the API client", async () => {
    const documents = [
      {
        byteSize: 12,
        chunkCount: 1,
        contentType: "text/plain",
        createdDateUtc: "2026-01-01T00:00:00.000Z",
        id: "document-1",
        lastUpdatedDateUtc: "2026-01-01T00:00:00.000Z",
        originalFileName: "notes.txt",
        status: "ready",
      },
    ];
    const api = {
      post: vi.fn().mockResolvedValue({
        data: documents,
        errors: [],
        isSuccess: true,
      }),
    } as unknown as ApiClient;
    const service = new DocumentsService(api);

    await expect(service.listDocuments()).resolves.toEqual(documents);
    expect(api.post).toHaveBeenCalledWith(API_ROUTES.documents.list, {});
  });
});
