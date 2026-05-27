## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Zero-copy Base64 WAV Header Concatenation

**Learning:** Decoding a Base64 payload to a Buffer, modifying it, and re-encoding it is expensive for large assets like audio. By ensuring the prepended header is a multiple of 3 bytes, we can perform direct string concatenation of the Base64 header and the Base64 payload, completely bypassing the decode/encode cycle.

**Action:** For binary data received as Base64 that requires a fixed header, use a header size that is a multiple of 3 (e.g., 54 bytes for WAV) to allow for zero-copy string concatenation.
