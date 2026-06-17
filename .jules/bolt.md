## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Zero-copy Base64 concatenation
**Learning:** Pre-calculating a Base64-aligned WAV header (54 bytes = multiple of 3) allows for direct string concatenation of the header and the PCM data returned by the API. This bypasses the entire decode-buffer-encode cycle in Node.js, reducing CPU and memory overhead significantly for high-throughput TTS services.
**Action:** For binary data proxied as Base64, look for opportunities to perform "header injection" in the Base64 domain by ensuring the header is a multiple of 3 bytes.
