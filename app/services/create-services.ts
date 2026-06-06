import { QueryClient } from "@tanstack/react-query";
import { readAppConfig } from "../core/app-config";
import { AccountsService } from "./accounts-service";
import { ApiClient } from "./api-client";
import { AssistantService } from "./assistant-service";
import { AuthService } from "./auth-service";
import { DocumentsService } from "./documents-service";

export interface FountainLifeServices {
  accounts: AccountsService;
  api: ApiClient;
  assistant: AssistantService;
  auth: AuthService;
  documents: DocumentsService;
  queryClient: QueryClient;
}

export function createServices(): FountainLifeServices {
  const config = readAppConfig();
  const auth = new AuthService(config);
  const api = new ApiClient(config.apiBaseUrl, auth);

  return {
    accounts: new AccountsService(api),
    api,
    assistant: new AssistantService(api),
    auth,
    documents: new DocumentsService(api),
    queryClient: new QueryClient(),
  };
}
