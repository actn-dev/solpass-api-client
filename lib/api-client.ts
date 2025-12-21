import createClient from "openapi-fetch";
import type { paths } from "./api-schema";

// Create a typed API client
export const apiClient = createClient<paths>({
  baseUrl: "http://localhost:3000",
});

// Export types for convenience
export type ApiPaths = paths;
