## 2026-06-08 - [Credential Leakage in Logs]
**Vulnerability:** The Gemini API key was passed as a URL query parameter (`?key=...`) in the backend fetch call.
**Learning:** Query parameters are often logged by servers, proxies, and browser history, leading to accidental exposure of sensitive credentials.
**Prevention:** Always pass API keys and other sensitive tokens in request headers (e.g., `x-goog-api-key` or `Authorization`) instead of the URL.

## 2026-06-08 - [Information Exposure in Error Responses]
**Vulnerability:** Backend error responses were returning `error.message` and other internal details to the client.
**Learning:** Detailed error messages can leak stack traces, database schemas, or API implementation details that assist attackers in reconnaissance.
**Prevention:** Sanitize error responses sent to clients. Return generic error messages while logging detailed information internally for debugging.
