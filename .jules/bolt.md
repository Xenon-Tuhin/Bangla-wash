## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Zero-copy Base64 WAV Header Concatenation
**Learning:** For APIs returning Base64-encoded PCM, you can avoid a heavy decode-copy-encode cycle by prepending a pre-calculated Base64 header. To ensure valid concatenation, the binary header length MUST be a multiple of 3 bytes (e.g., 54 bytes instead of 44) to avoid Base64 padding and bit-shifting issues. A RIFF `JUNK` chunk is an effective way to pad the header.
**Action:** Use `JUNK` chunks to align binary headers to 3-byte boundaries when performing direct Base64 concatenation to optimize high-throughput audio/binary streams.
