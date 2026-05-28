# Pattern Matching Algorithms

A Node.js implementation of six exact pattern matching algorithms, wildcard matching, and 2D Rabin-Karp, with automated benchmarking, chart generation, and PDF report output.

## Assignment description
[Assignment description](./assignments%20descriptions.md)


## Quick Start

```bash
npm install
node run.js
```

The final report is saved to `output/report.pdf`.

---

## Project Structure

```
src/
  algorithms/       # Algorithm implementations
  benchmark/        # Benchmark runners
  utils/            # Text fetching and slicing helpers
  report/           # Chart and PDF generation
data/               # Cached book text (auto-downloaded)
output/             # Generated JSON, charts, and PDF
run.js              # Main entry point
```

---

## Algorithms

All exact matchers share the signature `(text, pattern) → number[]` (array of zero-based match indices).

| File | Algorithm | Complexity |
|---|---|---|
| `bruteForce.js` | Brute Force | O(n·m) worst case |
| `sunday.js` | Sunday (Quick Search) | O(n/m) best, O(n·m) worst |
| `kmp.js` | Knuth-Morris-Pratt | O(n + m) always |
| `fsm.js` | Finite State Machine | O(n) search, O(m·α) preprocessing |
| `rabinKarp.js` | Rabin-Karp | O(n) average, O(n·m) worst |
| `gusfield.js` | Gusfield Z-Algorithm | O(n + m) always |
| `rabinKarp2D.js` | 2D Rabin-Karp | O(M·N) expected |

Wildcard matchers (`bruteForceWildcard`, `sundayWildcard`) return a `boolean`.

---

## Benchmark Pipeline (what `node run.js` does)

**Step 1 — Fetch text**  
Downloads Moby Dick from Project Gutenberg and caches it to `data/mobydick.txt`. Subsequent runs use the cached file.

**Step 2 — Part 1A: Running time vs text length**  
Runs all six exact algorithms on text slices of sizes `[10k, 50k, 100k, 200k, 500k, 1M]` characters, using two patterns:
- *Small*: `"the White Whale"` (first occurrence in the book)
- *Large*: a 300-character substring from position 20,000

Each case is measured 3 times; the **median** is recorded. Results saved to `output/benchmark_results.json`.

**Step 3 — Part 1B: Wacky Races**  
Three adversarial inputs that show different algorithms winning on different inputs:

| Race | Winner | Loser | Why |
|---|---|---|---|
| 1 | Sunday | Gusfield Z | Text `"ccc..."`, pattern `"aaa...b"` — Sunday shifts by m+1 every time; Gusfield always scans the full string |
| 2 | KMP | Rabin-Karp | Text and pattern both `"aaa..."` — every window is a real match, forcing Rabin-Karp to verify each one |
| 3 | Rabin-Karp | Sunday | Text `"aaa..."`, pattern `"aaa...b"` — Sunday nearly fully matches each window then shifts by 1; Rabin-Karp hashes cheaply and skips verification |

Results saved to `output/wacky_results.json`.

**Step 4 — Part 2: Wildcard tests**  
Runs correctness tests for `?` (match exactly one char), `*` (match zero or more chars), and escape sequences (`\?`, `\*`, `\\`). Both `bruteForceWildcard` and `sundayWildcard` must agree with the expected result for a test to pass. Results saved to `output/wildcard_results.json`.

**Step 5 — Charts and PDF**  
Generates three PNG charts into `output/charts/`, then assembles `output/report.pdf` with all results embedded.

---

## Output Files

| File | Contents |
|---|---|
| `output/benchmark_results.json` | Part 1A timings (algorithm, size, pattern type, median ms, match count) |
| `output/wacky_results.json` | Part 1B race results and ratios |
| `output/wildcard_results.json` | Part 2 pass/fail results and large-text timing |
| `output/charts/rt_small_pattern.png` | Running time chart — small pattern |
| `output/charts/rt_large_pattern.png` | Running time chart — large pattern |
| `output/charts/wacky_races.png` | Bar chart comparing race winners and losers |
| `output/report.pdf` | Final report with all sections and embedded charts |

---

## Adding a New Algorithm

1. Create `src/algorithms/myAlgorithm.js` exporting `myAlgorithm(text, pattern) → number[]`.
2. `require()` it in `src/benchmark/runner.js`.
3. Add `["My Algorithm", myAlgorithm]` to the `ALGORITHMS` array.
4. Run `node run.js` — the new algorithm appears in all charts and JSON output automatically.

---

## Dependencies

- [`chartjs-node-canvas`](https://github.com/SeanSobey/ChartjsNodeCanvas) — server-side Chart.js rendering
- [`puppeteer`](https://pptr.dev/) — headless Chromium for PDF generation
- [`node-fetch`](https://github.com/node-fetch/node-fetch) — downloading the source text

---

## Part 3: 2D Rabin-Karp

`src/algorithms/rabinKarp2D.js` takes a 2D array `picture` (M×N, arbitrary item types) and an integer `K`, and returns whether the top-right K×K block appears anywhere else in the picture.

```js
rabinKarp2D(picture, K)
// → { found: true, position: { row, col } }
// → { found: false, position: null }
```

Items are mapped to integers before hashing. Row hashes are computed first, then combined vertically with a rolling hash. Hash collisions are resolved by direct K×K comparison. Expected time: O(M·N).

---



## REFERENCES

The following sources were consulted during the design, implementation,  
and analysis of this project.

---

**[CLRS]**  
Cormen, T. H., Leiserson, C. E., Rivest, R. L., and Stein, C.  
*Introduction to Algorithms*, 4th ed. MIT Press, 2022.  
(KMP, Rabin-Karp, FSM string matcher — Chapter 32)

---

**[GUS]**  
Gusfield, D.  
*Algorithms on Strings, Trees, and Sequences*.  
Cambridge University Press, 1997.  
(Z-Algorithm — Chapter 1)

---

**[CL]**  
Crochemore, M. and Lecroq, T.  
*Handbook of Exact String Matching Algorithms*.  
King's College London Publications, 2004.  
(Brute Force, Sunday — Chapters 1 and 8)

---

**[AI]**  
AI & Web Tools.  
Development was assisted by AI tools (Claude by Anthropic,  
ChatGPT by OpenAI, GitHub Copilot by GitHub/Microsoft) and  
web resources (Google Search, Google Scholar).  
All implementations and analysis are the author's own.