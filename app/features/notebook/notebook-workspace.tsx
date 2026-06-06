import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useServices } from "../../services/service-context";
import type { AssistantThreadUpdate } from "../../services/assistant-service";
import { NotebookWorkspaceView } from "./notebook-workspace.view";
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

  const documentsQuery = useQuery({
    enabled: authState.status === "authenticated",
    queryFn: () => documents.listDocuments(),
    queryKey: ["documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documents.uploadDocument(file),
    onSuccess: async (document) => {
      setSelectedDocumentIds((current) => Array.from(new Set([...current, document.id])));
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documents.deleteDocument(documentId),
    onMutate: (documentId) => setDeleteDocumentId(documentId),
    onSettled: () => setDeleteDocumentId(undefined),
    onSuccess: async (_result, documentId) => {
      setSelectedDocumentIds((current) => current.filter((selectedId) => selectedId !== documentId));
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      const trimmedQuestion = question.trim();
      if (!trimmedQuestion) {
        return;
      }

      setStatusText(undefined);
      await assistant.streamMessage(
        "notebook",
        {
          conversationId,
          documentIds: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
          message: trimmedQuestion,
        },
        (update) => {
          setConversationId(update.conversationId);
          if (update.type === "status") {
            setStatusText(update.text);
            return;
          }

          setMessages((current) => [...current, update]);
        },
      );
      setQuestion("");
    },
  });

  const documentIds = useMemo(
    () => new Set((documentsQuery.data ?? []).map((document) => document.id)),
    [documentsQuery.data],
  );
  const normalizedSelectedDocumentIds = selectedDocumentIds.filter((documentId) => documentIds.has(documentId));

  function handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    void uploadFiles(Array.from(files));
  }

  async function uploadFiles(files: File[]) {
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
  }

  function toggleDocument(documentId: string) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((selectedId) => selectedId !== documentId)
        : [...current, documentId],
    );
  }

  function toggleEveryDocument() {
    const availableDocumentIds = (documentsQuery.data ?? []).map((document) => document.id);
    setSelectedDocumentIds((current) =>
      current.length === availableDocumentIds.length ? [] : availableDocumentIds,
    );
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
      documents={documentsQuery.data ?? []}
      documentsError={errorMessage(documentsQuery.error)}
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
      operationError={errorMessage(uploadMutation.error ?? deleteMutation.error ?? askMutation.error)}
      question={question}
      selectedDocumentIds={normalizedSelectedDocumentIds}
      statusText={statusText}
    />
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}
