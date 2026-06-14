## 2025-06-14 - API Key Exposure and DoS Mitigation
**Vulnerability:** API key was passed as a URL query parameter to the Gemini API, and the endpoint lacked input validation (type/length).
**Learning:** Passing credentials in URLs leads to leakage in logs. Lack of input validation on expensive operations like TTS can be exploited for DoS.
**Prevention:** Always use headers for API keys (`x-goog-api-key` for Gemini). Implement strict type and length validation on all user-facing inputs.
