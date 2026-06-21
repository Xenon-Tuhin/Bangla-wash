# Sentinel Journal

## 2025-05-14 - API Key Exposure in URL
**Vulnerability:** The Gemini API key was being passed as a query parameter in the URL, which can lead to exposure in server logs, proxy logs, and browser history.
**Learning:** Many APIs allow passing keys in either headers or query parameters. Headers are generally more secure for transport.
**Prevention:** Always prefer using HTTP headers (like `x-goog-api-key`) for sensitive credentials instead of URL parameters.

## 2025-05-14 - Information Leakage in Error Responses
**Vulnerability:** The application was returning detailed error messages, including stack traces and full API error objects, to the client.
**Learning:** Exposing internal details can help attackers understand the system's architecture and identify further vulnerabilities.
**Prevention:** Sanitize error responses to return generic messages to the client while logging the detailed errors internally.

## 2025-05-14 - Missing Input Validation
**Vulnerability:** The `/api/generate-audio` endpoint lacked proper type and length validation for user-provided inputs.
**Learning:** Unvalidated input can lead to various attacks, including Denial of Service (DoS) if extremely large payloads are processed.
**Prevention:** Implement strict type checking and length limits for all user-provided data.
