## 2025-05-15 - Hardening API and Secret Management

**Vulnerability:** API key was passed as a URL query parameter, and the endpoint lacked input validation and error sanitization.
**Learning:** URL query parameters are often logged by infrastructure, exposing secrets. Missing input validation on public endpoints can lead to resource exhaustion or unexpected crashes (DoS). Detailed error messages can leak internal system information to attackers.
**Prevention:** Always pass sensitive credentials in HTTP headers (e.g., `x-goog-api-key`). Implement strict type and length validation for all user-provided inputs. Sanitize error responses to return generic messages while logging details internally.
