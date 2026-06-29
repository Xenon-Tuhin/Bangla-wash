## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2026-06-29 - Regex Parser Bottleneck

**Learning:** Regular expressions can be expensive when executed on every line of a large input, especially if they are complex or fail to match early. Simple string operations like `indexOf` and `substring` are much faster for basic parsing tasks.

**Action:** Before applying a complex regex to a string in a loop, use fast string methods like `indexOf` or `startsWith` as early exits to skip unnecessary processing.
