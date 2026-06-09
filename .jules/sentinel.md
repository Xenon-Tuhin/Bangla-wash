## 2025-05-22 - API Key Exposure in URL and Missing Input Validation
**Vulnerability:** The Gemini API key was passed as a URL query parameter, and the `/api/generate-audio` endpoint lacked input validation for type and length.
**Learning:** URL parameters are often logged by servers and proxies, exposing secrets. Missing input validation can lead to DoS or unexpected behavior with malformed payloads.
**Prevention:** Always use request headers for API keys and implement strict type and length validation for all user-controlled inputs.
