## 2026-06-16 - [Secure API Key Transmission]
**Vulnerability:** API keys were being transmitted as URL query parameters, which are often logged in plain text by web servers and proxies.
**Learning:** Even if the connection is HTTPS, URL parameters can be leaked through server logs, browser history, or referrer headers.
**Prevention:** Always use HTTP headers (like `x-goog-api-key` or `Authorization`) for transmitting sensitive credentials.
