## 2025-05-15 - Input Validation and Error Sanitization

**Vulnerability:** The `/api/generate-audio` endpoint lacked character length limits on `scriptText` and `directorNotes`, and error responses leaked internal server configuration details (e.g., missing environment variables).

**Learning:** Unbounded input can lead to resource exhaustion or unexpected API costs. Verbose error messages, while helpful for development, provide attackers with insights into the server's internal state and configuration.

**Prevention:** Always enforce strict length limits on all user-supplied data. Implement a "fail-safe" error handling strategy that logs detailed information internally but returns only generic, non-descriptive messages to the client.
