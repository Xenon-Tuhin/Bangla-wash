## 2026-06-12 - [Secure API Key Handling and Input Validation]
**Vulnerability:** API key was exposed as a query parameter in the Gemini API request URL, and the /api/generate-audio endpoint lacked input validation.
**Learning:** Credentials in URLs are easily leaked via logs and history. Lack of input validation on text fields poses a DoS risk for both the local server and the downstream API.
**Prevention:** Always use secure headers for API keys and implement strict type/length validation on all user-controlled inputs.
