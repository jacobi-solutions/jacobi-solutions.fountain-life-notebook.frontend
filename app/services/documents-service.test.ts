import { describe, expect, it, vi } from "vitest";
import * as generatedApi from "../api/generated/fountain-life-api";
import { DocumentSummaryStatus } from "../api/generated/fountain-life-api";
import { DocumentsService } from "./documents-service";

vi.mock("../api/generated/fountain-life-api", () => ({
  deleteDocument: vi.fn(),
  DocumentSummaryStatus: {
    failed: "failed",
    ready: "ready",
  },
  listDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}));

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
      status: DocumentSummaryStatus.ready,
    };
    vi.mocked(generatedApi.uploadDocument).mockResolvedValue({
      data: {
        data: document,
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new DocumentsService();

    await expect(service.uploadDocument(new File(["hello"], "notes.txt"))).resolves.toEqual(document);
    expect(generatedApi.uploadDocument).toHaveBeenCalledWith({ file: expect.any(File) });
  });

  it("deletes documents by id", async () => {
    vi.mocked(generatedApi.deleteDocument).mockResolvedValue({
      data: {
        data: { deleted: true },
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new DocumentsService();

    await expect(service.deleteDocument("document-1")).resolves.toEqual({ deleted: true });
    expect(generatedApi.deleteDocument).toHaveBeenCalledWith({
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
        status: DocumentSummaryStatus.ready,
      },
    ];
    vi.mocked(generatedApi.listDocuments).mockResolvedValue({
      data: {
        data: documents,
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new DocumentsService();

    await expect(service.listDocuments()).resolves.toEqual(documents);
    expect(generatedApi.listDocuments).toHaveBeenCalledWith({});
  });
});
