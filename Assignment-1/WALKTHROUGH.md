# Project Walkthrough

This file explains how the project works from start to finish. It is about the pipeline, files, data flow, benchmarks, charts, and PDF generation. For the algorithm theory itself, use `EXPLANATION.md`, especially sections 2 through 10.

## 1. Project Overview

This project is a Node.js implementation of a university assignment on pattern matching. It implements several exact pattern matching algorithms, runs repeatable benchmarks on real book text, runs adversarial "wacky race" comparisons, tests wildcard matching, generates charts, and assembles a final PDF report.

The assignment has three parts:

- Part 1A measures running time versus text length for six exact algorithms: Brute Force, Sunday, KMP, FSM, Rabin-Karp, and Gusfield Z. It produces `output/benchmark_results.json` and the two running-time charts.
- Part 1B constructs adversarial benchmark inputs to show that different algorithms win on different input shapes. It prints results to the console, writes `output/wacky_results.json`, and contributes to `output/charts/wacky_races.png`.
- Part 2 tests wildcard matching for `?`, `*`, and escaped wildcard characters using the Brute Force and Sunday wildcard extensions. It prints PASS/FAIL results and writes `output/wildcard_results.json`.
- Part 3 is implemented as `src/algorithms/rabinKarp2D.js`. It is described in the report and in `EXPLANATION.md` section 10, but it is not part of the main text benchmark loop.

The single command that runs the whole pipeline is:

```bash
node run.js
```

Before running it for the first time, install dependencies:

```bash
npm install
```

## 2. Folder and File Map

### Project root

`package.json`

- Purpose: Defines the Node project, dependencies, and scripts.
- Important scripts: `npm start` runs `node run.js`, `npm run benchmark` runs `src/benchmark/runner.js`, `npm run wacky` runs `src/benchmark/wackyRaces.js`, `npm run wildcard` runs `src/benchmark/wildcard.js`, and `npm run report` runs `src/report/pdfGenerator.js`.
- Inputs: None at runtime, except when npm reads it.
- Outputs: None directly. It controls how dependencies and commands are run.
- Dependencies listed: `puppeteer`, `chartjs-node-canvas`, `chart.js`, and `node-fetch`.

`run.js`

- Purpose: The main entry point for the whole assignment.
- Inputs: It calls other modules rather than reading user input.
- Outputs: Console progress messages, JSON benchmark files, chart PNGs, and `output/report.pdf`.
- Dependencies: Uses `getText()` from `textFetcher.js`, `runBenchmark()` from `runner.js`, `runWackyRaces()` from `wackyRaces.js`, `runWildcardTests()` from `wildcard.js`, chart functions from `chartGenerator.js`, and `generatePdfReport()` from `pdfGenerator.js`.

`EXPLANATION.md`

- Purpose: Teaches the algorithms themselves: Brute Force, Sunday, KMP, FSM, Rabin-Karp, Gusfield Z, wildcard matching, and 2D Rabin-Karp.
- Inputs: None.
- Outputs: None.
- Relationship to this file: When a defense question is about algorithm internals, read `EXPLANATION.md`. When the question is about project flow, read this file.

`WALKTHROUGH.md`

- Purpose: This file. It explains how the project is wired together and how data moves through the pipeline.
- Inputs: The actual project code.
- Outputs: None.

`assignments descriptions.txt`

- Purpose: Existing assignment notes in the workspace.
- Inputs: None.
- Outputs: None.
- Program dependency: The code does not read this file. It is documentation only.

### `src/algorithms/`

This folder contains the actual algorithm implementations. All exact one-dimensional algorithms use the same standard signature:

```js
algorithm(text, pattern) -> array of zero-based match indices
```

Wildcard functions are different:

```js
wildcardAlgorithm(text, pattern) -> boolean
```

`src/algorithms/bruteForce.js`

