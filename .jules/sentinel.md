## 2025-05-26 - API Key Leakage and Error Sanitization
**Vulnerability:** Gemini API key passed in URL query parameters; internal error details leaked to client.
**Learning:** Query parameters are often logged by intermediate infrastructure, leading to credential exposure. Verbose error messages facilitate reconnaissance by attackers.
**Prevention:** Use HTTP headers for sensitive credentials (`x-goog-api-key`); implement generic error responses for clients while maintaining detailed internal logging.
