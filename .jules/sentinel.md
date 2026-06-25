# Sentinel 🛡️ - Security Journal

## 2025-05-14 - Initial Security Audit
**Vulnerability:** API key passed in query parameters, leaking it to logs. Detailed error messages leaking internal state. Lack of input validation on `scriptText`.
**Learning:** The application was built with functionality first, neglecting basic security hygiene like transport security and error sanitization.
**Prevention:** Always use headers for sensitive keys. Sanitize errors before sending to client. Validate all user inputs for type and length.
