## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2026-06-05 - Zero-copy Base64 WAV header concatenation
**Learning:** For performance-critical paths involving audio data in Node.js, avoiding Buffer decode/encode cycles provides massive wins. By ensuring a prepended header's byte length is a multiple of 3 (e.g., 54 bytes for WAV using a JUNK chunk), we can perform zero-copy Base64 concatenation. This achieved a ~300x speedup in overhead during benchmarking.
**Action:** Use fixed-size, 3-byte-multiple headers for zero-copy Base64 injection into binary streams already encoded as Base64.
