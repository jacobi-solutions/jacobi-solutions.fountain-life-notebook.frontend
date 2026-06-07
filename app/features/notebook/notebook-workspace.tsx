import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useServices } from "../../services/service-context";
import {
  DOCUMENT_DETAIL_QUERY_KEY,
  DOCUMENTS_QUERY_KEY,
  DOCUMENT_UPLOAD_ERROR_MESSAGE,
  NOTEBOOK_ASSISTANT_KEY,
} from "./notebook.constants";
import type { NotebookEditorDraft } from "./notebook-workspace.model";
import { NotebookWorkspaceView } from "./notebook-workspace.view";
import {
  addSelectedDocumentId,
  appendThreadUpdate,
  createEmptyNotebookSession,
  createNotebookEditorDraft,
  createNotebookSessionMap,
  createNotebookQuestionRequest,
  createNotebookSummary,
  duplicateNotebookSummary,
  getNotebookSourceCount,
  inferNotebookTitleFromPrompt,
  INITIAL_NOTEBOOKS,
  normalizeSelectedDocumentIds,
  shouldAutoNameNotebook,
  toErrorMessage,
  toggleDocumentSelection,
  toggleEveryDocumentSelection,
  updateNotebookFromDraft,
  type NotebookSessionState,
} from "./notebook-workspace.vm";
import "./notebook-workspace.css";

