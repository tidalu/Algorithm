"use strict";

const { runSpellBenchmark } = require("./src/benchmark/spellChecker");
const { runGraphTaskExamples } = require("./src/benchmark/graphTasks");
const { runHashTableBenchmark } = require("./src/benchmark/hashTableBenchmark");
const { generateCharts, DEFAULT_CHART_DIR } = require("./src/report/chartGenerator");
const { generateReport } = require("./src/report/reportGenerator");

async function main() {
  console.log("=== Algorithms Assignment II ===\n");

  console.log("[1/5] Running Part 1A and Part 3 dictionary benchmarks...");
  const spellResults = await runSpellBenchmark();

  console.log("[2/5] Running Part 1B and 1C graph examples...");
  const graphResults = await runGraphTaskExamples();

  console.log("[3/5] Running Part 2 hash table benchmark...");
  const hashResults = await runHashTableBenchmark();

  console.log("[4/5] Generating PNG charts...");
  await generateCharts({ spellResults, hashResults }, DEFAULT_CHART_DIR);

  console.log("[5/5] Generating PDF report...");
  await generateReport({ spellResults, graphResults, hashResults });

  console.log("\nDone! Report saved to output/report.pdf");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  main
};
