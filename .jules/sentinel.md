## 2024-05-23 - Hardened Input Validation and Error Sanitization

**Vulnerability:** Lack of input type/length validation and leakage of internal API error details.
**Learning:** External API integration endpoints are vulnerable to both DoS (via oversized payloads) and information leakage (via raw error propagation). Masking `error.message` and API response details is crucial for defense in depth.
**Prevention:** Always validate input types and lengths at the edge. Implement a centralized or consistent error handling strategy that sanitizes responses for the client while preserving detailed logs for internal monitoring.
