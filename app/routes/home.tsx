import type { Route } from "./+types/home";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useServices } from "../services/service-context";
import type { AssistantThreadUpdate } from "../services/assistant-service";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fountain Life Notebook" },
    { name: "description", content: "Fountain Life interview NotebookLM-style app" },
  ];
}

export default function Home() {
  const { accounts, assistant, auth } = useServices();
  const queryClient = useQueryClient();
  const authState = useAuth();
  const [conversationId, setConversationId] = useState<string>();
  const [message, setMessage] = useState("Create a support request for my onboarding issue.");
  const [participantIds, setParticipantIds] = useState("");
  const [updates, setUpdates] = useState<AssistantThreadUpdate[]>([]);

  const assistantsQuery = useQuery({
    queryKey: ["assistants"],
    queryFn: () => assistant.listAssistants(),
    enabled: authState.status === "authenticated",
  });

  const registerMutation = useMutation({
    mutationFn: () => accounts.registerCurrentUser(),
  });

  const conversationQuery = useQuery({
    queryKey: ["assistant-conversation", conversationId],
    queryFn: () => assistant.getConversation(conversationId as string),
    enabled: authState.status === "authenticated" && !!conversationId,
  });

  const streamMutation = useMutation({
    mutationFn: async () => {
      await assistant.streamMessage(
        "support",
        {
          conversationId,
          message,
          participantUserIds: parseParticipantIds(participantIds),
        },
        (update) => {
          setConversationId(update.conversationId);
          setUpdates((current) => [...current, update]);
        },
      );
      await queryClient.invalidateQueries({ queryKey: ["assistant-conversation"] });
    },
  });

  function startNewThread() {
    setConversationId(undefined);
    setUpdates([]);
    queryClient.removeQueries({ queryKey: ["assistant-conversation"] });
  }

  function parseParticipantIds(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const visibleUpdates = updates.filter((update) => update.type === "message");

  return (
    <main className="shell">
      <section className="topbar" aria-label="Fountain Life Notebook application header">
        <div>
          <p className="eyebrow">Fountain Life Interview</p>
          <h1>A NotebookLM-style workspace for local document Q&A.</h1>
        </div>
        <div className="session-actions">
          <span className={`status status-${authState.status}`}>{authState.status}</span>
          {authState.status === "authenticated" ? (
            <button type="button" onClick={() => void auth.signOut()}>
              Sign out
            </button>
          ) : (
            <button type="button" onClick={() => void auth.signIn()}>
              Sign in
            </button>
          )}
        </div>
      </section>

      <section className="workspace" aria-label="Fountain Life Notebook workspace">
        <div className="panel account-panel">
          <h2>Account</h2>
          <dl>
            <dt>Email</dt>
            <dd>{authState.email ?? "Not signed in"}</dd>
            <dt>Subject</dt>
            <dd>{authState.subject ?? "Unavailable"}</dd>
          </dl>
          <button
            type="button"
            disabled={authState.status !== "authenticated" || registerMutation.isPending}
            onClick={() => registerMutation.mutate()}
          >
            Register API account
          </button>
          {registerMutation.data ? (
            <p className="result">Registered {registerMutation.data.email}</p>
          ) : null}
          {registerMutation.error ? (
            <p className="error">{registerMutation.error.message}</p>
          ) : null}
        </div>

        <div className="panel assistant-panel">
          <div className="panel-title-row">
            <h2>Assistant</h2>
            <button type="button" className="secondary-button" onClick={startNewThread}>
              New thread
            </button>
          </div>
          <p className="muted">
            {assistantsQuery.data?.[0]?.description ??
              "Sign in to load assistant definitions from the Nest API."}
          </p>
          <dl className="conversation-meta">
            <dt>Conversation</dt>
            <dd>{conversationId ?? "New thread"}</dd>
            <dt>Participants</dt>
            <dd>{conversationQuery.data?.participants.length ?? "Not loaded"}</dd>
          </dl>
          <label className="field">
            <span>Additional participant ids</span>
            <input
              value={participantIds}
              onChange={(event) => setParticipantIds(event.currentTarget.value)}
              placeholder="user-2, user-3"
            />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
              rows={4}
            />
          </label>
          <button
            type="button"
            disabled={authState.status !== "authenticated" || streamMutation.isPending}
            onClick={() => streamMutation.mutate()}
          >
            {conversationId ? "Continue thread" : "Start thread"}
          </button>
          {streamMutation.error ? <p className="error">{streamMutation.error.message}</p> : null}
          {conversationQuery.error ? <p className="error">{conversationQuery.error.message}</p> : null}
        </div>

        <div className="panel stream-panel">
          <h2>Conversation</h2>
          <ol>
            {visibleUpdates.length === 0 ? (
              <li className="muted">No conversation messages yet.</li>
            ) : (
              visibleUpdates.map((update, index) => (
                <li key={`${update.messageId ?? update.conversationId}-${index}`} className={`role-${update.role}`}>
                  <span>{update.role}</span>
                  <p>{update.text}</p>
                </li>
              ))
            )}
          </ol>
        </div>
      </section>
    </main>
  );
}
