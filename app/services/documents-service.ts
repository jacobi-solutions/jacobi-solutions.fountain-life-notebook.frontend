import type { components } from "../api/generated/fountain-life-api";
import type { ApiClient } from "./api-client";
import type { BaseResponse } from "./base-contracts";
import { unwrapResponse } from "./base-contracts";

export type DocumentSummary = components["schemas"]["DocumentDto"];
export type DeleteDocumentResult = components["schemas"]["DeleteDocumentResultDto"];

export class DocumentsService {
  constructor(private readonly api: ApiClient) {}

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return unwrapResponse(
      await this.api.upload<BaseResponse<DocumentSummary>>("/documents/upload", formData),
    );
  }

  async listDocuments() {
    return unwrapResponse(
      await this.api.post<BaseResponse<DocumentSummary[]>>("/documents/list", {}),
    );
  }

  async deleteDocument(documentId: string) {
    return unwrapResponse(
      await this.api.post<BaseResponse<DeleteDocumentResult>>("/documents/delete", {
        payload: { documentId },
      }),
    );
  }
}
