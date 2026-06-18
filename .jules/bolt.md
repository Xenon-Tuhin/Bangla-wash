## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.
## 2026-06-18 - Zero-Copy Base64 WAV Concatenation
**Learning:** Concatenating Base64 strings directly requires the prefix string to represent a byte length that is a multiple of 3 to avoid alignment issues and padding in the middle of the final string. A 54-byte WAV header (standard 44 bytes + 10-byte JUNK chunk) perfectly aligns to 72 Base64 characters.
**Action:** Use a 54-byte header structure when prepending metadata to Base64-encoded binary payloads to avoid expensive decode/re-encode cycles.
