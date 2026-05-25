## 2025-05-14 - API Key Transmission and Error Sanitization

**Vulnerability:** API Keys were passed as query parameters in URLs, and internal error details were leaked to the client.
**Learning:** URL query parameters are often logged by proxies and web servers, making them an insecure transport for secrets. Additionally, raw error messages can leak internal system architecture or upstream API details.
**Prevention:** Always use request headers (like `x-goog-api-key`) for secrets and return sanitized, generic error messages to clients while logging full details internally for debugging.
