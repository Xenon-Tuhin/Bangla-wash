## 2026-06-19 - API Key Exposure in URL
**Vulnerability:** The Gemini API key was being passed as a query parameter in the request URL.
**Learning:** Query parameters are often logged by web servers, proxies, and browser history, potentially exposing sensitive credentials.
**Prevention:** Always pass API keys and other secrets in HTTP headers (e.g., `x-goog-api-key`) to ensure they are handled securely by infrastructure.
