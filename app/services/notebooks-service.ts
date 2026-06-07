import {
  createNotebook as createNotebookApi,
  deleteNotebook as deleteNotebookApi,
  inviteNotebookMember as inviteNotebookMemberApi,
  type InviteNotebookMemberRequestRole,
  listNotebooks as listNotebooksApi,
  type NotebookSummary as GeneratedNotebookSummary,
  updateNotebook as updateNotebookApi,
} from "../api/generated/fountain-life-api";
import { assertResponseSuccess } from "./base-contracts";

export type NotebookSummary = GeneratedNotebookSummary;
export type NotebookMemberRole = InviteNotebookMemberRequestRole;

export interface SaveNotebookInput {
  category?: string;
  description?: string;
  notebookId: string;
  title?: string;
}

export class NotebooksService {
  async listNotebooks() {
    const response = await listNotebooksApi({});
    assertResponseSuccess(response.data);
    return response.data.notebooks;
  }

  async createNotebook(input: Partial<SaveNotebookInput> = {}) {
    const response = await createNotebookApi({
      category: input.category,
      description: input.description,
      title: input.title,
    });
    assertResponseSuccess(response.data);
    return response.data.notebook;
  }

  async updateNotebook(input: SaveNotebookInput) {
    const response = await updateNotebookApi(input);
    assertResponseSuccess(response.data);
    return response.data.notebook;
  }

  async deleteNotebook(notebookId: string) {
    const response = await deleteNotebookApi({ notebookId });
    assertResponseSuccess(response.data);
  }

  async inviteNotebookMember(input: {
    email: string;
    notebookId: string;
    role: NotebookMemberRole;
  }) {
    const response = await inviteNotebookMemberApi(input);
    assertResponseSuccess(response.data);
    return {
      inviteDelivery: response.data.inviteDelivery,
      notebook: response.data.notebook,
    };
  }
}
