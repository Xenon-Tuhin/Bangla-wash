## 2026-06-06 - API Security Enhancements
**Vulnerability:** API key exposure in URL, lack of input validation (DoS risk), and information leakage in error responses.
**Learning:** Sending API keys in URL query parameters is insecure as they can be logged. Lack of character limits on input strings can lead to resource exhaustion. Verbose error messages can leak internal system details.
**Prevention:** Always use request headers for API keys. Implement strict type and length validation for all user inputs. Sanitize error responses to return only generic messages to the client while logging details internally.
