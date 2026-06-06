import type { AuthSnapshot } from "../../services/auth-service";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import type { DocumentSummary } from "../../services/documents-service";

export interface NotebookWorkspaceModel {
  authState: AuthSnapshot;
  conversationId?: string;
  deleteDocumentId?: string;
  documents: DocumentSummary[];
  documentsError?: string;
  isAsking: boolean;
  isDeleting: boolean;
  isDocumentsLoading: boolean;
  isUploading: boolean;
  messages: AssistantThreadUpdate[];
  onAskQuestion: () => void;
  onDeleteDocument: (documentId: string) => void;
  onNewThread: () => void;
  onQuestionChange: (question: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleDocument: (documentId: string) => void;
  onToggleEveryDocument: () => void;
  onUploadFiles: (files: FileList | null) => void;
  operationError?: string;
  question: string;
  selectedDocumentIds: string[];
  statusText?: string;
}
