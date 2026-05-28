"use strict";

const fs = require("fs");
const path = require("path");

const {
  DoubleHashingHashTable,
  LinearProbingHashTable,
  SeparateChainingHashTable
} = require("../structures/hashTables");
const { assignmentRoot } = require("../utils/text");
const { generateKeys } = require("../utils/random");
const { measure } = require("../utils/timing");

const RESULT_PATH = assignmentRoot("output", "hash_table_results.json");
const CAPACITY = Number(process.env.HASH_TABLE_CAPACITY || 20011);
const LOAD_FACTORS = [0.1, 0.25, 0.5, 0.7, 0.8, 0.9];
const RUNS = Number(process.env.HASH_RUNS || 3);

const TABLES = [
  ["Separate Chaining", SeparateChainingHashTable],
  ["Linear Probing", LinearProbingHashTable],
  ["Double Hashing", DoubleHashingHashTable]
];

function insertAll(table, keys) {
  for (const key of keys) {
    table.insert(key, true);
  }
  return table.size;
}

function searchAll(table, keys) {
  let found = 0;
  for (const key of keys) {
    if (table.search(key) !== undefined) {
      found += 1;
    }
  }
  return found;
}

async function runHashTableBenchmark(options = {}) {
  const capacity = options.capacity ?? CAPACITY;
  const loadFactors = options.loadFactors ?? LOAD_FACTORS;
  const results = [];

  for (const loadFactor of loadFactors) {
    const itemCount = Math.floor(capacity * loadFactor);
    const keys = generateKeys(itemCount, `load_${String(loadFactor).replace(".", "_")}`);
    const missingKeys = generateKeys(itemCount, `missing_${String(loadFactor).replace(".", "_")}`);
    const searchKeys = keys.concat(missingKeys);

    for (const [name, TableClass] of TABLES) {
      const insertMeasurement = measure(() => {
        const table = new TableClass(capacity);
        insertAll(table, keys);
        return table;
      }, RUNS);

      const table = new TableClass(capacity);
      insertAll(table, keys);
      const searchMeasurement = measure(() => searchAll(table, searchKeys), RUNS);

      results.push({
        table: name,
        loadFactor,
        capacity,
        itemCount,
        searchCount: searchKeys.length,
        insertMedianMs: insertMeasurement.medianMs,
        insertRunsMs: insertMeasurement.runsMs,
        insertUsPerOp: (insertMeasurement.medianMs * 1000) / itemCount,
        searchMedianMs: searchMeasurement.medianMs,
        searchRunsMs: searchMeasurement.runsMs,
        searchUsPerOp: (searchMeasurement.medianMs * 1000) / searchKeys.length,
        found: searchMeasurement.result
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    capacity,
    loadFactors,
    runs: RUNS,
    results
  };

  fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
  fs.writeFileSync(RESULT_PATH, JSON.stringify(payload, null, 2));

  const rows = results
    .filter((row) => row.loadFactor === loadFactors[loadFactors.length - 1])
    .map((row) => ({
      Table: row.table,
      Load: row.loadFactor,
      "Insert us/op": row.insertUsPerOp.toFixed(3),
      "Search us/op": row.searchUsPerOp.toFixed(3)
    }));
  console.log("\nHash table summary at largest load factor:");
  console.table(rows);

  return payload;
}

if (require.main === module) {
  runHashTableBenchmark().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  CAPACITY,
  LOAD_FACTORS,
  RESULT_PATH,
  TABLES,
  runHashTableBenchmark
};
