"use strict";

const { getText } = require("./src/utils/textFetcher");
const { runBenchmark } = require("./src/benchmark/runner");
const { runWackyRaces } = require("./src/benchmark/wackyRaces");
const { runWildcardTests } = require("./src/benchmark/wildcard");
const { generateRTvsLengthChart, generateWackyChart, DEFAULT_CHART_DIR } = require("./src/report/chartGenerator");
const { generatePdfReport } = require("./src/report/pdfGenerator");

async function main() {
  console.log("=== Pattern Matching Assignment I ===\n");

  console.log("[1/5] Fetching book text...");
  const text = await getText();

  console.log("[2/5] Running Part 1A benchmark (RT vs text length)...");
  const benchmarkResults = await runBenchmark(text);

  console.log("[3/5] Running Part 1B wacky races...");
  const wackyResults = await runWackyRaces();

  console.log("[4/5] Running Part 2 wildcard tests...");
  const wildcardResults = await runWildcardTests();

  console.log("[5/5] Generating charts and PDF report...");
  await generateRTvsLengthChart(benchmarkResults, DEFAULT_CHART_DIR);
  await generateWackyChart(wackyResults, DEFAULT_CHART_DIR);
  await generatePdfReport({ benchmarkResults, wackyResults, wildcardResults });

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
