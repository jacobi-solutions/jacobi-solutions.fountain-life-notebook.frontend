import { describe, expect, it, vi } from "vitest";
import * as generatedApi from "../api/generated/fountain-life-api";
import { NotebooksService } from "./notebooks-service";

vi.mock("../api/generated/fountain-life-api", () => ({
  createNotebook: vi.fn(),
  deleteNotebook: vi.fn(),
  inviteNotebookMember: vi.fn(),
  listNotebooks: vi.fn(),
  updateNotebook: vi.fn(),
}));

describe("NotebooksService", () => {
  it("lists persisted notebooks through the API client", async () => {
    vi.mocked(generatedApi.listNotebooks).mockResolvedValue({
      data: {
        errors: [],
        isSuccess: true,
        notebooks: [notebook],
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new NotebooksService();

    await expect(service.listNotebooks()).resolves.toEqual([notebook]);
    expect(generatedApi.listNotebooks).toHaveBeenCalledWith({});
  });

  it("creates notebooks through the API client", async () => {
    vi.mocked(generatedApi.createNotebook).mockResolvedValue({
      data: {
        errors: [],
        isSuccess: true,
        notebook,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new NotebooksService();

    await expect(service.createNotebook({ title: "Labs" })).resolves.toEqual(
      notebook,
    );
    expect(generatedApi.createNotebook).toHaveBeenCalledWith({
      category: undefined,
      description: undefined,
      title: "Labs",
    });
  });

  it("updates notebooks through the API client", async () => {
    vi.mocked(generatedApi.updateNotebook).mockResolvedValue({
      data: {
        errors: [],
        isSuccess: true,
        notebook,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new NotebooksService();

    await expect(
      service.updateNotebook({ notebookId: "notebook-1", title: "Updated" }),
    ).resolves.toEqual(notebook);
    expect(generatedApi.updateNotebook).toHaveBeenCalledWith({
      notebookId: "notebook-1",
      title: "Updated",
    });
  });

  it("deletes notebooks through the API client", async () => {
    vi.mocked(generatedApi.deleteNotebook).mockResolvedValue({
      data: {
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new NotebooksService();

    await expect(service.deleteNotebook("notebook-1")).resolves.toBeUndefined();
    expect(generatedApi.deleteNotebook).toHaveBeenCalledWith({
      notebookId: "notebook-1",
    });
  });

  it("invites notebook members through the API client", async () => {
    vi.mocked(generatedApi.inviteNotebookMember).mockResolvedValue({
      data: {
        errors: [],
        inviteDelivery: "cognito",
        isSuccess: true,
        notebook,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new NotebooksService();

    await expect(
      service.inviteNotebookMember({
        email: "doctor@example.com",
        notebookId: "notebook-1",
        role: "clinician",
      }),
    ).resolves.toEqual({ inviteDelivery: "cognito", notebook });
    expect(generatedApi.inviteNotebookMember).toHaveBeenCalledWith({
      email: "doctor@example.com",
      notebookId: "notebook-1",
      role: "clinician",
    });
  });
});

const notebook = {
  category: "Diagnostics",
  createdDateUtc: "2026-06-06T12:00:00.000Z",
  description: "Source set.",
  id: "notebook-1",
  lastUpdatedDateUtc: "2026-06-06T12:00:00.000Z",
  members: [
    {
      email: "owner@example.com",
      role: "owner" as const,
      status: "active" as const,
      userId: "owner-1",
    },
  ],
  role: "owner" as const,
  sourceCount: 2,
  title: "Labs",
  workspaceId: "workspace-1",
};
