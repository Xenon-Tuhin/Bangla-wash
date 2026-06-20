## 2025-05-15 - Hardened Audio Generation Endpoint

**Vulnerability:** The Gemini API key was exposed as a query parameter in the URL, which is a common pattern for exposure in server and proxy logs. Additionally, the `/api/generate-audio` endpoint lacked input validation, making it susceptible to DoS via oversized payloads or crashes from unexpected types. Error responses also leaked internal configuration details (e.g., missing environment variables).

**Learning:** Moving API keys to headers (e.g., `x-goog-api-key`) is a critical first step in securing external API integrations. Robust input validation (type checking + length limits) at the entry point of Express routes prevents a wide range of injection and resource exhaustion attacks. Sanitizing error responses is essential to maintain the confidentiality of the server's internal state.

**Prevention:** Always use headers for secrets. Implement a standard input validation middleware or pattern for all public endpoints. Use generic error messages for client-side responses while maintaining detailed logging on the server.
