import {
  deleteDocument as deleteDocumentApi,
  type DocumentSummary as GeneratedDocumentSummary,
  listDocuments as listDocumentsApi,
  uploadDocument as uploadDocumentApi,
} from "../api/generated/fountain-life-api";
import { assertResponseSuccess } from "./base-contracts";

export type DocumentSummary = GeneratedDocumentSummary;

export class DocumentsService {
  async uploadDocument(file: File, notebookId: string) {
    const response = await uploadDocumentApi({ file, notebookId });
    assertResponseSuccess(response.data);
    return response.data.document;
  }

  async listDocuments(notebookId: string) {
    const response = await listDocumentsApi({ notebookId });
    assertResponseSuccess(response.data);
    return response.data.documents;
  }

  async deleteDocument(documentId: string, notebookId: string) {
    const response = await deleteDocumentApi({ documentId, notebookId });
    assertResponseSuccess(response.data);
  }
}
