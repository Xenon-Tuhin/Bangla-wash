## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Zero-Copy Base64 WAV Concatenation

**Learning:** When dealing with large binary data returned as Base64 from an API (like Gemini TTS), decoding to a Buffer just to add a header and re-encoding is a major CPU and memory bottleneck. By using a 54-byte WAV header (44 bytes standard + 10 bytes JUNK chunk), the header length becomes a multiple of 3. This ensures its Base64 representation is exactly 72 characters with no padding, allowing direct string concatenation with the PCM Base64 data.

**Action:** Use zero-copy concatenation for Base64 payloads when adding fixed headers. Ensure the header byte length is a multiple of 3 to maintain Base64 alignment without padding issues.
