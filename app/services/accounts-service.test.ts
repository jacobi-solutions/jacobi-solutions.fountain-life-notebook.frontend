import { describe, expect, it, vi } from "vitest";
import * as generatedApi from "../api/generated/fountain-life-api";
import { AccountsService } from "./accounts-service";

vi.mock("../api/generated/fountain-life-api", () => ({
  registerCurrentAccount: vi.fn(),
}));

describe("AccountsService", () => {
  it("registers the current user through the generated API client", async () => {
    const account = {
      cognitoSubject: "subject-123",
      email: "user@example.com",
      id: "account-1",
      username: "user@example.com",
    };
    vi.mocked(generatedApi.registerCurrentAccount).mockResolvedValue({
      data: {
        account,
        errors: [],
        isSuccess: true,
      },
      headers: new Headers(),
      status: 200,
    });
    const service = new AccountsService();

    await expect(service.registerCurrentUser()).resolves.toEqual(account);
    expect(generatedApi.registerCurrentAccount).toHaveBeenCalledWith({});
  });
});
