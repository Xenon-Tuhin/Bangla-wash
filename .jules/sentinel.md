## 2025-05-14 - API Key and DoS Protection

**Vulnerability:** API key was passed as a URL query parameter, and there were no input length limits on user-provided text.

**Learning:** URL query parameters are often logged by web servers, load balancers, and browser history, leading to accidental credential exposure. Lack of input validation allows for resource exhaustion (DoS).

**Prevention:** Always pass sensitive credentials in HTTP headers. Enforce strict character limits on all user-controlled inputs at the API gateway or entry point.
