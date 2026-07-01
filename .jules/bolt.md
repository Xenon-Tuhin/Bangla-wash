## 2025-05-14 - Optimized Audio Generation Proxy

**Learning:** The Gemini TTS API is the primary bottleneck. Implementing an in-memory cache for repeated requests provides the most significant "perceived" speedup for users. Additionally, Node.js `Buffer.allocUnsafe` and `Buffer.copy` are significantly more efficient than `Buffer.concat` for building WAV files from PCM chunks, especially as payload sizes grow.

**Action:** Always check for repeated expensive API calls and consider a simple LRU-ish cache. Use `Buffer.allocUnsafe` when the final buffer size is known upfront to avoid intermediate copies and multiple allocations.

## 2026-03-23 - Performance Optimization of Script Parsing Logic
**Learning:** Script parsing with complex regular expressions on every line of text is a significant bottleneck for large inputs. Using early exits like `indexOf(':')` and `indexOf('[')` to skip expensive regex matching for non-speaker or standard lines yields a measurable performance gain of ~15-40%.
**Action:** Prioritize simple string operations (like `indexOf` or `startsWith`) as guards before executing complex regular expressions in loops.
