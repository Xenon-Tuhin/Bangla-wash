## 2025-05-14 - Multi-Layer Security Hardening for TTS Proxy

**Vulnerability:** The application was passing the Gemini API key as a URL query parameter, leaking detailed API and internal errors to the client, and lacked input length validation.
**Learning:** Even internal proxies should follow defense-in-depth principles. URL parameters are often logged by intermediate infrastructure, and verbose error messages can provide a roadmap for attackers. Unbounded inputs are a classic vector for resource exhaustion.
**Prevention:** Always use request headers for credentials, sanitize all outgoing error responses to provide only generic messages, and enforce strict length limits on all user-supplied data early in the request lifecycle.