- Purpose: Implements `bruteForce(text, pattern)` for exact matching and `bruteForceWildcard(text, pattern)` for Part 2.
- Inputs: A text string and a pattern string.
- Outputs: `bruteForce()` returns an array of match indices. `bruteForceWildcard()` returns `true` or `false`.
- Extra exports: `parseWildcardPattern()` and `tokenMatchesChar()` are helper functions reused by `sunday.js`.
- Used by: `runner.js` for Part 1A, `wildcard.js` for Part 2, and `sunday.js` for wildcard token parsing.
- Algorithm details: See `EXPLANATION.md` sections 2 and 9.

`src/algorithms/sunday.js`

- Purpose: Implements `sunday(text, pattern)` and `sundayWildcard(text, pattern)`.
- Inputs: A text string and a pattern string.
- Outputs: `sunday()` returns an array of match indices. `sundayWildcard()` returns `true` or `false`.
- Extra export: `buildSundayShiftTable()` for the exact Sunday shift table.
- Used by: `runner.js`, `wackyRaces.js`, and `wildcard.js`.
- Algorithm details: See `EXPLANATION.md` sections 3 and 9.

`src/algorithms/kmp.js`

- Purpose: Implements Knuth-Morris-Pratt as `kmp(text, pattern)`.
- Inputs: A text string and a pattern string.
- Outputs: An array of match indices.
- Extra export: `buildPrefixFunction()`, used by `fsm.js`.
- Used by: `runner.js` and `wackyRaces.js`.
- Algorithm details: See `EXPLANATION.md` section 4.

`src/algorithms/fsm.js`

- Purpose: Implements the finite state machine matcher as `fsm(text, pattern)`.
- Inputs: A text string and a pattern string.
- Outputs: An array of match indices.
- Dependencies: Uses `buildPrefixFunction()` from `kmp.js` to help build transitions.
- Used by: `runner.js`.
- Algorithm details: See `EXPLANATION.md` section 5.

`src/algorithms/rabinKarp.js`

- Purpose: Implements one-dimensional Rabin-Karp as `rabinKarp(text, pattern)`.
- Inputs: A text string and a pattern string.
- Outputs: An array of match indices.
- Extra exports: `PRIME` and `BASE`, the hash constants.
- Used by: `runner.js` and `wackyRaces.js`.
- Algorithm details: See `EXPLANATION.md` section 6.

`src/algorithms/gusfield.js`

- Purpose: Implements Gusfield's Z-algorithm pattern matcher as `gusfield(text, pattern)`.
- Inputs: A text string and a pattern string.
- Outputs: An array of match indices.
- Extra export: `buildZArray()`.
- Used by: `runner.js` and `wackyRaces.js`.
- Algorithm details: See `EXPLANATION.md` section 7.

`src/algorithms/rabinKarp2D.js`

- Purpose: Implements Part 3 as `rabinKarp2D(picture, K)`.
- Inputs: `picture`, an `M x N` array of arbitrary items, and `K`, the square size.
- Outputs: `{ found: boolean, position: { row, col } | null }`.
- Used by: Not called by `run.js` directly. It exists as the Part 3 implementation and is described in the generated report.
- Algorithm details: See `EXPLANATION.md` section 10.

### `src/utils/`

`src/utils/textFetcher.js`

- Purpose: Downloads and caches Moby Dick from Project Gutenberg.
- Inputs: The URL stored in `GUTENBERG_URL`: `https://www.gutenberg.org/files/2701/2701-0.txt`.
- Outputs: Saves `data/mobydick.txt` and returns text strings from `getText()` or `getChapter(n)`.
- Exports: `getText()`, `getChapter(n)`, `MOBY_DICK_PATH`, and `GUTENBERG_URL`.
- Used by: `run.js` and `runner.js`.

`src/utils/textSlicer.js`

- Purpose: Creates text chunks of requested approximate byte sizes for the x-axis in the benchmark.
- Inputs: A text string and an array of sizes.
- Output: An array of `{ size, slice }` objects.
- Export: `getSlices(text, sizes)`.
- Used by: `runner.js`.

### `src/benchmark/`

`src/benchmark/runner.js`

