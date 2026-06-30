## 2026-06-30 - API Key Transport Hardening and Error Sanitization
**Vulnerability:** API key was being passed as a URL query parameter, and internal error details (including missing configuration and raw API errors) were leaked to the client.
**Learning:** Passing secrets in URLs is insecure as they are often logged. Leaking internal error details can give attackers insights into server configuration.
**Prevention:** Always pass API keys in HTTP headers (like `x-goog-api-key`). Implement a generic error handling layer that returns sanitized messages to the client while logging detailed errors on the server.
