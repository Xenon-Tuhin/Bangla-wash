## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Zero-Copy Base64 Audio Concatenation

**Learning:** Decoding a Base64 string to a Buffer, modifying it (e.g., adding a header), and re-encoding it to Base64 is expensive for large payloads (O(n) time and space). By ensuring the added data (WAV header) length is a multiple of 3 (e.g., 54 bytes), its Base64 representation aligns perfectly without padding. This allows for O(1) string concatenation instead of O(n) Buffer operations.

**Action:** For performance-critical Base64 manipulations, use length-padding to 3-byte boundaries to enable direct string concatenation.
