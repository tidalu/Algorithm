"use strict";

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const { sunday } = require("../algorithms/sunday");
const { kmp } = require("../algorithms/kmp");
const { rabinKarp } = require("../algorithms/rabinKarp");
const { gusfield } = require("../algorithms/gusfield");

const OUTPUT_DIR = path.join(__dirname, "..", "..", "output");
const RESULT_PATH = path.join(OUTPUT_DIR, "wacky_results.json");
const MIN_TEXT_LENGTH = 102400;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function timeAlgorithm(fn, text, pattern) {
  fn(text, pattern);
  const runs = [];
  let matchCount = 0;

  for (let i = 0; i < 5; i += 1) {
    const start = performance.now();
    const matches = fn(text, pattern);
    const end = performance.now();
    runs.push(end - start);
    matchCount = matches.length;
  }

  return {
    medianMs: median(runs),
    runsMs: runs,
    matchCount
  };
}

function buildRaces() {
  return [
    {
      id: "sunday-vs-gusfield",
      title: "Sunday >= 2x faster than Gusfield Z",
      faster: "Sunday",
      slower: "Gusfield Z",
      algorithmA: { name: "Sunday", fn: sunday },
      algorithmB: { name: "Gusfield Z", fn: gusfield },
      text: "c".repeat(MIN_TEXT_LENGTH),
      pattern: `${"a".repeat(255)}b`,
      explanation: "The text character after each Sunday window is never in the pattern, so Sunday jumps by m + 1. Gusfield still builds the full Z-array over pattern + separator + text."
    },
    {
      id: "kmp-vs-rabin-karp",
      title: "KMP >= 2x faster than Rabin-Karp",
      faster: "KMP",
      slower: "Rabin-Karp",
      algorithmA: { name: "KMP", fn: kmp },
      algorithmB: { name: "Rabin-Karp", fn: rabinKarp },
      text: "a".repeat(MIN_TEXT_LENGTH),
      pattern: "a".repeat(128),
      explanation: "Every window is a hash hit for Rabin-Karp, so it must verify many long matches. KMP keeps a prefix-state machine and moves through the text linearly."
    },
    {
      id: "rabin-karp-vs-sunday",
      title: "Rabin-Karp >= 2x faster than Sunday",
      faster: "Rabin-Karp",
      slower: "Sunday",
      algorithmA: { name: "Rabin-Karp", fn: rabinKarp },
      algorithmB: { name: "Sunday", fn: sunday },
      text: "a".repeat(MIN_TEXT_LENGTH),
      pattern: `${"a".repeat(255)}b`,
      explanation: "Sunday compares almost the whole pattern before the final mismatch and then shifts only two positions. Rabin-Karp rolls one hash per position and almost never verifies."
    }
  ];
}

async function runWackyRaces() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const races = buildRaces().map((race) => {
    const measurementA = timeAlgorithm(race.algorithmA.fn, race.text, race.pattern);
    const measurementB = timeAlgorithm(race.algorithmB.fn, race.text, race.pattern);
    const fasterTime = race.algorithmA.name === race.faster
      ? measurementA.medianMs
      : measurementB.medianMs;
    const slowerTime = race.algorithmA.name === race.slower
      ? measurementA.medianMs
      : measurementB.medianMs;

    const result = {
      id: race.id,
      title: race.title,
      textPrefix50: race.text.slice(0, 50),
      textPrefix100: race.text.slice(0, 100),
      pattern: race.pattern,
      explanation: race.explanation,
      measurements: [
        { algorithm: race.algorithmA.name, ...measurementA },
        { algorithm: race.algorithmB.name, ...measurementB }
      ],
      ratio: slowerTime / fasterTime
    };

    console.log(`\n${race.title}`);
    console.log(`T[:50] = ${JSON.stringify(result.textPrefix50)}`);
    console.log(`P = ${JSON.stringify(race.pattern)}`);
    console.table(result.measurements.map((measurement) => ({
      Algorithm: measurement.algorithm,
      "Median ms": measurement.medianMs.toFixed(3),
      Matches: measurement.matchCount
    })));
    console.log(`Ratio (${race.slower} / ${race.faster}): ${result.ratio.toFixed(2)}x`);
    console.log(race.explanation);

    return result;
  });

  const output = {
    generatedAt: new Date().toISOString(),
    races
  };

  fs.writeFileSync(RESULT_PATH, JSON.stringify(output, null, 2), "utf8");
  return output;
}

if (require.main === module) {
  runWackyRaces().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  runWackyRaces,
  buildRaces,
  RESULT_PATH
};
