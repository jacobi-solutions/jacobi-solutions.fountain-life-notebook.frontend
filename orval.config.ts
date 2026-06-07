import { defineConfig } from "orval";
import { existsSync } from "node:fs";

// Worktree layout keeps backend/frontend siblings under worktrees/<milestone>/.
const worktreeOpenApi = "../backend/openapi/fountain-life-api.json";
const defaultOpenApi = "../JacobiSolutions.FountainLifeNotebook.Backend/openapi/fountain-life-api.json";

export default defineConfig({
  fountainLifeApi: {
    input: existsSync(worktreeOpenApi) ? worktreeOpenApi : defaultOpenApi,
    output: {
      client: "fetch",
      override: {
        mutator: {
          name: "generatedApiClient",
          path: "./app/api/generated-api-client.ts",
        },
      },
      target: "app/api/generated/fountain-life-api.ts",
    },
  },
});
