import type { AuthSnapshot } from "../../services/auth-service";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import type { DocumentSummary } from "../../services/documents-service";

export type NotebookTone = "aqua" | "gold" | "graphite" | "violet";

export interface NotebookSummary {
  category: string;
  createdDateUtc: string;
  description: string;
  featured: boolean;
  id: string;
  title: string;
  tone: NotebookTone;
}

export interface NotebookEditorDraft {
  category: string;
  description: string;
  title: string;
}

export interface NotebookWorkspaceModel {
  activeNotebook?: NotebookSummary;
  activeUnavailableFeature?: string;
  authState: AuthSnapshot;
  conversationId?: string;
  deleteDocumentId?: string;
  documents: DocumentSummary[];
  documentsError?: string;
  editingNotebook?: NotebookSummary;
  insightCountsByNotebookId: Record<string, number>;
  isAsking: boolean;
  isDeleting: boolean;
  isDocumentsLoading: boolean;
  isNotebookListVisible: boolean;
  isUploading: boolean;
  messages: AssistantThreadUpdate[];
  onAskQuestion: () => void;
  onBackToNotebooks: () => void;
  onCancelEditNotebook: () => void;
  onCreateNotebook: () => void;
  onDismissUnavailableFeature: () => void;
  onDeleteNotebook: (notebookId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onDuplicateNotebook: (notebookId: string) => void;
  onEditNotebook: (notebookId: string) => void;
  onNewThread: () => void;
  onNotebookDraftChange: (draft: NotebookEditorDraft) => void;
  onNotebookSearchChange: (query: string) => void;
  onQuestionChange: (question: string) => void;
  onSaveNotebook: () => void;
  onSelectNotebook: (notebookId: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleDocument: (documentId: string) => void;
  onToggleEveryDocument: () => void;
  onUnavailableFeature: (featureName: string) => void;
  onUploadFiles: (files: FileList | null) => void;
  operationError?: string;
  notebookDraft: NotebookEditorDraft;
  notebookSearch: string;
  notebooks: NotebookSummary[];
  question: string;
  selectedDocumentIds: string[];
  sourceCountsByNotebookId: Record<string, number>;
  statusText?: string;
}
