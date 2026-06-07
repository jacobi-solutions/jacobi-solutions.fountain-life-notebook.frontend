import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useServices } from "../../services/service-context";
import {
  DOCUMENT_DETAIL_QUERY_KEY,
  DOCUMENTS_QUERY_KEY,
  DOCUMENT_UPLOAD_ERROR_MESSAGE,
  NOTEBOOK_ASSISTANT_KEY,
  NOTEBOOKS_QUERY_KEY,
} from "./notebook.constants";
import type { NotebookEditorDraft } from "./notebook-workspace.model";
import { NotebookWorkspaceView } from "./notebook-workspace.view";
import {
  addSelectedDocumentId,
  appendThreadUpdate,
  createEmptyNotebookSession,
  createNotebookEditorDraft,
  createNotebookInviteDraft,
  createNotebookQuestionRequest,
  decorateNotebookSummary,
  inferNotebookTitleFromPrompt,
  normalizeSelectedDocumentIds,
  shouldAutoNameNotebook,
  toErrorMessage,
  toggleDocumentSelection,
  toggleEveryDocumentSelection,
  type NotebookSessionState,
} from "./notebook-workspace.vm";
import "./notebook-workspace.css";

export function NotebookWorkspace() {
  const { assistant, auth, documents, notebooks: notebooksService } = useServices();
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
  const [isInviteMemberVisible, setIsInviteMemberVisible] = useState(false);
  const [notebookInviteDraft, setNotebookInviteDraft] = useState(() =>
    createNotebookInviteDraft(),
  );
  const [notebookSearch, setNotebookSearch] = useState("");
  const [notebookSessions, setNotebookSessions] = useState<
    Record<string, NotebookSessionState>
  >({});
  const [uploadBatchError, setUploadBatchError] = useState<string>();

  const notebooksQuery = useQuery({
    enabled: authState.status === "authenticated",
    queryFn: () => notebooksService.listNotebooks(),
    queryKey: NOTEBOOKS_QUERY_KEY,
  });
  const notebooks = useMemo(
    () => (notebooksQuery.data ?? []).map(decorateNotebookSummary),
    [notebooksQuery.data],
  );
  const activeNotebook = notebooks.find(
    (notebook) => notebook.id === activeNotebookId,
  );

  const documentsQuery = useQuery({
    enabled: authState.status === "authenticated" && Boolean(activeNotebookId),
    queryFn: () => documents.listDocuments(activeNotebookId!),
    queryKey: [...DOCUMENTS_QUERY_KEY, activeNotebookId],
  });

  const documentDetailQuery = useQuery({
    enabled:
      authState.status === "authenticated" &&
      Boolean(activeNotebookId) &&
      Boolean(activeDocumentId),
    queryFn: () => documents.viewDocument(activeDocumentId!, activeNotebookId!),
    queryKey: [DOCUMENT_DETAIL_QUERY_KEY, activeNotebookId, activeDocumentId],
  });

  const createNotebookMutation = useMutation({
    mutationFn: () => notebooksService.createNotebook(),
    onSuccess: async (notebook) => {
      setActiveNotebookId(notebook.id);
      setNotebookSearch("");
      await queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY });
    },
  });

  const updateNotebookMutation = useMutation({
    mutationFn: (input: {
      category?: string;
      description?: string;
      notebookId: string;
      title?: string;
    }) => notebooksService.updateNotebook(input),
    onSuccess: async () => {
      setEditingNotebookId(undefined);
      setNotebookDraft(createNotebookEditorDraft());
      await queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY });
    },
  });

  const deleteNotebookMutation = useMutation({
    mutationFn: (notebookId: string) => notebooksService.deleteNotebook(notebookId),
    onSuccess: async (_result, notebookId) => {
      setNotebookSessions((current) => {
        const next = { ...current };
        delete next[notebookId];
        return next;
      });
      if (activeNotebookId === notebookId) {
        setActiveNotebookId(undefined);
        setActiveDocumentId(undefined);
      }
      if (editingNotebookId === notebookId) {
        setEditingNotebookId(undefined);
        setNotebookDraft(createNotebookEditorDraft());
      }
      await queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY });
    },
  });

  const inviteNotebookMemberMutation = useMutation({
    mutationFn: ({
      email,
      notebookId,
      role,
    }: {
      email: string;
      notebookId: string;
      role: typeof notebookInviteDraft.role;
    }) =>
      notebooksService.inviteNotebookMember({
        email,
        notebookId,
        role,
      }),
    onSuccess: async () => {
      setIsInviteMemberVisible(false);
      setNotebookInviteDraft(createNotebookInviteDraft());
      await queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, notebookId }: { file: File; notebookId: string }) =>
      documents.uploadDocument(file, notebookId),
    onMutate: () => setUploadBatchError(undefined),
    onError: (error) =>
      setUploadBatchError(toErrorMessage(error, DOCUMENT_UPLOAD_ERROR_MESSAGE)),
    onSuccess: async (document, { notebookId }) => {
      updateNotebookSession(notebookId, (current) => ({
        selectedDocumentIds: addSelectedDocumentId(
          current.selectedDocumentIds,
          document.id,
        ),
      }));
      setActiveDocumentId(document.id);
      await invalidateNotebookData(notebookId);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      documentId,
      notebookId,
    }: {
      documentId: string;
      notebookId: string;
    }) => documents.deleteDocument(documentId, notebookId),
    onMutate: ({ documentId }) => setDeleteDocumentId(documentId),
    onSettled: () => setDeleteDocumentId(undefined),
    onSuccess: async (_result, { documentId, notebookId }) => {
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
      await invalidateNotebookData(notebookId);
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
        notebookId,
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
        try {
          await updateNotebookMutation.mutateAsync({
            category:
              activeNotebookForRequest?.category === "New workspace"
                ? "Member notebook"
                : activeNotebookForRequest?.category,
            description: activeNotebookForRequest?.description,
            notebookId,
            title: inferNotebookTitleFromPrompt(request.message),
          });
        } catch {
          // Best-effort title cleanup should not prevent the question from sending.
        }
      }

      updateNotebookSession(notebookId, () => ({ statusText: undefined }));
      await assistant.streamMessage(NOTEBOOK_ASSISTANT_KEY, request, (update) => {
        updateNotebookSession(notebookId, (current) => ({
          conversationId: update.conversationId,
          messages: appendThreadUpdate(current.messages, update),
          statusText: update.type === "status" ? update.text : undefined,
        }));
      });
      updateNotebookSession(notebookId, () => ({ question: "" }));
    },
  });

  const currentDocuments = documentsQuery.data ?? [];
  const activeDocument =
    documentDetailQuery.data?.id === activeDocumentId
      ? documentDetailQuery.data
      : undefined;
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
      notebook.id === activeNotebookId
        ? currentDocuments.length
        : notebook.sourceCount,
    ]),
  );
  const insightCountsByNotebookId = Object.fromEntries(
    notebooks.map((notebook) => [
      notebook.id,
      (notebookSessions[notebook.id] ?? createEmptyNotebookSession()).messages
        .length,
    ]),
  );

  async function invalidateNotebookData(notebookId?: string) {
    const invalidations = [
      queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY }),
    ];
    if (notebookId) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: [...DOCUMENTS_QUERY_KEY, notebookId],
        }),
      );
    }

    await Promise.all(invalidations);
  }

  function handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0 || !activeNotebookId) {
      return;
    }

    void uploadFiles(Array.from(files), activeNotebookId);
  }

  async function uploadFiles(files: File[], notebookId: string) {
    try {
      for (const file of files) {
        await uploadMutation.mutateAsync({ file, notebookId });
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

    updateNotebookMutation.mutate({
      category: notebookDraft.category,
      description: notebookDraft.description,
      notebookId: editingNotebookId,
      title: notebookDraft.title,
    });
  }

  function sendInvite() {
    if (!activeNotebookId) {
      return;
    }

    inviteNotebookMemberMutation.mutate({
      email: notebookInviteDraft.email,
      notebookId: activeNotebookId,
      role: notebookInviteDraft.role,
    });
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
      isInviteMemberVisible={isInviteMemberVisible}
      isInvitingMember={inviteNotebookMemberMutation.isPending}
      isNotebookListVisible={!activeNotebookId}
      isNotebooksLoading={notebooksQuery.isLoading}
      isUploading={uploadMutation.isPending}
      messages={activeNotebookSession.messages}
      onAskQuestion={() => askMutation.mutate()}
      onBackToNotebooks={() => setActiveNotebookId(undefined)}
      onCancelEditNotebook={() => {
        setEditingNotebookId(undefined);
        setNotebookDraft(createNotebookEditorDraft());
      }}
      onCancelInviteMember={() => {
        setIsInviteMemberVisible(false);
        setNotebookInviteDraft(createNotebookInviteDraft());
      }}
      onCreateNotebook={() => createNotebookMutation.mutate()}
      onDismissUnavailableFeature={() => setActiveUnavailableFeature(undefined)}
      onDeleteNotebook={(notebookId) => deleteNotebookMutation.mutate(notebookId)}
      onDeleteDocument={(documentId) => {
        if (activeNotebookId) {
          deleteMutation.mutate({ documentId, notebookId: activeNotebookId });
        }
      }}
      onEditNotebook={editNotebook}
      onInviteDraftChange={setNotebookInviteDraft}
      onNewThread={startNewThread}
      onOpenDocument={setActiveDocumentId}
      onNotebookDraftChange={setNotebookDraft}
      onNotebookSearchChange={setNotebookSearch}
      onQuestionChange={changeQuestion}
      onSaveNotebook={saveNotebook}
      onSendInvite={sendInvite}
      onStartInviteMember={() => setIsInviteMemberVisible(true)}
      onSelectNotebook={(notebookId) => {
        setActiveNotebookId(notebookId);
        setActiveDocumentId(undefined);
      }}
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
          createNotebookMutation.error ??
            updateNotebookMutation.error ??
            deleteNotebookMutation.error ??
            inviteNotebookMemberMutation.error ??
            uploadMutation.error ??
            deleteMutation.error ??
            askMutation.error,
        )
      }
      notebooksError={toErrorMessage(notebooksQuery.error)}
      notebookDraft={notebookDraft}
      notebookInviteDraft={notebookInviteDraft}
      notebookSearch={notebookSearch}
      notebooks={notebooks}
      question={activeNotebookSession.question}
      selectedDocumentIds={normalizedSelectedDocumentIds}
      sourceCountsByNotebookId={sourceCountsByNotebookId}
      statusText={activeNotebookSession.statusText}
    />
  );
}
