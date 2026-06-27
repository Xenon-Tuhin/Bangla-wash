## 2025-06-27 - Hardened API Key Transport & Error Sanitization
**Vulnerability:** API key was being passed as a query parameter in the Gemini TTS request URL, and the server was leaking detailed internal error messages/stack traces to the client.
**Learning:** Query parameters are often logged in web server logs, proxy logs, and browser history, making them an insecure transport for secrets. Additionally, verbose error messages can leak architectural details or sensitive configuration (like missing environment variables) to potential attackers.
**Prevention:** Always use request headers (like `x-goog-api-key`) for passing secrets in API calls and implement a strict error sanitization layer that returns generic error messages to the client while logging details only on the server.
