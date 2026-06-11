## 2025-05-14 - [API Key Exposure and Input Validation]
**Vulnerability:** API key was passed as a URL query parameter, and the `/api/generate-audio` endpoint lacked input validation (type checking and length limits).
**Learning:** Passing sensitive credentials in URLs exposes them to logging in servers, proxies, and browser history. Lack of input validation on public endpoints creates a Denial of Service (DoS) risk through excessively large payloads.
**Prevention:** Always pass API keys via secure request headers (e.g., `x-goog-api-key`). Implement strict type and length validation for all user-provided input on API endpoints. Sanitize error responses to avoid leaking implementation details.
