"use strict";

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const { bruteForceWildcard } = require("../algorithms/bruteForce");
const { sundayWildcard } = require("../algorithms/sunday");

const OUTPUT_DIR = path.join(__dirname, "..", "..", "output");
const RESULT_PATH = path.join(OUTPUT_DIR, "wildcard_results.json");

const TEST_CASES = [
  { name: "basic literal", text: "hello world", pattern: "world", expected: true },
  { name: "question mark", text: "hello", pattern: "h?llo", expected: true },
  { name: "star consumes middle", text: "hello", pattern: "h*o", expected: true },
  { name: "escaped question", text: "he?lo", pattern: "he\\?lo", expected: true },
  { name: "escaped star", text: "he*lo", pattern: "he\\*lo", expected: true },
  { name: "escaped backslash", text: "he\\lo", pattern: "he\\\\lo", expected: true },
  { name: "no match", text: "hello", pattern: "world", expected: false },
  { name: "match at start", text: "start middle end", pattern: "start*", expected: true },
  { name: "match at end", text: "start middle end", pattern: "*end", expected: true },
  { name: "star matches empty", text: "beautiful", pattern: "beau*tiful", expected: true },
  { name: "match in middle", text: "say hello now", pattern: "hello", expected: true },
  { name: "combined wildcards", text: "hello beautiful world", pattern: "h?llo*world", expected: true },
  { name: "combined no match", text: "abc", pattern: "a*d", expected: false }
];

function timeCall(fn, text, pattern) {
  fn(text, pattern);
  const start = performance.now();
  const result = fn(text, pattern);
  const end = performance.now();
  return {
    result,
    ms: end - start
  };
}

async function runWildcardTests() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const tests = TEST_CASES.map((test) => {
    const brute = bruteForceWildcard(test.text, test.pattern);
    const sunday = sundayWildcard(test.text, test.pattern);
    const passed = brute === test.expected && sunday === test.expected && brute === sunday;

    console.log(`${passed ? "PASS" : "FAIL"} ${test.name}: pattern=${JSON.stringify(test.pattern)} expected=${test.expected} brute=${brute} sunday=${sunday}`);

    return {
      ...test,
      bruteForceWildcard: brute,
      sundayWildcard: sunday,
      passed
    };
  });

  const largeText = `${"a".repeat(50000)}needleZend${"b".repeat(60000)}`;
  const largePattern = "n*Z?nd";
  const largeTiming = {
    textLength: largeText.length,
    pattern: largePattern,
    bruteForceWildcard: timeCall(bruteForceWildcard, largeText, largePattern),
    sundayWildcard: timeCall(sundayWildcard, largeText, largePattern)
  };

  console.log("\nLarge wildcard timing:");
  console.table([
    {
      Algorithm: "Brute Force Wildcard",
      Result: largeTiming.bruteForceWildcard.result,
      "Time ms": largeTiming.bruteForceWildcard.ms.toFixed(3)
    },
    {
      Algorithm: "Sunday Wildcard",
      Result: largeTiming.sundayWildcard.result,
      "Time ms": largeTiming.sundayWildcard.ms.toFixed(3)
    }
  ]);

  const output = {
    generatedAt: new Date().toISOString(),
    tests,
    largeTiming
  };

  fs.writeFileSync(RESULT_PATH, JSON.stringify(output, null, 2), "utf8");
  return output;
}

if (require.main === module) {
  runWildcardTests().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  runWildcardTests,
  TEST_CASES,
  RESULT_PATH
};
