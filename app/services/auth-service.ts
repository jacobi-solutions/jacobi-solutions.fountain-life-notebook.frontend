import { UserManager, type User } from "oidc-client-ts";
import type { AppConfig } from "../core/app-config";

export interface AuthSnapshot {
  email: string | null;
  status: "authenticated" | "loading" | "signed-out";
  subject: string | null;
}

type Listener = () => void;
type CognitoSignoutRedirectArgs = NonNullable<
  Parameters<UserManager["signoutRedirect"]>[0]
> & {
  client_id: string;
};

export class AuthService {
  private readonly config: AppConfig;
  private readonly homePageRedirectUri: string;
  private readonly listeners = new Set<Listener>();
  private readonly manager: UserManager | null;
  private snapshot: AuthSnapshot = {
    email: null,
    status: "loading",
    subject: null,
  };

  constructor(config: AppConfig) {
    this.config = config;
    this.homePageRedirectUri = toHomePageRedirectUri(config.cognitoRedirectUri);
    this.manager =
      config.authMode === "cognito" &&
      config.cognitoAuthority &&
      config.cognitoClientId
        ? new UserManager({
            authority: config.cognitoAuthority,
            client_id: config.cognitoClientId,
            redirect_uri: config.cognitoRedirectUri,
            response_type: "code",
            scope: "openid email profile",
          })
        : null;

    if (!this.manager) {
      this.setSnapshot(
        config.authMode === "local"
          ? {
              email: config.localAuthEmail,
              status: "authenticated",
              subject: config.localAuthSubject,
            }
          : { email: null, status: "signed-out", subject: null },
      );
      return;
    }

    this.manager.events.addUserLoaded((user) => this.applyUser(user));
    this.manager.events.addUserUnloaded(() =>
      this.setSnapshot({ email: null, status: "signed-out", subject: null }),
    );

    void this.loadUser();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.snapshot;
  }

  async completeSignInFromRedirect() {
    if (!this.manager || !window.location.search.includes("code=")) {
      return;
    }

    const user = await this.manager.signinRedirectCallback();
    this.applyUser(user);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  async getAccessToken() {
    const user = await this.manager?.getUser();
    return user?.access_token ?? null;
  }

  async getRequestHeaders(): Promise<Record<string, string>> {
    if (this.config.authMode === "local") {
      return {
        "X-Local-User-Email": this.config.localAuthEmail,
        "X-Local-User-Id": this.config.localAuthSubject,
        "X-Local-Username": this.config.localAuthUsername,
      };
    }

    const token = await this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async signIn() {
    if (this.config.authMode === "local") {
      this.setSnapshot({
        email: this.config.localAuthEmail,
        status: "authenticated",
        subject: this.config.localAuthSubject,
      });
      return;
    }

    if (!this.manager) {
      throw new Error("Cognito OIDC settings are not configured.");
    }

    await this.manager.signinRedirect();
  }

  async signOut() {
    if (this.config.authMode === "local") {
      this.setSnapshot({ email: null, status: "signed-out", subject: null });
      this.redirectToHomePage();
      return;
    }

    if (!this.manager) {
      this.setSnapshot({ email: null, status: "signed-out", subject: null });
      return;
    }

    // Reaching this branch means the manager was constructed with a non-empty client id.
    const signOutArgs: CognitoSignoutRedirectArgs = {
      client_id: this.config.cognitoClientId,
      extraQueryParams: {
        logout_uri: this.homePageRedirectUri,
      },
    };

    await this.manager.signoutRedirect(signOutArgs);
  }

  private redirectToHomePage() {
    if (typeof window === "undefined") {
      return;
    }

    window.location.assign(this.homePageRedirectUri);
  }

  private async loadUser() {
    const user = await this.manager?.getUser();
    this.applyUser(user ?? null);
  }

  private applyUser(user: User | null) {
    if (!user || user.expired) {
      this.setSnapshot({ email: null, status: "signed-out", subject: null });
      return;
    }

    this.setSnapshot({
      email: typeof user.profile.email === "string" ? user.profile.email : null,
      status: "authenticated",
      subject: user.profile.sub ?? null,
    });
  }

  private setSnapshot(snapshot: AuthSnapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) {
      listener();
    }
  }
}

function toHomePageRedirectUri(redirectUri: string) {
  try {
    return new URL("/", redirectUri).toString();
  } catch {
    return "/";
  }
}
