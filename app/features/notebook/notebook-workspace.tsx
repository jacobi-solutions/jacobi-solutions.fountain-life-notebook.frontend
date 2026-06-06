import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useServices } from "../../services/service-context";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import {
  DOCUMENTS_QUERY_KEY,
  DOCUMENT_UPLOAD_ERROR_MESSAGE,
  NOTEBOOK_ASSISTANT_KEY,
} from "./notebook.constants";
import { NotebookWorkspaceView } from "./notebook-workspace.view";
import {
  addSelectedDocumentId,
  appendThreadUpdate,
  createNotebookQuestionRequest,
  normalizeSelectedDocumentIds,
  toErrorMessage,
  toggleDocumentSelection,
  toggleEveryDocumentSelection,
} from "./notebook-workspace.vm";
import "./notebook-workspace.css";

export function NotebookWorkspace() {
  const { assistant, auth, documents } = useServices();
  const authState = useAuth();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<AssistantThreadUpdate[]>([]);
  const [question, setQuestion] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [statusText, setStatusText] = useState<string>();
  const [deleteDocumentId, setDeleteDocumentId] = useState<string>();
  const [uploadBatchError, setUploadBatchError] = useState<string>();

  const documentsQuery = useQuery({
    enabled: authState.status === "authenticated",
    queryFn: () => documents.listDocuments(),
    queryKey: DOCUMENTS_QUERY_KEY,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documents.uploadDocument(file),
    onMutate: () => setUploadBatchError(undefined),
    onError: (error) => setUploadBatchError(toErrorMessage(error, DOCUMENT_UPLOAD_ERROR_MESSAGE)),
    onSuccess: async (document) => {
      setSelectedDocumentIds((current) => addSelectedDocumentId(current, document.id));
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documents.deleteDocument(documentId),
    onMutate: (documentId) => setDeleteDocumentId(documentId),
    onSettled: () => setDeleteDocumentId(undefined),
    onSuccess: async (_result, documentId) => {
      setSelectedDocumentIds((current) => current.filter((selectedId) => selectedId !== documentId));
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      const request = createNotebookQuestionRequest({
        conversationId,
        question,
        selectedDocumentIds: normalizedSelectedDocumentIds,
      });
      if (!request) {
        return;
      }

      setStatusText(undefined);
      await assistant.streamMessage(
        NOTEBOOK_ASSISTANT_KEY,
        request,
        (update) => {
          setConversationId(update.conversationId);
          if (update.type === "status") {
            setStatusText(update.text);
            return;
          }

          setMessages((current) => appendThreadUpdate(current, update));
        },
      );
      setQuestion("");
    },
  });

  const currentDocuments = documentsQuery.data ?? [];
  const normalizedSelectedDocumentIds = normalizeSelectedDocumentIds(selectedDocumentIds, currentDocuments);

  function handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    void uploadFiles(Array.from(files));
  }

  async function uploadFiles(files: File[]) {
    try {
      for (const file of files) {
        await uploadMutation.mutateAsync(file);
      }
    } catch (error) {
      setUploadBatchError(toErrorMessage(error, DOCUMENT_UPLOAD_ERROR_MESSAGE));
    }
  }

  function toggleDocument(documentId: string) {
    setSelectedDocumentIds((current) => toggleDocumentSelection(current, documentId));
  }

  function toggleEveryDocument() {
    setSelectedDocumentIds((current) => toggleEveryDocumentSelection(current, currentDocuments));
  }

  function startNewThread() {
    setConversationId(undefined);
    setMessages([]);
    setStatusText(undefined);
  }

  return (
    <NotebookWorkspaceView
      authState={authState}
      conversationId={conversationId}
      deleteDocumentId={deleteDocumentId}
      documents={currentDocuments}
      documentsError={toErrorMessage(documentsQuery.error)}
      isAsking={askMutation.isPending}
      isDeleting={deleteMutation.isPending}
      isDocumentsLoading={documentsQuery.isLoading}
      isUploading={uploadMutation.isPending}
      messages={messages}
      onAskQuestion={() => askMutation.mutate()}
      onDeleteDocument={(documentId) => deleteMutation.mutate(documentId)}
      onNewThread={startNewThread}
      onQuestionChange={setQuestion}
      onSignIn={() => void auth.signIn()}
      onSignOut={() => void auth.signOut()}
      onToggleDocument={toggleDocument}
      onToggleEveryDocument={toggleEveryDocument}
      onUploadFiles={handleUploadFiles}
      operationError={
        uploadBatchError ?? toErrorMessage(uploadMutation.error ?? deleteMutation.error ?? askMutation.error)
      }
      question={question}
      selectedDocumentIds={normalizedSelectedDocumentIds}
      statusText={statusText}
    />
  );
}
