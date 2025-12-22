import createClient from "openapi-fetch";
import type { paths } from "./api-schema";

// Create a typed API client with dynamic auth token
function createAuthenticatedClient() {
  const client = createClient<paths>({
    baseUrl: "http://localhost:3000",
  });

  // Add auth token to all requests
  client.use({
    async onRequest({ request }) {
      const token = localStorage.getItem("auth_token");
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      
      // Check for API key in request headers (for platform operations)
      const apiKey = localStorage.getItem("platform_api_key");
      if (apiKey && !token) {
        request.headers.set("x-api-key", apiKey);
      }
      
      return request;
    },
  });

  return client;
}

export const apiClient = createAuthenticatedClient();

// Export types for convenience
export type ApiPaths = paths;