- Purpose: Runs the Part 1A benchmark: running time versus text length.
- Inputs: Full Moby Dick text, the six exact algorithm functions, and the size list `TEXT_SIZES = [10000, 50000, 100000, 200000, 500000, 1000000]`.
- Outputs: `output/benchmark_results.json` and a console table.
- Exports: `runBenchmark()`, `selectPatterns()`, `TEXT_SIZES`, and `RESULT_PATH`.
- Dependencies: Uses `textFetcher.js`, `textSlicer.js`, and all six one-dimensional exact algorithm files.

`src/benchmark/wackyRaces.js`

- Purpose: Runs Part 1B adversarial comparisons.
- Inputs: Synthetic text and pattern pairs built by `buildRaces()`.
- Outputs: Console race summaries and `output/wacky_results.json`.
- Exports: `runWackyRaces()`, `buildRaces()`, and `RESULT_PATH`.
- Dependencies: Uses `sunday`, `kmp`, `rabinKarp`, and `gusfield`.

`src/benchmark/wildcard.js`

- Purpose: Runs Part 2 wildcard correctness tests and a large-text timing test.
- Inputs: The hardcoded `TEST_CASES` array plus one large synthetic text.
- Outputs: PASS/FAIL console lines, a timing table, and `output/wildcard_results.json`.
- Exports: `runWildcardTests()`, `TEST_CASES`, and `RESULT_PATH`.
- Dependencies: Uses `bruteForceWildcard()` and `sundayWildcard()`.

### `src/report/`

`src/report/chartGenerator.js`

- Purpose: Generates PNG charts using `chartjs-node-canvas`.
- Inputs: Benchmark results and wacky race results, either as JavaScript objects or JSON file paths.
- Outputs: `output/charts/rt_small_pattern.png`, `output/charts/rt_large_pattern.png`, and `output/charts/wacky_races.png`.
- Exports: `generateRTvsLengthChart()`, `generateWackyChart()`, and `DEFAULT_CHART_DIR`.
- Dependencies: Reads data produced by `runner.js` and `wackyRaces.js`.

`src/report/pdfGenerator.js`

- Purpose: Builds the final PDF report using Puppeteer.
- Inputs: Benchmark results, wacky race results, wildcard results, and chart images.
- Outputs: `output/report.pdf`.
- Exports: `generatePdfReport()`, `buildHtml()`, and `REPORT_PATH`.
- Dependencies: Uses `chartGenerator.js` to ensure charts exist, then embeds chart PNGs as base64 data URIs inside an HTML string.

### `data/`

`data/.gitkeep`

- Purpose: Keeps the `data` folder in the project even before the book has been downloaded.
- Inputs: None.
- Outputs: None.

`data/mobydick.txt`

- Purpose: Cached copy of Moby Dick.
- Inputs: Downloaded from Project Gutenberg by `textFetcher.js`.
- Outputs: Used as the source text for `runner.js`.
- Note: This file is generated at runtime and may not exist before the first successful run.

### `output/`

`output/charts/`

- Purpose: Holds generated PNG charts.
- Generated files: `rt_small_pattern.png`, `rt_large_pattern.png`, and `wacky_races.png`.
- Produced by: `chartGenerator.js`.
- Used by: `pdfGenerator.js`.

`output/benchmark_results.json`

- Purpose: Stores Part 1A benchmark data as an intermediate artifact.
- Produced by: `runner.js`.
- Used by: `chartGenerator.js` and `pdfGenerator.js`.

`output/wacky_results.json`

- Purpose: Stores Part 1B adversarial race data.
- Produced by: `wackyRaces.js`.
- Used by: `chartGenerator.js` and `pdfGenerator.js`.

`output/wildcard_results.json`

- Purpose: Stores Part 2 wildcard test and timing results.
- Produced by: `wildcard.js`.
- Used by: `pdfGenerator.js`.

`output/report.pdf`

- Purpose: Final assignment report.
- Produced by: `pdfGenerator.js`.
- Contains: Cover page, introduction, algorithm descriptions, benchmark results, wacky races, wildcard results, 2D Rabin-Karp explanation, and conclusions.

## 3. Step-by-Step Execution Flow

`run.js` exports and runs an async function called `main()`. When you type `node run.js`, Node executes that function and prints progress messages for five steps.

### Step 1 - Fetching the Book Text

