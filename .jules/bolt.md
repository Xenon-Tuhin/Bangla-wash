## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2026-05-20 - Optimized Regex with String Hints

**Learning:** Running complex regular expressions in a tight loop over large text inputs can be a significant bottleneck. Adding simple string hints (like `indexOf(':')` or `indexOf('[')`) as guards before executing regex can measurably improve performance (up to 30% speedup in this codebase). Additionally, replacing capture-group regex with manual `substring` slicing for simple delimiter-based parsing is consistently faster in Node.js.

**Action:** Before running expensive regex in loops, check for required character hints using fast string methods. Favor manual string slicing over regex capture groups for performance-critical parsing.
