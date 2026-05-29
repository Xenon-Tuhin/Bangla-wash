## 2025-01-24 - [Security Enhancements for Audio Generation]
**Vulnerability:** Information leakage via URL query parameters and oversized input DoS.
**Learning:** API keys in URLs can be leaked to server logs. Lack of input length limits can lead to resource exhaustion.
**Prevention:** Use request headers for API keys and enforce strict input length validation.
