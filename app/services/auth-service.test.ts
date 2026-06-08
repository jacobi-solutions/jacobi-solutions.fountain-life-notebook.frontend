import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth-service";
import type { AppConfig } from "../core/app-config";

const userManagerSettings = vi.hoisted(() => [] as unknown[]);
const userManagerInstances = vi.hoisted(
  () =>
    [] as Array<{
      signoutRedirect: ReturnType<typeof vi.fn>;
    }>,
);

vi.mock("oidc-client-ts", () => ({
  UserManager: vi.fn(function MockUserManager(
    this: {
      events: {
        addUserLoaded: ReturnType<typeof vi.fn>;
        addUserUnloaded: ReturnType<typeof vi.fn>;
      };
      getUser: ReturnType<typeof vi.fn>;
      signinRedirect: ReturnType<typeof vi.fn>;
      signinRedirectCallback: ReturnType<typeof vi.fn>;
      signoutRedirect: ReturnType<typeof vi.fn>;
    },
    settings: unknown,
  ) {
    userManagerSettings.push(settings);
    this.events = {
      addUserLoaded: vi.fn(),
      addUserUnloaded: vi.fn(),
    };
    this.getUser = vi.fn().mockResolvedValue(null);
    this.signinRedirect = vi.fn();
    this.signinRedirectCallback = vi.fn();
    this.signoutRedirect = vi.fn();
    userManagerInstances.push(this);
  }),
}));

describe("AuthService", () => {
  afterEach(() => {
    userManagerSettings.length = 0;
    userManagerInstances.length = 0;
    vi.unstubAllGlobals();
  });

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

  it("redirects local sign out to the home page", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });
    const auth = new AuthService({
      ...baseConfig,
      authMode: "local",
      cognitoRedirectUri: "https://app.example.com/auth/callback",
    });

    await auth.signOut();

    expect(assign).toHaveBeenCalledWith("https://app.example.com/");
  });

  it("configures Cognito sign in with the callback URL", () => {
    new AuthService({
      ...baseConfig,
      authMode: "cognito",
      cognitoAuthority:
        "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example",
      cognitoClientId: "client-id",
      cognitoRedirectUri: "https://app.example.com/auth/callback",
    });

    expect(userManagerSettings).toHaveLength(1);
    expect(userManagerSettings[0]).toMatchObject({
      redirect_uri: "https://app.example.com/auth/callback",
    });
  });

  it("sends Cognito hosted UI logout parameters with the workspace return URL", async () => {
    const auth = new AuthService({
      ...baseConfig,
      authMode: "cognito",
      cognitoAuthority:
        "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example",
      cognitoClientId: "client-id",
      cognitoRedirectUri: "https://app.example.com/auth/callback",
    });

    await auth.signOut();

    expect(userManagerInstances[0]?.signoutRedirect).toHaveBeenCalledWith({
      client_id: "client-id",
      extraQueryParams: {
        logout_uri: "https://app.example.com/",
      },
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
