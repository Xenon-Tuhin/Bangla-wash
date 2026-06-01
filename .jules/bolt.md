## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Zero-copy Base64 concatenation

**Learning:** Decoding Base64, manipulating buffers, and re-encoding to Base64 is expensive for large payloads (e.g. audio). String concatenation of Base64 is mathematically equivalent to binary concatenation IF the prepended string represents a multiple of 3 bytes (no padding).

**Action:** Use a 54-byte WAV header (multiple of 3) by adding a 10-byte JUNK chunk to standard 44-byte header. This allows zero-copy concatenation of the header Base64 and the PCM data Base64.
