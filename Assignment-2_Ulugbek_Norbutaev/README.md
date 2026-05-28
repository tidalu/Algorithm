# Algorithms Assignment II

A Node.js implementation of dictionary structures, graph algorithms, and hash tables, with automated benchmarking, PNG chart generation, and PDF report output.

## Assignment Description

[Assignment description](./assignments%20descriptions.md)

## Quick Start

```bash
npm install
node run.js
```

The final report is saved to `output/report.pdf`.

---

## Project Structure

```text
src/
  algorithms/       # Graph algorithms for the assignment tasks
  benchmark/        # Benchmark runners and sample task runners
  structures/       # Dictionary and hash-table implementations
  utils/            # Text, timing, and deterministic random helpers
  report/           # PNG chart generation and PDF generation
output/             # Generated JSON, charts, and PDF
english_words.txt   # Dictionary input
english_names.txt   # Name list provided with the assignment
run.js              # Main entry point
```

---

## Implemented Tasks

| Part | Topic | Main files |
|---|---|---|
| 1A | Spell checking with dictionary structures | `src/benchmark/spellChecker.js`, `src/structures/*Dictionary.js` |
| 1B | Triwizard shortest-path prediction with BFS | `src/algorithms/triwizard.js` |
| 1C | Aunt's Namesday seating with DFS bipartite coloring | `src/algorithms/auntNamesday.js` |
| 2 | Full House hash-table benchmark | `src/structures/hashTables.js`, `src/benchmark/hashTableBenchmark.js` |
| 3 | Dictionary race structures | `trieDictionary.js`, `balancedTernarySearchTree.js`, `doubleArrayTrie.js`, `redBlackTreeDictionary.js` |

---

## Benchmark Pipeline

`node run.js` performs five steps:

1. Runs dictionary build, memory, and spell-checking lookup benchmarks.
2. Runs the Triwizard and Namesday graph examples.
3. Runs hash-table insertion/search benchmarks across load factors.
4. Generates PNG charts into `output/charts/`.
5. Generates the final single-page PDF report at `output/report.pdf`.

---

## Output Files

| File | Contents |
|---|---|
| `output/spell_results.json` | Dictionary build times, memory estimates, lookup timings, and misspelled counts |
| `output/graph_task_results.json` | Triwizard and Namesday example results |
| `output/hash_table_results.json` | Hash-table insert/search benchmark results |
| `output/charts/*.png` | Generated chart images used by the PDF report |
| `output/report.pdf` | Final report with summary tables and embedded charts |

---

## Useful Commands

```bash
npm start
npm run spell
npm run graphs
npm run hash
npm run report
```

Quick smaller run:

```powershell
$env:DICTIONARY_LIMIT="2000"; $env:LOOKUP_RUNS="1"; $env:HASH_RUNS="1"; node run.js
```

---

## Dependencies

- [`puppeteer`](https://pptr.dev/) - headless Chromium for PDF generation

The charts are drawn internally and saved as PNG files with Puppeteer.
