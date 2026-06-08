import { describe, expect, it } from "vitest";
import { OidcClient } from "oidc-client-ts";

describe("Cognito logout URL", () => {
  it("uses Cognito's logout_uri parameter without post_logout_redirect_uri", async () => {
    const client = new OidcClient({
      authority: "https://example.auth.us-east-1.amazoncognito.com",
      client_id: "client-id",
      redirect_uri: "https://app.example.com/auth/callback",
      response_type: "code",
      scope: "openid email profile",
      metadata: {
        authorization_endpoint:
          "https://example.auth.us-east-1.amazoncognito.com/oauth2/authorize",
        end_session_endpoint:
          "https://example.auth.us-east-1.amazoncognito.com/logout",
        issuer: "https://example.auth.us-east-1.amazoncognito.com",
        jwks_uri:
          "https://example.auth.us-east-1.amazoncognito.com/.well-known/jwks.json",
        token_endpoint:
          "https://example.auth.us-east-1.amazoncognito.com/oauth2/token",
      },
    });

    const request = await client.createSignoutRequest({
      client_id: "client-id",
      extraQueryParams: {
        logout_uri: "https://app.example.com/",
      },
    });

    const url = new URL(request.url);
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("logout_uri")).toBe("https://app.example.com/");
    expect(url.searchParams.has("post_logout_redirect_uri")).toBe(false);
    expect(url.searchParams.has("redirect_uri")).toBe(false);
  });
});
