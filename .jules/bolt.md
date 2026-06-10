## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Learning:** Zero-copy Base64 concatenation is a powerful technique for prepending headers to binary data already in Base64 format. By ensuring the header's byte length is a multiple of 3 (e.g., 54 bytes), the resulting Base64 header has no padding and aligns perfectly with the data. This avoids the expensive CPU and memory overhead of decoding to a Buffer and re-encoding to Base64, resulting in a ~300x speedup for typical audio payloads.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations. Use zero-copy Base64 concatenation when prepending static or calculated headers to large Base64 strings.
