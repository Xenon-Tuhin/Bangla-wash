# Sentinel's Journal

## 2026-05-20 - API Key Exposure in URL
**Vulnerability:** API keys were being passed as a query parameter in the URL.
**Learning:** Query parameters are often logged by web servers, proxies, and browser history, potentially exposing sensitive credentials to unauthorized parties.
**Prevention:** Always use secure transport headers (like `x-goog-api-key` or `Authorization: Bearer`) for sensitive credentials to ensure they are not inadvertently logged or cached.
