## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Rejected Incremental Hashing for Cache Keys

**Learning:** Replacing `JSON.stringify` with incremental `hash.update()` for cache keys can yield a ~60% speedup in key generation, but it introduces collision risks if separators aren't carefully managed and often leads to duplicating default values that are better handled by the original object structure. In most Node.js applications, `JSON.stringify` on small-to-medium objects is not the bottleneck compared to I/O or heavy computation.

**Action:** Avoid micro-optimizing cache key generation unless it is proven to be a significant bottleneck for very large payloads. Prefer the robustness of `JSON.stringify` to avoid subtle collision bugs.
