## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2025-05-15 - Fast-Path String Processing in Parsers

**Learning:** Regex operations on long strings are expensive. In the `parseScript` function, many lines don't match the expected "Speaker: dialogue" format or contain emotion tags. Adding simple character checks (`indexOf(':')`, `indexOf('(')`) as guard clauses before running complex regexes yielded an ~18% performance improvement in script processing.

**Action:** Before applying regex replacements or complex matches in loops, use `String.prototype.indexOf` or `String.prototype.includes` for quick "fail-fast" checks if the pattern depends on specific characters.
