## 2025-06-03 - Sanitized Error Messages and Input Limits

**Vulnerability:** Information leakage in error messages and missing input validation.
**Learning:** Default error handling in Express/Node.js can leak sensitive information like environment variable names or upstream API error details. Unvalidated input lengths can lead to resource exhaustion.
**Prevention:** Always wrap external API calls and sensitive operations in try-catch blocks and return generic error messages to the client. Implement strict length limits on all user-supplied input fields.
