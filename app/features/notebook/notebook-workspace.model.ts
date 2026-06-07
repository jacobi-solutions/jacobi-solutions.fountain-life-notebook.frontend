import type { AuthSnapshot } from "../../services/auth-service";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import type {
  DocumentDetail,
  DocumentSummary,
} from "../../services/documents-service";
import type { NotebookMemberRole } from "../../services/notebooks-service";

export type NotebookTone = "aqua" | "gold" | "graphite" | "violet";

export interface NotebookSummary {
  category: string;
  createdDateUtc: string;
  description: string;
  id: string;
  lastUpdatedDateUtc: string;
  members: {
    email?: string;
    role: NotebookMemberRole;
    status: "active" | "invited";
    userId?: string;
  }[];
  role: NotebookMemberRole;
  sourceCount: number;
  title: string;
  tone: NotebookTone;
}

export interface NotebookEditorDraft {
  category: string;
  description: string;
  title: string;
}

export interface NotebookInviteDraft {
  email: string;
  role: Exclude<NotebookMemberRole, "owner">;
}

export interface NotebookWorkspaceModel {
  activeNotebook?: NotebookSummary;
  activeDocument?: DocumentDetail;
  activeDocumentError?: string;
  activeDocumentId?: string;
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
  isDocumentLoading: boolean;
  isInviteMemberVisible: boolean;
  isNotebookListVisible: boolean;
  isNotebooksLoading: boolean;
  isInvitingMember: boolean;
  isUploading: boolean;
  messages: AssistantThreadUpdate[];
  onAskQuestion: () => void;
  onBackToNotebooks: () => void;
  onCancelEditNotebook: () => void;
  onCreateNotebook: () => void;
  onDismissUnavailableFeature: () => void;
  onCancelInviteMember: () => void;
  onDeleteNotebook: (notebookId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onEditNotebook: (notebookId: string) => void;
  onInviteDraftChange: (draft: NotebookInviteDraft) => void;
  onNewThread: () => void;
  onOpenDocument: (documentId: string) => void;
  onNotebookDraftChange: (draft: NotebookEditorDraft) => void;
  onNotebookSearchChange: (query: string) => void;
  onQuestionChange: (question: string) => void;
  onSaveNotebook: () => void;
  onSendInvite: () => void;
  onStartInviteMember: () => void;
  onShowChat: () => void;
  onSelectNotebook: (notebookId: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleDocument: (documentId: string) => void;
  onToggleEveryDocument: () => void;
  onUnavailableFeature: (featureName: string) => void;
  onUploadFiles: (files: FileList | null) => void;
  operationError?: string;
  notebooksError?: string;
  notebookDraft: NotebookEditorDraft;
  notebookInviteDraft: NotebookInviteDraft;
  notebookSearch: string;
  notebooks: NotebookSummary[];
  question: string;
  selectedDocumentIds: string[];
  sourceCountsByNotebookId: Record<string, number>;
  statusText?: string;
}
