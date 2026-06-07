## 2025-02-12 - API Key Exposure and Lack of Input Validation
**Vulnerability:** The `GEMINI_API_KEY` was being passed as a URL query parameter, and the `/api/generate-audio` endpoint lacked input validation for the type and length of `scriptText` and `directorNotes`. Additionally, internal error messages were leaked to the client.
**Learning:** Passing API keys in URLs is insecure as they can be logged by servers and proxies. Lack of input validation can lead to resource exhaustion or unexpected behavior.
**Prevention:** Always pass API keys in request headers, implement strict input validation (type and length checks), and sanitize error responses to avoid leaking sensitive information.
