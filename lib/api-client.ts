import createClient from "openapi-fetch";
import type { paths } from "./api-schema";

// Create a typed API client with dynamic auth token
function createAuthenticatedClient() {
  const client = createClient<paths>({
    baseUrl: "https://api.solpass.app",
    // baseUrl: "http://localhost:3000",
    
  });

  // Add auth token to all requests
  client.use({
    async onRequest({ request }) {
      const token = localStorage.getItem("auth_token");
      const apiKey = localStorage.getItem("platform_api_key");
      
      // Determine which auth to use based on the current page
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isPlatformSimulation = currentPath.startsWith('/events');
      
      if (isPlatformSimulation && apiKey) {
        // Platform simulation pages use API key
        // request.headers.set("x-api-key", apiKey);
        request.headers.set("Authorization", `Bearer ${apiKey}`);
        // console.log("Using API key for request to:", request.url);
        // console.log("API key being sent:", apiKey.substring(0, 20) + "...");
      } else if (token) {
        // Dashboard pages use JWT token
        request.headers.set("Authorization", `Bearer ${token}`);
        // console.log("Using JWT token for request to:", request.url);
      } else {
        console.warn("No authentication found for request to:", request.url);
      }
      
      return request;
    },
  });

  return client;
}

export const apiClient = createAuthenticatedClient();

// Export types for convenience
export type ApiPaths = paths;
