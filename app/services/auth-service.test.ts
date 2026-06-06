import { describe, expect, it } from "vitest";
import { AuthService } from "./auth-service";
import type { AppConfig } from "../core/app-config";

describe("AuthService", () => {
  it("starts authenticated in local mode and returns local identity headers", async () => {
    const auth = new AuthService({
      ...baseConfig,
      authMode: "local",
      localAuthEmail: "interviewer@example.com",
      localAuthSubject: "interviewer-1",
      localAuthUsername: "Interviewer",
    });

    expect(auth.getSnapshot()).toEqual({
      email: "interviewer@example.com",
      status: "authenticated",
      subject: "interviewer-1",
    });
    await expect(auth.getRequestHeaders()).resolves.toEqual({
      "X-Local-User-Email": "interviewer@example.com",
      "X-Local-User-Id": "interviewer-1",
      "X-Local-Username": "Interviewer",
    });
  });

  it("supports local sign out and sign in without Cognito", async () => {
    const auth = new AuthService({ ...baseConfig, authMode: "local" });

    await auth.signOut();
    expect(auth.getSnapshot()).toEqual({
      email: null,
      status: "signed-out",
      subject: null,
    });

    await auth.signIn();
    expect(auth.getSnapshot()).toEqual({
      email: "local.user@fountainlife.local",
      status: "authenticated",
      subject: "local-user",
    });
  });
});

const baseConfig: AppConfig = {
  apiBaseUrl: "http://localhost:3000/api",
  authMode: "local",
  cognitoAuthority: "",
  cognitoClientId: "",
  cognitoRedirectUri: "http://localhost:5173",
  localAuthEmail: "local.user@fountainlife.local",
  localAuthSubject: "local-user",
  localAuthUsername: "Local User",
};