export function NotebookWorkspace() {
  const { assistant, auth, documents } = useServices();
  const authState = useAuth();
  const queryClient = useQueryClient();
  const [activeNotebookId, setActiveNotebookId] = useState<string>();
  const [activeDocumentId, setActiveDocumentId] = useState<string>();
  const [activeUnavailableFeature, setActiveUnavailableFeature] =
    useState<string>();
  const [deleteDocumentId, setDeleteDocumentId] = useState<string>();
  const [editingNotebookId, setEditingNotebookId] = useState<string>();
  const [notebookDraft, setNotebookDraft] = useState<NotebookEditorDraft>(() =>
    createNotebookEditorDraft(),
  );
  const [notebookSearch, setNotebookSearch] = useState("");
  const [notebooks, setNotebooks] = useState(INITIAL_NOTEBOOKS);
  const [notebookSessions, setNotebookSessions] = useState(() =>
    createNotebookSessionMap(INITIAL_NOTEBOOKS),
  );
  const [uploadBatchError, setUploadBatchError] = useState<string>();

  const documentsQuery = useQuery({
    enabled: authState.status === "authenticated",
    queryFn: () => documents.listDocuments(),
    queryKey: DOCUMENTS_QUERY_KEY,
  });

  const documentDetailQuery = useQuery({
    enabled: authState.status === "authenticated" && Boolean(activeDocumentId),
    queryFn: () => documents.viewDocument(activeDocumentId!),
    queryKey: [DOCUMENT_DETAIL_QUERY_KEY, activeDocumentId],
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documents.uploadDocument(file),
    onMutate: () => setUploadBatchError(undefined),
    onError: (error) =>
      setUploadBatchError(toErrorMessage(error, DOCUMENT_UPLOAD_ERROR_MESSAGE)),
    onSuccess: async (document) => {
      if (activeNotebookId) {
        updateNotebookSession(activeNotebookId, (current) => ({
          selectedDocumentIds: addSelectedDocumentId(
            current.selectedDocumentIds,
            document.id,
          ),
        }));
      }
      setActiveDocumentId(document.id);
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documents.deleteDocument(documentId),
    onMutate: (documentId) => setDeleteDocumentId(documentId),
    onSettled: () => setDeleteDocumentId(undefined),
    onSuccess: async (_result, documentId) => {
      setNotebookSessions((current) =>
        Object.fromEntries(
          Object.entries(current).map(([notebookId, session]) => [
            notebookId,
            {
              ...session,
              selectedDocumentIds: session.selectedDocumentIds.filter(
                (selectedId) => selectedId !== documentId,
              ),
            },
          ]),
        ),
      );
      if (activeDocumentId === documentId) {
        setActiveDocumentId(undefined);
      }
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      const notebookId = activeNotebookId;
      if (!notebookId) {
        return;
      }

      const request = createNotebookQuestionRequest({
        conversationId: activeNotebookSession.conversationId,
        question: activeNotebookSession.question,
        selectedDocumentIds: normalizedSelectedDocumentIds,
      });
      if (!request) {
        return;
      }

      const activeNotebookForRequest = notebooks.find(
        (notebook) => notebook.id === notebookId,
      );
      if (shouldAutoNameNotebook(activeNotebookForRequest)) {
        renameNotebook(
          notebookId,
          inferNotebookTitleFromPrompt(request.message),
        );
      }

      updateNotebookSession(notebookId, () => ({ statusText: undefined }));
      await assistant.streamMessage(
        NOTEBOOK_ASSISTANT_KEY,
        request,
        (update) => {
          updateNotebookSession(notebookId, (current) => ({
            conversationId: update.conversationId,
            messages: appendThreadUpdate(current.messages, update),
            statusText: update.type === "status" ? update.text : undefined,
          }));
          if (update.type === "status") {
            return;
          }
        },
      );
      updateNotebookSession(notebookId, () => ({ question: "" }));
    },
  });

  const currentDocuments = documentsQuery.data ?? [];
  const activeDocument =
    documentDetailQuery.data?.id === activeDocumentId
      ? documentDetailQuery.data
      : undefined;
  const activeNotebook = notebooks.find(
    (notebook) => notebook.id === activeNotebookId,
  );
  const activeNotebookSession = activeNotebookId
    ? (notebookSessions[activeNotebookId] ?? createEmptyNotebookSession())
    : createEmptyNotebookSession();
  const normalizedSelectedDocumentIds = normalizeSelectedDocumentIds(
    activeNotebookSession.selectedDocumentIds,
    currentDocuments,
  );
  const sourceCountsByNotebookId = Object.fromEntries(
    notebooks.map((notebook) => [
      notebook.id,
      getNotebookSourceCount(
        notebookSessions[notebook.id] ?? createEmptyNotebookSession(),
        currentDocuments.length,
      ),
    ]),
  );
  const insightCountsByNotebookId = Object.fromEntries(
    notebooks.map((notebook) => [
      notebook.id,
      (notebookSessions[notebook.id] ?? createEmptyNotebookSession()).messages
        .length,
    ]),
  );

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

  function updateNotebookSession(
    notebookId: string,
    update: (current: NotebookSessionState) => Partial<NotebookSessionState>,
  ) {
    setNotebookSessions((current) => {
      const currentSession =
        current[notebookId] ?? createEmptyNotebookSession();

      return {
        ...current,
        [notebookId]: {
          ...currentSession,
          ...update(currentSession),
        },
      };
    });
  }

  function toggleDocument(documentId: string) {
    if (!activeNotebookId) {
      return;
    }

    updateNotebookSession(activeNotebookId, (current) => ({
      selectedDocumentIds: toggleDocumentSelection(
        current.selectedDocumentIds,
        documentId,
      ),
    }));
  }

  function toggleEveryDocument() {
    if (!activeNotebookId) {
      return;
    }

    updateNotebookSession(activeNotebookId, (current) => ({
      selectedDocumentIds: toggleEveryDocumentSelection(
        current.selectedDocumentIds,
        currentDocuments,
      ),
    }));
  }

  function startNewThread() {
    if (!activeNotebookId) {
      return;
    }

    updateNotebookSession(activeNotebookId, () => ({
      conversationId: undefined,
      messages: [],
      statusText: undefined,
    }));
  }

  function changeQuestion(question: string) {
    if (!activeNotebookId) {
      return;
    }

    updateNotebookSession(activeNotebookId, () => ({ question }));
  }

  function createNotebook() {
    const notebook = createNotebookSummary(
      notebooks.length,
      new Date().toISOString(),
    );
    setNotebooks((current) => [...current, notebook]);
    setNotebookSessions((current) => ({
      ...current,
      [notebook.id]: createEmptyNotebookSession(),
    }));
    setActiveNotebookId(notebook.id);
    setNotebookSearch("");
  }

  function editNotebook(notebookId: string) {
    const notebook = notebooks.find((candidate) => candidate.id === notebookId);
    if (!notebook) {
      return;
    }

    setEditingNotebookId(notebookId);
    setNotebookDraft(createNotebookEditorDraft(notebook));
  }

  function saveNotebook() {
    if (!editingNotebookId) {
      return;
    }

    setNotebooks((current) =>
      current.map((notebook) =>
        notebook.id === editingNotebookId
          ? updateNotebookFromDraft(notebook, notebookDraft)
          : notebook,
      ),
    );
    setEditingNotebookId(undefined);
    setNotebookDraft(createNotebookEditorDraft());
  }

  function duplicateNotebook(notebookId: string) {
    const notebook = notebooks.find((candidate) => candidate.id === notebookId);
    if (!notebook) {
      return;
    }

    const duplicatedNotebook = duplicateNotebookSummary(
      notebook,
      notebooks.length,
      new Date().toISOString(),
    );
    setNotebooks((current) => [...current, duplicatedNotebook]);
    setNotebookSessions((current) => ({
      ...current,
      [duplicatedNotebook.id]: {
        ...(current[notebookId] ?? createEmptyNotebookSession()),
        conversationId: undefined,
        messages: [],
        statusText: undefined,
      },
    }));
    setActiveNotebookId(duplicatedNotebook.id);
    setNotebookSearch("");
  }

  function deleteNotebook(notebookId: string) {
    setNotebooks((current) =>
      current.filter((notebook) => notebook.id !== notebookId),
    );
    setNotebookSessions((current) => {
      const next = { ...current };
      delete next[notebookId];
      return next;
    });
    if (activeNotebookId === notebookId) {
      setActiveNotebookId(undefined);
    }
    if (editingNotebookId === notebookId) {
      setEditingNotebookId(undefined);
      setNotebookDraft(createNotebookEditorDraft());
    }
  }

  function renameNotebook(notebookId: string, title: string) {
    setNotebooks((current) =>
      current.map((notebook) =>
        notebook.id === notebookId
          ? {
              ...notebook,
              category:
                notebook.category === "New workspace"
                  ? "Member notebook"
                  : notebook.category,
              title,
            }
          : notebook,
      ),
    );
  }

  return (
    <NotebookWorkspaceView
      activeNotebook={activeNotebook}
      activeDocument={activeDocument}
      activeDocumentError={toErrorMessage(documentDetailQuery.error)}
      activeDocumentId={activeDocumentId}
      activeUnavailableFeature={activeUnavailableFeature}
      authState={authState}
      conversationId={activeNotebookSession.conversationId}
      deleteDocumentId={deleteDocumentId}
      documents={currentDocuments}
      documentsError={toErrorMessage(documentsQuery.error)}
      editingNotebook={notebooks.find(
        (notebook) => notebook.id === editingNotebookId,
      )}
      insightCountsByNotebookId={insightCountsByNotebookId}
      isAsking={askMutation.isPending}
      isDeleting={deleteMutation.isPending}
      isDocumentLoading={
        Boolean(activeDocumentId) && documentDetailQuery.isFetching
      }
      isDocumentsLoading={documentsQuery.isLoading}
      isNotebookListVisible={!activeNotebookId}
      isUploading={uploadMutation.isPending}
      messages={activeNotebookSession.messages}
      onAskQuestion={() => askMutation.mutate()}
      onBackToNotebooks={() => setActiveNotebookId(undefined)}
      onCancelEditNotebook={() => {
        setEditingNotebookId(undefined);
        setNotebookDraft(createNotebookEditorDraft());
      }}
      onCreateNotebook={createNotebook}
      onDismissUnavailableFeature={() => setActiveUnavailableFeature(undefined)}
      onDeleteNotebook={deleteNotebook}
      onDeleteDocument={(documentId) => deleteMutation.mutate(documentId)}
      onDuplicateNotebook={duplicateNotebook}
      onEditNotebook={editNotebook}
      onNewThread={startNewThread}
      onOpenDocument={setActiveDocumentId}
      onNotebookDraftChange={setNotebookDraft}
      onNotebookSearchChange={setNotebookSearch}
      onQuestionChange={changeQuestion}
      onSaveNotebook={saveNotebook}
      onSelectNotebook={setActiveNotebookId}
      onShowChat={() => setActiveDocumentId(undefined)}
      onSignIn={() => void auth.signIn()}
      onSignOut={() => void auth.signOut()}
      onToggleDocument={toggleDocument}
      onToggleEveryDocument={toggleEveryDocument}
      onUnavailableFeature={setActiveUnavailableFeature}
      onUploadFiles={handleUploadFiles}
      operationError={
        uploadBatchError ??
        toErrorMessage(
          uploadMutation.error ?? deleteMutation.error ?? askMutation.error,
        )
      }
      notebookDraft={notebookDraft}
      notebookSearch={notebookSearch}
      notebooks={notebooks}
      question={activeNotebookSession.question}
      selectedDocumentIds={normalizedSelectedDocumentIds}
      sourceCountsByNotebookId={sourceCountsByNotebookId}
      statusText={activeNotebookSession.statusText}
    />
  );
}