`run.js` first prints:

```text
[1/5] Fetching book text...
```

Then it calls:

```js
const text = await getText();
```

`getText()` comes from `src/utils/textFetcher.js`.

`textFetcher.js` uses these constants:

```js
GUTENBERG_URL = "https://www.gutenberg.org/files/2701/2701-0.txt"
MOBY_DICK_PATH = data/mobydick.txt
```

If `data/mobydick.txt` already exists, `getText()` reads it from disk and returns it as a string. This is the caching behavior: the project does not download the book every time. If the file does not exist, `getText()` calls `downloadText()`, which uses `node-fetch`, downloads the Project Gutenberg text, saves it to `data/mobydick.txt`, and returns the downloaded string.

`getChapter(n)` is also exported. It calls `getText()`, finds chapter headings using the regular expression `/(^|\r?\n)(CHAPTER\s+[^\r\n]+)/gi` in the code, and returns roughly the requested chapter as a trimmed string. The main pipeline does not use `getChapter(n)`, but it is available for experiments or future report additions.

Moby Dick was chosen because it is public-domain, stable, easy to download from Project Gutenberg, and large enough for the assignment. The benchmark needs texts of at least 100 KB and up to about 1,000,000 characters; Moby Dick is large enough to create all the requested slices.

### Step 2 - Part 1A Benchmark (RT vs Text Length)

`run.js` prints:

```text
[2/5] Running Part 1A benchmark (RT vs text length)...
```

Then it calls:

```js
const benchmarkResults = await runBenchmark(text);
```

`runBenchmark()` is defined in `src/benchmark/runner.js`.

The benchmark uses this fixed size list:

```js
TEXT_SIZES = [10000, 50000, 100000, 200000, 500000, 1000000]
```

These sizes become the x-axis values in the running-time charts. `runner.js` calls:

```js
getSlices(text, TEXT_SIZES)
```

from `src/utils/textSlicer.js`. `getSlices()` returns objects like:

```js
{ size: 10000, slice: "..." }
```

The `slice` is the beginning of the book truncated to approximately that many UTF-8 bytes. The function uses `Buffer.byteLength()` and binary search so non-ASCII characters do not accidentally make the byte length much larger than requested.

`runner.js` benchmarks two pattern types:

- Small pattern: `SMALL_PATTERN_LITERAL = "the White Whale"`. The code searches the full text for its first exact occurrence using `text.indexOf(SMALL_PATTERN_LITERAL)`. If it cannot find it, it falls back to a substring starting at index `1000`.
- Large pattern: a 300-character substring. The constants are `LARGE_PATTERN_START = 20000` and `LARGE_PATTERN_LENGTH = 300`. The helper `selectPatterns(text)` extracts that stable substring from the book.

The benchmark tests these six algorithms, stored in the `ALGORITHMS` array:

```js
["Brute Force", bruteForce]
["Sunday", sunday]
["KMP", kmp]
["FSM", fsm]
["Rabin-Karp", rabinKarp]
["Gusfield Z", gusfield]
```

For each algorithm, each text size, and each pattern type, `runner.js` calls `measureMedianTime(algorithmFn, slice, pattern, 3)`.

Timing uses:

```js
const start = performance.now();
const matches = fn(text, pattern);
const end = performance.now();
```

Before timing, the function is called once as a warm-up:

```js
fn(text, pattern);
```

This helps reduce JavaScript JIT compiler noise. Node's V8 engine may optimize a function after it has already run once, so the first call is often not representative.

The code runs each measured case 3 times and stores all three values in `runsMs`. It then uses the median as `medianMs`. The median is better than the average here because one unusually slow run, caused by garbage collection or operating system scheduling, will not distort the result as much. Three runs are also quick enough that the full assignment pipeline remains practical.

`runner.js` writes `output/benchmark_results.json`. Its top-level structure is:

