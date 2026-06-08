import { describe, expect, it, vi } from "vitest";
import * as generatedApi from "../api/generated/fountain-life-api";
import { DocumentSummaryStatus } from "../api/generated/fountain-life-api";
import { DocumentsService } from "./documents-service";

vi.mock("../api/generated/fountain-life-api", () => ({
  deleteDocument: vi.fn(),
  DocumentSummaryStatus: {
    failed: "failed",
    processing: "processing",
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
      notebookId: "notebook-1",
      originalFileName: "notes.txt",
      status: DocumentSummaryStatus.ready,
    };
    vi.mocked(generatedApi.uploadDocument).mockResolvedValue({
      data: {
        document,
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new DocumentsService();

    await expect(
      service.uploadDocument(new File(["hello"], "notes.txt"), "notebook-1"),
    ).resolves.toEqual(document);
    expect(generatedApi.uploadDocument).toHaveBeenCalledWith({
      file: expect.any(File),
      notebookId: "notebook-1",
    });
  });

  it("deletes documents by id", async () => {
    vi.mocked(generatedApi.deleteDocument).mockResolvedValue({
      data: {
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new DocumentsService();

    await expect(
      service.deleteDocument("document-1", "notebook-1"),
    ).resolves.toBeUndefined();
    expect(generatedApi.deleteDocument).toHaveBeenCalledWith({
      documentId: "document-1",
      notebookId: "notebook-1",
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
        notebookId: "notebook-1",
        originalFileName: "notes.txt",
        status: DocumentSummaryStatus.ready,
      },
    ];
    vi.mocked(generatedApi.listDocuments).mockResolvedValue({
      data: {
        documents,
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new DocumentsService();

    await expect(service.listDocuments("notebook-1")).resolves.toEqual(
      documents,
    );
    expect(generatedApi.listDocuments).toHaveBeenCalledWith({
      notebookId: "notebook-1",
    });
  });
});
