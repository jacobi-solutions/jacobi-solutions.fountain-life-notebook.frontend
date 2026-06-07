import {
  deleteDocument as deleteDocumentApi,
  type DocumentDetail as GeneratedDocumentDetail,
  type DocumentSummary as GeneratedDocumentSummary,
  listDocuments as listDocumentsApi,
  uploadDocument as uploadDocumentApi,
  viewDocument as viewDocumentApi,
} from "../api/generated/fountain-life-api";
import { assertResponseSuccess } from "./base-contracts";

export type DocumentDetail = GeneratedDocumentDetail;
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

  async viewDocument(documentId: string, notebookId: string) {
    const response = await viewDocumentApi({ documentId, notebookId });
    assertResponseSuccess(response.data);
    return response.data.document;
  }

  async deleteDocument(documentId: string, notebookId: string) {
    const response = await deleteDocumentApi({ documentId, notebookId });
    assertResponseSuccess(response.data);
  }
}
