# Project Walkthrough

This file explains how Assignment 2 is wired together: files, data flow, benchmark outputs, charts, and report generation. For the algorithm theory, use `EXPLANATION.md`.

## 1. Project Overview

This project is a dependency-free Node.js implementation of Assignment II.

The main command is:

```bash
node run.js
```

It runs five steps:

1. dictionary benchmarks for Part 1A and Part 3
2. graph examples for Part 1B and Part 1C
3. hash table benchmarks for Part 2
4. SVG chart generation
5. HTML and Markdown report generation

The generated files are written to `output/`.

## 2. Folder and File Map

### Project root

`package.json`

- Purpose: Defines scripts for the assignment.
- Important scripts:
  - `npm start` runs `node run.js`
  - `npm run spell` runs only dictionary benchmarks
  - `npm run graphs` runs the BFS and DFS examples
  - `npm run hash` runs only hash-table benchmarks
  - `npm run report` regenerates report files from existing JSON outputs
- Dependencies: none.

`run.js`

- Purpose: Main entry point.
- Inputs: `english_words.txt`, sample graph cases from source code, benchmark constants.
- Outputs: JSON result files, SVG charts, `output/report.html`, and `output/report.md`.

`EXPLANATION.md`

- Purpose: Explains algorithms, correctness ideas, and complexity.

`WALKTHROUGH.md`

- Purpose: This file. It explains project flow and file responsibilities.

`assignments descriptions.txt`

- Purpose: Original assignment prompt. The code does not read this file.

`english_words.txt`

- Purpose: Dictionary source for the spell-checking benchmark.

`english_names.txt`

- Purpose: Available name list from the assignment directory. The current sample seating case is hardcoded for clarity, but this file can be used to create larger seating inputs.

## 3. Source File Map

### `src/utils/`

`src/utils/text.js`

- Purpose: Word normalization, tokenization, deterministic spell-checking text generation, and path helpers.
- Important exports:
  - `normalizeWord(value)`
  - `tokenize(text)`
  - `readWordList(filePath, options)`
  - `buildSpellText(words, targetChars)`
  - `bytesToHuman(bytes)`

`src/utils/timing.js`

- Purpose: Timing helpers.
- Important exports:
  - `measure(fn, runs)`
  - `median(values)`

`src/utils/random.js`

- Purpose: Deterministic pseudo-random key generation for hash-table benchmarks.
- Important exports:
  - `createLCG(seed)`
  - `generateKeys(count, prefix)`

### `src/structures/`

`src/structures/linearDictionary.js`

- Purpose: Naive spell-checking dictionary using a plain array and linear scan.
- Main class: `LinearDictionary`.

`src/structures/redBlackTreeDictionary.js`

- Purpose: Custom red-black tree dictionary.
- Main class: `RedBlackTreeDictionary`.
- Used for the BBST requirement and the Part 3 RB-tree requirement.

`src/structures/trieDictionary.js`

- Purpose: Ordinary prefix tree.
- Main class: `TrieDictionary`.

`src/structures/hashMapDictionary.js`

- Purpose: Spell-checking dictionary using JavaScript `Map`.
- Main class: `HashMapDictionary`.

`src/structures/balancedTernarySearchTree.js`

- Purpose: Ternary prefix tree. The static dictionary is sorted and inserted in median order for balancing.
- Main class: `BalancedTernarySearchTree`.

`src/structures/doubleArrayTrie.js`

- Purpose: Double-array trie using `base`, `check`, and `terminal` arrays.
- Main class: `DoubleArrayTrie`.

`src/structures/hashTables.js`

- Purpose: Custom Part 2 hash tables.
- Main classes:
  - `SeparateChainingHashTable`
  - `LinearProbingHashTable`
  - `DoubleHashingHashTable`
- Also exports `hashString()` and `hashString2()`.

### `src/algorithms/`

`src/algorithms/triwizard.js`

- Purpose: Solves the Triwizard shortest-path prediction.
- Important exports:
  - `bfsDistancesFromExit(labyrinth)`
  - `predictTriwizardWinner(labyrinth, wizards)`
  - `sampleTriwizardCase()`

`src/algorithms/auntNamesday.js`

- Purpose: Solves the two-table seating problem as bipartite graph coloring.
- Important exports:
  - `planSeating(guests, dislikes)`
  - `sampleNamesdayCase()`

