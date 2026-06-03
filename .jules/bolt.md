## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-06-03 - Zero-copy Base64 Concatenation

**Learning:** Decoding Base64 to a Buffer just to prepend a header and re-encoding back to Base64 is a significant bottleneck. By ensuring the prepended binary header has a byte length that is a multiple of 3, the resulting Base64 header string will have no padding and can be directly concatenated with the Base64 payload. This achieved a ~150x speedup in overhead processing.

**Action:** For performance-critical paths involving Base64 payloads with static headers, use zero-copy concatenation by aligning the header to a multiple of 3 bytes (using a JUNK chunk in WAV/RIFF if necessary).
