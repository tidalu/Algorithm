"use strict";

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const { bruteForce } = require("../algorithms/bruteForce");
const { sunday } = require("../algorithms/sunday");
const { kmp } = require("../algorithms/kmp");
const { fsm } = require("../algorithms/fsm");
const { rabinKarp } = require("../algorithms/rabinKarp");
const { gusfield } = require("../algorithms/gusfield");
const { getText } = require("../utils/textFetcher");
const { getSlices } = require("../utils/textSlicer");

const OUTPUT_DIR = path.join(__dirname, "..", "..", "output");
const RESULT_PATH = path.join(OUTPUT_DIR, "benchmark_results.json");
const TEXT_SIZES = [10000, 50000, 100000, 200000, 500000, 1000000];

const ALGORITHMS = [
  ["Brute Force", bruteForce],
  ["Sunday", sunday],
  ["KMP", kmp],
  ["FSM", fsm],
  ["Rabin-Karp", rabinKarp],
  ["Gusfield Z", gusfield]
];

// Reproducibility note: the large pattern starts at this fixed character
// offset in the Gutenberg text. The small pattern uses the first exact
// occurrence of "the White Whale", which is stable for this Gutenberg file.
const LARGE_PATTERN_START = 20000;
const LARGE_PATTERN_LENGTH = 300;
const SMALL_PATTERN_LITERAL = "the White Whale";

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function selectPatterns(text) {
  const smallStart = text.indexOf(SMALL_PATTERN_LITERAL);
  const smallPattern = smallStart >= 0
    ? text.slice(smallStart, smallStart + SMALL_PATTERN_LITERAL.length)
    : text.slice(1000, 1000 + SMALL_PATTERN_LITERAL.length);

  const safeLargeStart = Math.min(LARGE_PATTERN_START, Math.max(0, text.length - LARGE_PATTERN_LENGTH));
  const largePattern = text.slice(safeLargeStart, safeLargeStart + LARGE_PATTERN_LENGTH);

  return {
    small: {
      type: "small",
      label: "Small pattern",
      start: smallStart >= 0 ? smallStart : 1000,
      value: smallPattern
    },
    large: {
      type: "large",
      label: "Large pattern",
      start: safeLargeStart,
      value: largePattern
    }
  };
}

function measureMedianTime(fn, text, pattern, repetitions) {
  fn(text, pattern);

  const times = [];
  let lastMatchCount = 0;

  for (let run = 0; run < repetitions; run += 1) {
    const start = performance.now();
    const matches = fn(text, pattern);
    const end = performance.now();
    times.push(end - start);
    lastMatchCount = matches.length;
  }

  return {
    medianMs: median(times),
    runsMs: times,
    matchCount: lastMatchCount
  };
}

async function runBenchmark(existingText) {
  const text = existingText ?? await getText();
  const patterns = selectPatterns(text);
  const slices = getSlices(text, TEXT_SIZES);
  const results = [];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const [algorithmName, algorithmFn] of ALGORITHMS) {
    for (const sliceInfo of slices) {
      for (const patternInfo of [patterns.small, patterns.large]) {
        const measurement = measureMedianTime(algorithmFn, sliceInfo.slice, patternInfo.value, 3);
        results.push({
          algorithm: algorithmName,
          size: sliceInfo.size,
          actualTextLength: sliceInfo.slice.length,
          patternType: patternInfo.type,
          patternStart: patternInfo.start,
          patternLength: patternInfo.value.length,
          medianMs: measurement.medianMs,
          runsMs: measurement.runsMs,
          matchCount: measurement.matchCount
        });
      }
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    sizes: TEXT_SIZES,
    patterns,
    results
  };

  fs.writeFileSync(RESULT_PATH, JSON.stringify(output, null, 2), "utf8");
  printSummary(results);
  return output;
}

function printSummary(results) {
  const table = results.map((result) => ({
    Algorithm: result.algorithm,
    Pattern: result.patternType,
    Size: result.size,
    "Median ms": result.medianMs.toFixed(3),
    Matches: result.matchCount
  }));
  console.table(table);
}

if (require.main === module) {
  runBenchmark().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  runBenchmark,
  selectPatterns,
  TEXT_SIZES,
  RESULT_PATH
};