```js
{
  "generatedAt": "... ISO timestamp ...",
  "sizes": [10000, 50000, 100000, 200000, 500000, 1000000],
  "patterns": {
    "small": {
      "type": "small",
      "label": "Small pattern",
      "start": 12345,
      "value": "the White Whale"
    },
    "large": {
      "type": "large",
      "label": "Large pattern",
      "start": 20000,
      "value": "... 300 characters ..."
    }
  },
  "results": [
    {
      "algorithm": "KMP",
      "size": 100000,
      "actualTextLength": 100000,
      "patternType": "small",
      "patternStart": 12345,
      "patternLength": 15,
      "medianMs": 1.234,
      "runsMs": [1.2, 1.234, 1.5],
      "matchCount": 2
    }
  ]
}
```

The important fields in each `results` row are:

- `algorithm`: which algorithm ran.
- `size`: requested benchmark size.
- `actualTextLength`: actual JavaScript string length of the slice.
- `patternType`: `small` or `large`.
- `patternStart`: where the pattern came from in the original book text.
- `patternLength`: pattern length in characters.
- `medianMs`: the median timing used in charts and analysis.
- `runsMs`: the three raw timing measurements.
- `matchCount`: how many matches the algorithm found.

The console output is produced by `printSummary(results)`. It uses `console.table()` with columns:

```text
Algorithm | Pattern | Size | Median ms | Matches
```

### Step 3 - Part 1B Wacky Races

`run.js` prints:

```text
[3/5] Running Part 1B wacky races...
```

Then it calls:

```js
const wackyResults = await runWackyRaces();
```

`runWackyRaces()` is defined in `src/benchmark/wackyRaces.js`. It builds three synthetic races using `buildRaces()`. Each race has at least `MIN_TEXT_LENGTH = 102400` characters, satisfying the assignment's 100 KB requirement.

Each algorithm is warmed up once and then measured 5 times by `timeAlgorithm(fn, text, pattern)`. The script stores all run times in `runsMs`, takes the median as `medianMs`, and records `matchCount`.

Race 1: Sunday vs Gusfield Z

- Text `T`: `"c".repeat(102400)`.
- Pattern `P`: `"a".repeat(255) + "b"`.
- Intended result: Sunday is at least 2x faster than Gusfield Z.
- Why this is adversarial for Gusfield Z: Gusfield always builds and scans the full combined string `pattern + separator + text`. It cannot skip sections just because the text is unpromising.
- Why Sunday does well: The character after each Sunday window is `c`, and `c` does not appear in the pattern, so Sunday shifts by `m + 1`.
- For the internals of Sunday and Gusfield Z, see `EXPLANATION.md` sections 3 and 7.

Race 2: KMP vs Rabin-Karp

- Text `T`: `"a".repeat(102400)`.
- Pattern `P`: `"a".repeat(128)`.
- Intended result: KMP is at least 2x faster than Rabin-Karp.
- Why this is adversarial for Rabin-Karp: Every window is a real match, so every hash hit triggers full verification of a long pattern. This creates many expensive confirmation checks.
- Why KMP does well: KMP moves through the text linearly using its prefix state and can report overlapping matches without starting over.
- For the internals of KMP and Rabin-Karp, see `EXPLANATION.md` sections 4 and 6.

Race 3: Rabin-Karp vs Sunday

- Text `T`: `"a".repeat(102400)`.
- Pattern `P`: `"a".repeat(255) + "b"`.
- Intended result: Rabin-Karp is at least 2x faster than Sunday.
- Why this is adversarial for Sunday: Each Sunday alignment matches almost the entire pattern and then fails at the final `b`. The after-window character is `a`, and the Sunday shift for `a` is small, so Sunday repeats this expensive work many times.
- Why Rabin-Karp does well: It rolls one hash per position, and the window hash almost never equals the pattern hash, so it avoids full verification.
- For the internals of Sunday and Rabin-Karp, see `EXPLANATION.md` sections 3 and 6.

For each race, `wackyRaces.js` prints:

- the race title
- `T[:50]`
- the full pattern `P`
- a console table with `Algorithm`, `Median ms`, and `Matches`
- a ratio line like `Ratio (Sunday / Rabin-Karp): 15.67x`
- the explanation string stored in the race object

A ratio greater than or equal to `2x` means the slower algorithm's median time was at least twice the faster algorithm's median time:

