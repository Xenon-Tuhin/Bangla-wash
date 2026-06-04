## 2025-05-14 - Input Validation and Error Sanitization

**Vulnerability:** Lack of input length limits (DoS risk) and leaking of internal error details/upstream API errors.
**Learning:** Even a simple proxy should enforce limits on user-provided data and sanitize all error responses to prevent information disclosure. Moving API keys from URLs to headers is also a critical defense-in-depth measure.
**Prevention:** Always implement character limits for text inputs and use generic error messages for the client while logging details internally.
