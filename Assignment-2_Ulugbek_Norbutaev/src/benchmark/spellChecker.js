"use strict";

const fs = require("fs");
const path = require("path");

const { BalancedTernarySearchTree } = require("../structures/balancedTernarySearchTree");
const { DoubleArrayTrie } = require("../structures/doubleArrayTrie");
const { HashMapDictionary } = require("../structures/hashMapDictionary");
const { LinearDictionary } = require("../structures/linearDictionary");
const { RedBlackTreeDictionary } = require("../structures/redBlackTreeDictionary");
const { TrieDictionary } = require("../structures/trieDictionary");
const { assignmentRoot, buildSpellText, bytesToHuman, readWordList, tokenize } = require("../utils/text");
const { measure } = require("../utils/timing");

const WORDS_PATH = assignmentRoot("english_words.txt");
const RESULT_PATH = assignmentRoot("output", "spell_results.json");
const DEFAULT_DICTIONARY_LIMIT = Number(process.env.DICTIONARY_LIMIT || 30000);
const LOOKUP_RUNS = Number(process.env.LOOKUP_RUNS || 3);
const TEXT_CHAR_SIZES = [5000, 10000, 20000, 50000, 100000];

const DICTIONARIES = [
  ["Linear List", () => new LinearDictionary()],
  ["Red-Black Tree", () => new RedBlackTreeDictionary()],
  ["Ordinary Trie", () => new TrieDictionary()],
  ["Hash Map", () => new HashMapDictionary()],
  ["Balanced Ternary Trie", () => new BalancedTernarySearchTree()],
  ["Double-Array Trie", () => new DoubleArrayTrie()]
];

function spellCheck(dictionary, tokens) {
  let correct = 0;
  let misspelled = 0;

  for (const token of tokens) {
    if (dictionary.has(token)) {
      correct += 1;
    } else {
      misspelled += 1;
    }
  }

  return { correct, misspelled, total: tokens.length };
}

function printBuildSummary(buildResults) {
  const rows = buildResults.map((row) => ({
    Dictionary: row.dictionary,
    "Build ms": row.buildMedianMs.toFixed(3),
    Memory: bytesToHuman(row.memoryBytes)
  }));
  console.table(rows);
}

function printLookupSummary(lookupResults) {
  const largestSize = Math.max(...lookupResults.map((row) => row.requestedChars));
  const rows = lookupResults
    .filter((row) => row.requestedChars === largestSize)
    .map((row) => ({
      Dictionary: row.dictionary,
      "Chars": row.actualChars,
      "Tokens": row.tokenCount,
      "Lookup ms": row.lookupMedianMs.toFixed(3),
      Misspelled: row.misspelled
    }));
  console.table(rows);
}

async function runSpellBenchmark(options = {}) {
  const dictionaryLimit = options.dictionaryLimit ?? DEFAULT_DICTIONARY_LIMIT;
  const sizes = options.sizes ?? TEXT_CHAR_SIZES;
  const words = readWordList(options.wordsPath ?? WORDS_PATH, { limit: dictionaryLimit });
  const textCases = sizes.map((size) => {
    const text = buildSpellText(words, size);
    return {
      requestedChars: size,
      actualChars: text.length,
      tokens: tokenize(text)
    };
  });

  const buildResults = [];
  const lookupResults = [];

  for (const [name, factory] of DICTIONARIES) {
    const buildMeasurement = measure(() => {
      const dictionary = factory();
      dictionary.build(words);
      return dictionary;
    }, 1);

    const dictionary = buildMeasurement.result;
    buildResults.push({
      dictionary: name,
      buildMedianMs: buildMeasurement.medianMs,
      buildRunsMs: buildMeasurement.runsMs,
      memoryBytes: dictionary.estimateMemoryBytes(),
      dictionarySize: words.length
    });

    for (const textCase of textCases) {
      const lookupMeasurement = measure(() => spellCheck(dictionary, textCase.tokens), LOOKUP_RUNS);
      lookupResults.push({
        dictionary: name,
        requestedChars: textCase.requestedChars,
        actualChars: textCase.actualChars,
        tokenCount: textCase.tokens.length,
        lookupMedianMs: lookupMeasurement.medianMs,
        lookupRunsMs: lookupMeasurement.runsMs,
        correct: lookupMeasurement.result.correct,
        misspelled: lookupMeasurement.result.misspelled
      });
    }
  }

  const results = {
    generatedAt: new Date().toISOString(),
    dictionaryLimit,
    dictionarySize: words.length,
    textSizes: sizes,
    lookupRuns: LOOKUP_RUNS,
    buildResults,
    lookupResults
  };

  fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
  fs.writeFileSync(RESULT_PATH, JSON.stringify(results, null, 2));

  console.log("\nDictionary build summary:");
  printBuildSummary(buildResults);
  console.log("\nLookup summary at largest text size:");
  printLookupSummary(lookupResults);

  return results;
}

if (require.main === module) {
  runSpellBenchmark().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  DICTIONARIES,
  RESULT_PATH,
  TEXT_CHAR_SIZES,
  WORDS_PATH,
  runSpellBenchmark,
  spellCheck
};