### `src/benchmark/`

`src/benchmark/spellChecker.js`

- Purpose: Runs Part 1A and Part 3 dictionary benchmarks.
- Inputs: `english_words.txt`.
- Outputs: `output/spell_results.json`.
- Structures benchmarked:
  - Linear List
  - Red-Black Tree
  - Ordinary Trie
  - Hash Map
  - Balanced Ternary Trie
  - Double-Array Trie

`src/benchmark/graphTasks.js`

- Purpose: Runs sample cases for Part 1B and Part 1C.
- Outputs: `output/graph_task_results.json`.

`src/benchmark/hashTableBenchmark.js`

- Purpose: Runs Part 2 load-factor benchmark.
- Outputs: `output/hash_table_results.json`.
- Tables benchmarked:
  - Separate Chaining
  - Linear Probing
  - Double Hashing

### `src/report/`

`src/report/chartGenerator.js`

- Purpose: Generates SVG charts without external dependencies.
- Outputs:
  - `output/charts/spell_lookup_rt.svg`
  - `output/charts/dictionary_build_time.svg`
  - `output/charts/dictionary_memory.svg`
  - `output/charts/hash_insert_vs_load.svg`
  - `output/charts/hash_search_vs_load.svg`

`src/report/reportGenerator.js`

- Purpose: Builds a readable report from JSON benchmark outputs and chart files.
- Outputs:
  - `output/report.html`
  - `output/report.md`

## 4. Step-by-Step Execution Flow

### Step 1 - Dictionary Benchmarks

`run.js` calls:

```js
const spellResults = await runSpellBenchmark();
```

The benchmark reads words from:

```text
english_words.txt
```

By default it uses the first `30000` unique normalized words. This keeps the linear-list benchmark practical while still producing clear differences between structures.

You can change the limit:

```bash
$env:DICTIONARY_LIMIT="50000"; node run.js
```

The benchmark creates deterministic text sizes:

```js
[5000, 10000, 20000, 50000, 100000]
```

These are target character lengths. Each text is built from dictionary words, and every eleventh word is intentionally corrupted so that the spell checker sees both correct and misspelled words.

For each dictionary structure, the benchmark records:

- build time
- estimated memory
- lookup time for every text size
- token count
- number of misspelled words

The output file is:

```text
output/spell_results.json
```

### Step 2 - Graph Task Examples

`run.js` calls:

```js
const graphResults = await runGraphTaskExamples();
```

This runs:

- Triwizard Tournament sample labyrinth
- Aunt's Namesday sample seating graph

The output file is:

```text
output/graph_task_results.json
```

For Triwizard, the important result fields are:

- `exit`
- `competitors`
- `winner`
- `winners`

For Namesday, the important result fields are:

- `possible`
- `conflict`
- `tables`

### Step 3 - Hash Table Benchmark

`run.js` calls:

```js
const hashResults = await runHashTableBenchmark();
```

The benchmark uses default capacity:

```js
20011
```

and load factors:

```js
[0.1, 0.25, 0.5, 0.7, 0.8, 0.9]
```

For every load factor and hash table implementation, it measures:

- total insert time
- insert microseconds per operation
- total search time
- search microseconds per operation

The search set contains present and missing keys, so successful and unsuccessful searches are both represented.

The output file is:

```text
output/hash_table_results.json
```

### Step 4 - Chart Generation

`run.js` calls:

```js
await generateCharts({ spellResults, hashResults }, DEFAULT_CHART_DIR);
```

The chart generator writes five SVG files into:

```text
output/charts/
```

These SVGs are directly referenced by the HTML report.

### Step 5 - Report Generation

`run.js` calls:

```js
await generateReport({ spellResults, graphResults, hashResults });
```

The report generator writes:

```text
output/report.html
output/report.md
```

The HTML file includes the chart images and summary tables. The Markdown file is a compact text summary.

## 5. Data Flow Diagram

```text
english_words.txt
        |
        v
src/utils/text.js
        |
        v
normalized dictionary words
        |
        v
src/benchmark/spellChecker.js
        |
        v
output/spell_results.json
        |
        +-----------------------------+
        |                             |
        v                             v
src/report/chartGenerator.js     src/report/reportGenerator.js
        |                             |
        v                             v
output/charts/*.svg              output/report.html
                                      output/report.md

src/algorithms/triwizard.js
src/algorithms/auntNamesday.js
        |
        v
src/benchmark/graphTasks.js
        |
        v
output/graph_task_results.json
        |
        v
src/report/reportGenerator.js

src/structures/hashTables.js
        |
        v
src/benchmark/hashTableBenchmark.js
        |
        v
output/hash_table_results.json
        |
        +-----------------------------+
        |                             |
        v                             v
src/report/chartGenerator.js     src/report/reportGenerator.js
```

