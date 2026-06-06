export interface AppConfig {
  apiBaseUrl: string;
  authMode: "cognito" | "local";
  cognitoAuthority: string;
  cognitoClientId: string;
  cognitoRedirectUri: string;
  localAuthEmail: string;
  localAuthSubject: string;
  localAuthUsername: string;
}

export function readAppConfig(): AppConfig {
  const origin = typeof window === "undefined" ? "http://localhost:5173" : window.location.origin;

  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
    authMode: import.meta.env.VITE_AUTH_MODE === "cognito" ? "cognito" : "local",
    cognitoAuthority: import.meta.env.VITE_COGNITO_AUTHORITY ?? "",
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
    cognitoRedirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI ?? origin,
    localAuthEmail: import.meta.env.VITE_LOCAL_AUTH_EMAIL ?? "local.user@fountainlife.local",
    localAuthSubject: import.meta.env.VITE_LOCAL_AUTH_USER_ID ?? "local-user",
    localAuthUsername: import.meta.env.VITE_LOCAL_AUTH_USERNAME ?? "Local User",
  };
}
