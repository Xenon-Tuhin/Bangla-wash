# Sentinel Journal

## 2025-05-14 - Initial Security Hardening
**Vulnerability:** API key was being passed as a query parameter in the Gemini API request, which can lead to it being logged in proxy or server logs. Additionally, the `/api/generate-audio` endpoint lacked input validation (type and length checks) and leaked internal error details.
**Learning:** Transporting secrets in URLs is a common but dangerous pattern. Relying on default framework error handling often exposes more information than intended.
**Prevention:** Always use headers for sensitive keys. Implement strict input validation at the entry point of every public API. Sanitize all external-facing error messages.
