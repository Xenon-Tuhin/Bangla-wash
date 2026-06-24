# Sentinel Journal 🛡️

## 2025-06-24 - [API Key Transport & Error Sanitization]
**Vulnerability:** API key was passed as a query parameter in the Gemini TTS proxy, and internal error details (including environment variable names) were leaked to the client.
**Learning:** Passing secrets in URLs leads to leakage in logs and proxies. Verbose error messages facilitate reconnaissance for attackers.
**Prevention:** Always use HTTP headers for secrets (e.g., `x-goog-api-key`) and return generic error messages to clients while logging detailed errors server-side.
