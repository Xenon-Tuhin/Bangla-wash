# Sentinel Journal

## 2025-06-22 - Initial Security Scan
**Vulnerability:** API key passed in URL, detailed error messages leaked to client, missing input validation (length limits).
**Learning:** Found several medium-priority security issues in the initial codebase. API key transport in URL is a common but risky pattern. Error details can expose server internals.
**Prevention:** Always use headers for API keys and sanitize error responses before sending them to the client.
