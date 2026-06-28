## 2025-05-15 - Hardened API Key Transport and Error Sanitization

**Vulnerability:** The application was passing the Gemini API key as a URL query parameter and returning detailed API error messages (including stack traces and potentially internal config details) directly to the client.

**Learning:** URL query parameters can be logged by proxy servers, load balancers, and browser history, exposing sensitive API keys. Leaking detailed error messages helps attackers map the application's internal structure and identify further vulnerabilities.

**Prevention:** Always use secure headers (like `x-goog-api-key` or `Authorization`) for sensitive credentials. Implement a consistent error-handling layer that logs detailed information server-side but returns generic, safe messages to the client.
