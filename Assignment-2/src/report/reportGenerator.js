"use strict";

const fs = require("fs");
const path = require("path");

const { assignmentRoot, bytesToHuman } = require("../utils/text");

const REPORT_HTML_PATH = assignmentRoot("output", "report.html");
const REPORT_MD_PATH = assignmentRoot("output", "report.md");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadJson(fileName) {
  return JSON.parse(fs.readFileSync(assignmentRoot("output", fileName), "utf8"));
}

function minBy(rows, selector) {
  return rows.reduce((best, row) => (selector(row) < selector(best) ? row : best), rows[0]);
}

function table(headers, rows) {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function chart(fileName, caption) {
  return `
    <figure>
      <img src="charts/${fileName}" alt="${escapeHtml(caption)}">
      <figcaption>${escapeHtml(caption)}</figcaption>
    </figure>`;
}

function buildDictionarySection(spellResults) {
  const largestSize = Math.max(...spellResults.lookupResults.map((row) => row.requestedChars));
  const largestLookupRows = spellResults.lookupResults.filter((row) => row.requestedChars === largestSize);
  const fastestBuild = minBy(spellResults.buildResults, (row) => row.buildMedianMs);
  const fastestLookup = minBy(largestLookupRows, (row) => row.lookupMedianMs);
  const smallestMemory = minBy(spellResults.buildResults, (row) => row.memoryBytes);

  const buildRows = spellResults.buildResults.map((row) => [
    row.dictionary,
    row.buildMedianMs.toFixed(3),
    bytesToHuman(row.memoryBytes)
  ]);

  const lookupRows = largestLookupRows.map((row) => [
    row.dictionary,
    row.actualChars,
    row.tokenCount,
    row.lookupMedianMs.toFixed(3),
    row.misspelled
  ]);

  return `
    <section>
      <h2>Part 1A and Part 3: Dictionary Races</h2>
      <p>The benchmark uses ${spellResults.dictionarySize} normalized words from <code>english_words.txt</code>. The default limit keeps the naive linear list measurable while still using a large dictionary. Increase <code>DICTIONARY_LIMIT</code> to run a heavier experiment.</p>
      <p>Fastest build: <strong>${escapeHtml(fastestBuild.dictionary)}</strong>. Fastest lookup on the largest text: <strong>${escapeHtml(fastestLookup.dictionary)}</strong>. Smallest estimated memory: <strong>${escapeHtml(smallestMemory.dictionary)}</strong>.</p>
      ${chart("spell_lookup_rt.svg", "Median spell-checking lookup time against text length.")}
      ${chart("dictionary_build_time.svg", "Dictionary construction time.")}
      ${chart("dictionary_memory.svg", "Approximate memory use for each dictionary structure.")}
      <h3>Build and Memory</h3>
      ${table(["Dictionary", "Build ms", "Estimated memory"], buildRows)}
      <h3>Largest Text Lookup</h3>
      ${table(["Dictionary", "Characters", "Tokens", "Lookup ms", "Misspelled"], lookupRows)}
    </section>`;
}

function buildGraphSection(graphResults) {
  const triwizardRows = graphResults.triwizard.competitors.map((wizard) => [
    wizard.name,
    wizard.distance,
    wizard.speed,
    wizard.minutes === null || wizard.minutes === Infinity ? "unreachable" : wizard.minutes.toFixed(3)
  ]);

  const namesday = graphResults.namesday;
  const seatingText = namesday.possible
    ? `Table 1: ${namesday.tables[0].join(", ")}<br>Table 2: ${namesday.tables[1].join(", ")}`
    : `No valid seating. Conflict: ${namesday.conflict.join(" - ")}`;

  return `
    <section>
      <h2>Part 1B and 1C: Graph Tasks</h2>
      <p>Triwizard uses a single BFS from the exit. After the distance map is built, every wizard's travel time is computed as shortest-path corridor distance divided by speed.</p>
      ${table(["Wizard", "Shortest distance", "Speed", "Minutes"], triwizardRows)}
      <p>Winner: <strong>${escapeHtml(graphResults.triwizard.winner ? graphResults.triwizard.winner.name : graphResults.triwizard.winners.map((w) => w.name).join(", "))}</strong>.</p>
      <p>Aunt's Namesday is solved as a bipartite graph check using an explicit DFS stack. The two colors are the two tables.</p>
      <p>${seatingText}</p>
    </section>`;
}

function buildHashSection(hashResults) {
  const highestLoad = Math.max(...hashResults.results.map((row) => row.loadFactor));
  const rowsAtHighestLoad = hashResults.results.filter((row) => row.loadFactor === highestLoad);
  const fastestInsert = minBy(rowsAtHighestLoad, (row) => row.insertUsPerOp);
  const fastestSearch = minBy(rowsAtHighestLoad, (row) => row.searchUsPerOp);
  const tableRows = rowsAtHighestLoad.map((row) => [
    row.table,
    row.loadFactor,
    row.insertUsPerOp.toFixed(3),
    row.searchUsPerOp.toFixed(3),
    row.found
  ]);

  return `
    <section>
      <h2>Part 2: Full House</h2>
      <p>The benchmark compares separate chaining, linear probing, and double hashing as the load factor increases. Insert and search times are reported as microseconds per operation.</p>
      <p>At load factor ${highestLoad}, fastest insert is <strong>${escapeHtml(fastestInsert.table)}</strong> and fastest search is <strong>${escapeHtml(fastestSearch.table)}</strong>.</p>
      ${chart("hash_insert_vs_load.svg", "Hash-table insertion time against load factor.")}
      ${chart("hash_search_vs_load.svg", "Hash-table search time against load factor.")}
      ${table(["Table", "Load factor", "Insert us/op", "Search us/op", "Found"], tableRows)}
    </section>`;
}

function buildHtml({ spellResults, graphResults, hashResults }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Algorithms Assignment II Report</title>
  <style>
    body {
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: Arial, sans-serif;
      line-height: 1.5;
    }
    main {
      width: min(1080px, calc(100% - 48px));
      margin: 0 auto;
      padding: 40px 0 64px;
    }
    header, section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 28px;
      margin-bottom: 24px;
    }
    h1, h2, h3 {
      margin: 0 0 14px;
      line-height: 1.2;
    }
    h1 { font-size: 34px; }
    h2 { font-size: 24px; }
    h3 { font-size: 18px; margin-top: 22px; }
    code {
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #e2e8f0;
    }
    figure {
      margin: 22px 0;
    }
    img {
      width: 100%;
      height: auto;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
    }
    figcaption {
      color: #475569;
      font-size: 13px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Algorithms Assignment II</h1>
      <p>Generated at ${escapeHtml(new Date().toISOString())}. This report is produced by <code>node run.js</code> and is backed by JSON benchmark outputs in <code>output/</code>.</p>
    </header>
    ${buildDictionarySection(spellResults)}
    ${buildGraphSection(graphResults)}
    ${buildHashSection(hashResults)}
  </main>
</body>
</html>`;
}

function buildMarkdown({ spellResults, graphResults, hashResults }) {
  const largestSize = Math.max(...spellResults.lookupResults.map((row) => row.requestedChars));
  const largestLookupRows = spellResults.lookupResults.filter((row) => row.requestedChars === largestSize);
  const fastestLookup = minBy(largestLookupRows, (row) => row.lookupMedianMs);
  const highestLoad = Math.max(...hashResults.results.map((row) => row.loadFactor));
  const rowsAtHighestLoad = hashResults.results.filter((row) => row.loadFactor === highestLoad);
  const fastestSearch = minBy(rowsAtHighestLoad, (row) => row.searchUsPerOp);

  return `# Algorithms Assignment II Report

Generated at ${new Date().toISOString()}.

## Dictionary Races

Dictionary size: ${spellResults.dictionarySize}

Fastest lookup on the largest text: ${fastestLookup.dictionary} (${fastestLookup.lookupMedianMs.toFixed(3)} ms).

Charts:

- output/charts/spell_lookup_rt.svg
- output/charts/dictionary_build_time.svg
- output/charts/dictionary_memory.svg

## Triwizard Tournament

Winner: ${graphResults.triwizard.winner ? graphResults.triwizard.winner.name : graphResults.triwizard.winners.map((w) => w.name).join(", ")}

## Aunt's Namesday

${graphResults.namesday.possible ? `Table 1: ${graphResults.namesday.tables[0].join(", ")}
Table 2: ${graphResults.namesday.tables[1].join(", ")}` : `No valid seating: ${graphResults.namesday.conflict.join(" - ")}`}

## Full House

At load factor ${highestLoad}, fastest search is ${fastestSearch.table} (${fastestSearch.searchUsPerOp.toFixed(3)} us/op).

Charts:

- output/charts/hash_insert_vs_load.svg
- output/charts/hash_search_vs_load.svg
`;
}

async function generateReport(inputs = {}) {
  const spellResults = inputs.spellResults ?? loadJson("spell_results.json");
  const graphResults = inputs.graphResults ?? loadJson("graph_task_results.json");
  const hashResults = inputs.hashResults ?? loadJson("hash_table_results.json");

  fs.mkdirSync(path.dirname(REPORT_HTML_PATH), { recursive: true });
  fs.writeFileSync(REPORT_HTML_PATH, buildHtml({ spellResults, graphResults, hashResults }));
  fs.writeFileSync(REPORT_MD_PATH, buildMarkdown({ spellResults, graphResults, hashResults }));

  return {
    html: REPORT_HTML_PATH,
    markdown: REPORT_MD_PATH
  };
}

if (require.main === module) {
  generateReport().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  REPORT_HTML_PATH,
  REPORT_MD_PATH,
  buildHtml,
  buildMarkdown,
  generateReport
};