## 6. Useful Commands

Run the whole project:

```bash
node run.js
```

Run only dictionary benchmarks:

```bash
npm run spell
```

Run only graph examples:

```bash
npm run graphs
```

Run only hash-table benchmarks:

```bash
npm run hash
```

Regenerate the report from existing JSON files:

```bash
npm run report
```

Use a smaller dictionary for a quick test:

```bash
$env:DICTIONARY_LIMIT="2000"; $env:LOOKUP_RUNS="1"; node run.js
```

Use a larger dictionary:

```bash
$env:DICTIONARY_LIMIT="50000"; node run.js
```

Use a smaller hash-table benchmark for a quick test:

```bash
$env:HASH_TABLE_CAPACITY="1009"; $env:HASH_RUNS="1"; node run.js
```

## 7. How to Change the Triwizard Input

Open:

```text
src/algorithms/triwizard.js
```

Edit `sampleTriwizardCase()`.

A labyrinth is an array of strings:

```js
[
  "#####",
  "#..E#",
  "#...#",
  "#####"
]
```

Rules:

- `#` is a wall
- `E` is the exit
- any non-`#` character is passable

Wizard positions are objects:

```js
{ name: "Cedric", row: 1, col: 1, speed: 3 }
```

Speed is measured in corridors per minute.

## 8. How to Change the Namesday Input

Open:

```text
src/algorithms/auntNamesday.js
```

Edit `sampleNamesdayCase()`.

Guests are strings:

```js
["Petunia", "Vernon", "Harry"]
```

Dislike pairs are undirected edges:

```js
[
  ["Petunia", "Harry"],
  ["Vernon", "Harry"]
]
```

The output is either:

```js
{ possible: true, tables: [table1, table2] }
```

or:

```js
{ possible: false, conflict: [guestA, guestB] }
```

## 9. How to Add a New Dictionary Structure

1. Create a file in:

```text
src/structures/
```

2. Implement the standard interface:

```js
class MyDictionary {
  build(words) {}
  has(word) {}
  estimateMemoryBytes() {}
}
```

3. Add it to `DICTIONARIES` in:

```text
src/benchmark/spellChecker.js
```

Example:

```js
const DICTIONARIES = [
  ["My Dictionary", () => new MyDictionary()]
];
```

4. Run:

```bash
node run.js
```

The new structure will automatically appear in:

- console tables
- `output/spell_results.json`
- dictionary charts
- `output/report.html`

## 10. How to Add a New Hash Table

1. Add the class to:

```text
src/structures/hashTables.js
```

It should implement:

```js
insert(key, value)
search(key)
```

2. Add it to `TABLES` in:

```text
src/benchmark/hashTableBenchmark.js
```

3. Run:

```bash
npm run hash
node src/report/chartGenerator.js
npm run report
```

Or simply run:

```bash
node run.js
```

## 11. Common Flow Questions

### Why is the dictionary limit set to 30000 by default?

The assignment includes a naive linear list. Checking 100000 characters against the full word list with linear scan is intentionally slow. The default keeps the full pipeline practical while still making the asymptotic differences obvious. The limit is configurable with `DICTIONARY_LIMIT`.

### Why are SVG charts used instead of a chart library?

Assignment 1 used external chart/PDF dependencies. Assignment 2 is dependency-free, so SVG is generated directly. This makes the project easier to run on a fresh machine.

### Are the benchmark results reproducible?

Yes. The dictionary source is fixed, generated spell-checking text is deterministic, and hash-table keys are created by a deterministic linear congruential generator.

### Why does the report use HTML and Markdown?

The assignment asks for a report-like file. HTML keeps the charts and tables readable without adding browser automation dependencies. Markdown provides a compact text version.

### Why does the graph benchmark use sample cases instead of random graphs?

The graph tasks are correctness tasks, not timing-comparison tasks. The samples demonstrate the required algorithms and write inspectable JSON output. The functions are reusable with larger inputs.