```js
ratio = slowerTime / fasterTime
```

The script also writes `output/wacky_results.json`. That JSON contains `generatedAt` and a `races` array. Each race row includes `id`, `title`, `textPrefix50`, `textPrefix100`, `pattern`, `explanation`, `measurements`, and `ratio`.

### Step 4 - Part 2 Wildcard Tests

`run.js` prints:

```text
[4/5] Running Part 2 wildcard tests...
```

Then it calls:

```js
const wildcardResults = await runWildcardTests();
```

`runWildcardTests()` is defined in `src/benchmark/wildcard.js`.

The file imports:

```js
bruteForceWildcard()
sundayWildcard()
```

It runs the hardcoded `TEST_CASES` array. The cases cover:

- basic literal match: pattern `"world"` in `"hello world"`
- `?` matching one character: `"h?llo"`
- `*` matching text in the middle: `"h*o"`
- escaped question mark: `"he\\?lo"`
- escaped star: `"he\\*lo"`
- escaped backslash: `"he\\\\lo"`
- no match: `"world"` in `"hello"`
- match at the start: `"start*"`
- match at the end: `"*end"`
- `*` matching the empty string: `"beau*tiful"`
- match in the middle: `"hello"`
- combined wildcard pattern: `"h?llo*world"`
- combined wildcard no-match case: `"a*d"` in `"abc"`

For each test, the script computes:

```js
const brute = bruteForceWildcard(test.text, test.pattern);
const sunday = sundayWildcard(test.text, test.pattern);
```

PASS/FAIL is determined by:

```js
const passed = brute === test.expected && sunday === test.expected && brute === sunday;
```

So a test passes only if both implementations agree with the expected answer and with each other.

After correctness tests, the script runs a large-text timing case:

```js
largeText = "a".repeat(50000) + "needleZend" + "b".repeat(60000)
largePattern = "n*Z?nd"
```

This shows that both wildcard implementations can handle text longer than 100 KB and gives a rough timing comparison. It is not the main Part 1A benchmark; it is a Part 2 demonstration that wildcard matching works on large input.

The script writes `output/wildcard_results.json`. That JSON contains `generatedAt`, `tests`, and `largeTiming`.

For wildcard algorithm internals, see `EXPLANATION.md` section 9.

### Step 5 - Chart Generation and PDF Report

`run.js` prints:

```text
[5/5] Generating charts and PDF report...
```

Then it runs:

```js
await generateRTvsLengthChart(benchmarkResults, DEFAULT_CHART_DIR);
await generateWackyChart(wackyResults, DEFAULT_CHART_DIR);
await generatePdfReport({ benchmarkResults, wackyResults, wildcardResults });
```

#### Sub-step A: `chartGenerator.js`

`src/report/chartGenerator.js` uses the `chartjs-node-canvas` library. This library lets Chart.js render charts in Node without opening a normal browser window.

The main exports are:

```js
generateRTvsLengthChart(results, outputPath)
generateWackyChart(wackyResults, outputPath)
DEFAULT_CHART_DIR
```

`generateRTvsLengthChart()` reads the Part 1A benchmark data. In `run.js`, it receives the in-memory `benchmarkResults` object returned by `runBenchmark()`. If run separately, `chartGenerator.js` can also read `output/benchmark_results.json`.

It produces two line charts:

- `output/charts/rt_small_pattern.png`
- `output/charts/rt_large_pattern.png`

Each line chart has:

- x-axis: text length in characters, based on the `sizes` array
- y-axis: median running time in milliseconds
- one line per algorithm
- a legend at the bottom
- a title like `Running Time vs Text Length (small pattern)`
- a white background

Internally, `renderLineChart(results, patternType, outputFile)` filters `results.results` by `patternType`, finds all algorithm names, and builds one Chart.js dataset per algorithm. The y-values come from `medianMs`.

`generateWackyChart()` reads the Part 1B race data from `wackyResults`. It produces:

```text
output/charts/wacky_races.png
```

This is a bar chart comparing the faster and slower median times for each race. The x-axis is the race, and the y-axis is median time in milliseconds.

#### Sub-step B: `pdfGenerator.js`

