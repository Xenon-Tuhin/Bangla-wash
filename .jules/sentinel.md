## 2025-05-15 - API Hardening and Credential Protection

**Vulnerability:** Gemini API key was passed as a URL query parameter, and detailed error messages/stack traces were returned to the client. Lack of input length limits posed a DoS risk.
**Learning:** URL query parameters are frequently logged by infrastructure (load balancers, proxies, server logs), leading to credential leakage. Detailed error responses can reveal internal system architecture or dependency versions to attackers.
**Prevention:** Always use HTTP headers (like `x-goog-api-key`) for sensitive credentials. Sanitize all API responses to return generic error messages. Implement strict input validation and length limits on all public endpoints.
