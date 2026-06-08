import { defineConfig } from "orval";
import { existsSync } from "node:fs";

// Worktree layout keeps backend/frontend siblings under worktrees/<milestone>/.
const envOpenApi = process.env.FOUNTAIN_LIFE_OPENAPI_PATH;
const worktreeOpenApi = "../backend/openapi/fountain-life-api.json";
const defaultOpenApi = "../JacobiSolutions.FountainLifeNotebook.Backend/openapi/fountain-life-api.json";
const openApiInput =
  envOpenApi && existsSync(envOpenApi)
    ? envOpenApi
    : existsSync(worktreeOpenApi)
      ? worktreeOpenApi
      : defaultOpenApi;

export default defineConfig({
  fountainLifeApi: {
    input: openApiInput,
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
