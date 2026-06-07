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

  async viewDocument(documentId: string) {
    const response = await viewDocumentApi({ documentId });
    assertResponseSuccess(response.data);
    return response.data.document;
  }

  async deleteDocument(documentId: string) {
    const response = await deleteDocumentApi({ documentId });
    assertResponseSuccess(response.data);
  }
}
