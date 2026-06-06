import {
  deleteDocument as deleteDocumentApi,
  type DeleteDocumentResult as GeneratedDeleteDocumentResult,
  type DocumentSummary as GeneratedDocumentSummary,
  listDocuments as listDocumentsApi,
  uploadDocument as uploadDocumentApi,
} from "../api/generated/fountain-life-api";
import { unwrapResponse } from "./base-contracts";

export type DocumentSummary = GeneratedDocumentSummary;
export type DeleteDocumentResult = GeneratedDeleteDocumentResult;

export class DocumentsService {
  async uploadDocument(file: File) {
    const response = await uploadDocumentApi({ file });
    return unwrapResponse(response.data);
  }

  async listDocuments() {
    const response = await listDocumentsApi({});
    return unwrapResponse(response.data);
  }

  async deleteDocument(documentId: string) {
    const response = await deleteDocumentApi({ payload: { documentId } });
    return unwrapResponse(response.data);
  }
}