`src/report/pdfGenerator.js` uses `puppeteer`. Puppeteer launches a headless Chromium browser, loads an HTML page, and prints that page to a PDF.

The main function is:

```js
generatePdfReport(inputs = {})
```

It accepts optional in-memory inputs:

```js
{
  benchmarkResults,
  wackyResults,
  wildcardResults
}
```

If those are not provided, it tries to read:

- `output/benchmark_results.json`
- `output/wacky_results.json`
- `output/wildcard_results.json`

The HTML is built directly in code by:

```js
buildHtml({ benchmarkResults, wackyResults, wildcardResults, chartUris })
```

There is no external HTML file. The CSS is also inside the HTML string in a `<style>` tag.

Before building the final HTML, `ensureCharts()` checks that chart PNGs exist. It uses:

```js
imageToDataUri(filePath)
```

to convert PNG files into base64 data URIs like:

```text
data:image/png;base64,...
```

Embedding charts this way makes the PDF self-contained. The report does not depend on separate image files after it is generated.

The PDF contains these sections:

1. Cover page with title, student name placeholder, and generated date
2. Introduction
3. Algorithm Descriptions
4. Part 1A Benchmark Results
5. Part 1B - Wacky Races
6. Part 2 - Wildcard Matching
7. Part 3 - 2D Rabin-Karp
8. Conclusions

The final file is saved to:

```text
output/report.pdf
```

When everything finishes, `run.js` prints:

```text
Done! Report saved to output/report.pdf
```

## 4. Data Flow Diagram (ASCII)

```text
Project Gutenberg
        |
        v
src/utils/textFetcher.js
        |
        v
data/mobydick.txt
        |
        v
src/utils/textSlicer.js
        |
        v
text chunks of varying sizes
        |
        v
src/benchmark/runner.js + all 6 exact algorithms
        |
        v
output/benchmark_results.json
        |
        v
src/report/chartGenerator.js
        |
        v
output/charts/rt_small_pattern.png
output/charts/rt_large_pattern.png

src/benchmark/wackyRaces.js
        |
        +--> console output
        |
        v
output/wacky_results.json
        |
        v
src/report/chartGenerator.js
        |
        v
output/charts/wacky_races.png

src/benchmark/wildcard.js
        |
        +--> console output (PASS/FAIL)
        |
        v
output/wildcard_results.json

output/charts/*.png
output/benchmark_results.json
output/wacky_results.json
output/wildcard_results.json
        |
        v
src/report/pdfGenerator.js
        |
        v
output/report.pdf
```

## 5. How to Add a New Algorithm to the Benchmark

To add a new exact one-dimensional algorithm to Part 1A, follow this pattern.

1. Create a new file:

```text
src/algorithms/myAlgorithm.js
```

It should export a function with the standard signature:

```js
function myAlgorithm(text, pattern) {
  // return array of zero-based match indices
}

module.exports = {
  myAlgorithm
};
```

The function must return an array of start indices, just like the other exact algorithms. It should handle the same edge cases: empty pattern, pattern longer than text, no matches, and overlapping matches.

2. Add a `require()` line in `src/benchmark/runner.js`:

```js
const { myAlgorithm } = require("../algorithms/myAlgorithm");
```

3. Add it to the `ALGORITHMS` array in `src/benchmark/runner.js`:

```js
const ALGORITHMS = [
  ["Brute Force", bruteForce],
  ["Sunday", sunday],
  ["KMP", kmp],
  ["FSM", fsm],
  ["Rabin-Karp", rabinKarp],
  ["Gusfield Z", gusfield],
  ["My Algorithm", myAlgorithm]
];
```

4. Re-run:

```bash
node run.js
```

The new algorithm will automatically appear in:

- the console benchmark table
- `output/benchmark_results.json`
- `output/charts/rt_small_pattern.png`
- `output/charts/rt_large_pattern.png`

The report's chart images will include it automatically because `chartGenerator.js` builds chart datasets from the algorithm names present in `benchmark_results.json`.

If you want the written "Algorithm Descriptions" section in the PDF to mention the new algorithm, also edit `algorithmDescriptionsHtml()` in `src/report/pdfGenerator.js`.

