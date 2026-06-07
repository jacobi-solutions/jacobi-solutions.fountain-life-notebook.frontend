import { defineConfig } from "orval";

export default defineConfig({
  fountainLifeApi: {
    input: "../JacobiSolutions.FountainLifeNotebook.Backend/openapi/fountain-life-api.json",
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
