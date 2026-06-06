import {
  deleteDocument as deleteDocumentApi,
  type DocumentSummary as GeneratedDocumentSummary,
  listDocuments as listDocumentsApi,
  uploadDocument as uploadDocumentApi,
} from "../api/generated/fountain-life-api";
import { assertResponseSuccess } from "./base-contracts";

export type DocumentSummary = GeneratedDocumentSummary;

export class DocumentsService {
  async uploadDocument(file: File) {
    const response = await uploadDocumentApi({ file });
    assertResponseSuccess(response.data);
    return response.data.document;
  }

  async listDocuments() {
    const response = await listDocumentsApi({});
    assertResponseSuccess(response.data);
    return response.data.documents;
  }

  async deleteDocument(documentId: string) {
    const response = await deleteDocumentApi({ documentId });
    assertResponseSuccess(response.data);
  }
}