## 6. How to Modify the PDF Report

The report HTML template is in:

```text
src/report/pdfGenerator.js
```

The function to edit is:

```js
buildHtml({ benchmarkResults, wackyResults, wildcardResults, chartUris })
```

That function returns one large HTML string. Each report page is a `<section class="page">...</section>`.

To add a new section:

1. Open `src/report/pdfGenerator.js`.
2. Find `buildHtml()`.
3. Add a new `<section class="page">` block in the returned HTML string.
4. Use `escapeHtml()` if you insert dynamic text from JSON or user-controlled data.
5. Re-run `node run.js` or `npm run report`.

To change styles:

1. Find the `<style>` block inside the HTML string in `buildHtml()`.
2. Edit CSS rules such as `body`, `.page`, `h1`, `h2`, `table`, or `img.chart`.
3. Re-run report generation.

To add a new chart:

1. Add a chart function in `src/report/chartGenerator.js`.
2. Use `createCanvas()` and a Chart.js configuration object.
3. Save the PNG into `output/charts/`.
4. In `pdfGenerator.js`, update `ensureCharts()` so it generates or finds the new chart.
5. Convert it to a base64 data URI with `imageToDataUri()`.
6. Add an `<img class="chart" src="...">` element in `buildHtml()`.

The key idea is that `chartGenerator.js` creates PNG files, and `pdfGenerator.js` embeds those PNG files into the HTML before Puppeteer prints the PDF.

## 7. Common Questions a Professor Might Ask About the Flow

### "Why do you use the median of 3 runs instead of a single run?"

A single timing can be distorted by garbage collection, operating system scheduling, or temporary CPU load. Running each benchmark case 3 times gives a small sample, and the median ignores one unusually high or low outlier better than a single run would. It keeps the benchmark more stable without making the whole assignment take too long.

### "How do you ensure the benchmark is fair across algorithms?"

Each algorithm receives the same text slice and the same pattern for a given benchmark case. The benchmark uses the same timing method, `performance.now()`, for every algorithm, and each function is warmed up once before measurement. The results also record `matchCount`, which helps check that algorithms are solving the same problem.

### "Why did you choose Moby Dick as the text?"

Moby Dick is public-domain text from Project Gutenberg, so it is easy to download and safe to use in an assignment. It is also large enough to create all required benchmark sizes, including inputs above 100 KB and up to about 1,000,000 characters. Using one stable text source makes the benchmark reproducible.

### "How does your chart generator work without a browser?"

`chartGenerator.js` uses `chartjs-node-canvas`. That package lets Chart.js render onto a server-side canvas in Node.js, producing PNG buffers directly. The code writes those buffers to `output/charts/*.png`.

### "Why is the PDF self-contained (base64 images)?"

`pdfGenerator.js` converts chart PNGs into base64 data URIs and places them directly in the HTML. When Puppeteer prints the HTML to PDF, the images are already embedded in the page data. That means the final `output/report.pdf` does not need separate PNG files to display correctly.

### "What would break if the Project Gutenberg URL changed?"

If `GUTENBERG_URL` stopped working and `data/mobydick.txt` did not already exist, `getText()` would fail during Step 1. If the cached file already exists, the project would still run because `getText()` reads the local file first. To fix a broken URL, update `GUTENBERG_URL` in `src/utils/textFetcher.js`.

### "How do you prevent the JIT compiler from distorting your benchmark results?"

Both `measureMedianTime()` in `runner.js` and `timeAlgorithm()` in `wackyRaces.js` call the algorithm once before measured runs. This warm-up call gives V8 a chance to parse, compile, and begin optimizing the function before timing starts. Using the median of repeated runs further reduces the effect of one odd run.

### "Why does benchmark_results.json exist as an intermediate file?"

It separates measurement from presentation. `runner.js` can produce raw benchmark data once, and then `chartGenerator.js` and `pdfGenerator.js` can reuse it without rerunning the expensive benchmarks. It also makes the results inspectable: you can open the JSON and see exact timings, pattern choices, text sizes, and match counts.
