## 2025-05-14 - Fix API Key Leakage and Add DoS Protection
**Vulnerability:** API key was being passed as a query parameter in the Gemini API URL, and the endpoint lacked input validation and sanitized error messages.
**Learning:** Passing sensitive credentials in URLs is insecure as they can be logged by servers or proxies. Lack of input validation on public endpoints can lead to DoS. Detailed error messages can leak internal system or upstream API information.
**Prevention:** Always use HTTP headers (e.g., `x-goog-api-key`) for credentials, implement strict input length validation, and sanitize error responses to return generic messages while logging details server-side.
