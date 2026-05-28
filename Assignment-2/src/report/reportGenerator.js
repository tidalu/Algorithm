"use strict";

const fs = require("fs");
const path = require("path");

const { assignmentRoot, bytesToHuman } = require("../utils/text");

const REPORT_PDF_PATH = assignmentRoot("output", "report.pdf");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadJson(fileName) {
  return JSON.parse(fs.readFileSync(assignmentRoot("output", fileName), "utf8"));
}

function ensurePuppeteer() {
  try {
    return require("puppeteer");
  } catch (error) {
    throw new Error("puppeteer is not installed. Run npm install before generating the PDF report.");
  }
}

function minBy(rows, selector) {
  return rows.reduce((best, row) => (selector(row) < selector(best) ? row : best), rows[0]);
}

function tableRows(rows, cells) {
  return rows
    .map((row) => `<tr>${cells.map((cell) => `<td>${cell(row)}</td>`).join("")}</tr>`)
    .join("");
}

function chart(fileName, caption, figNum) {
  const chartPath = assignmentRoot("output", "charts", fileName);
  const src = fs.existsSync(chartPath)
    ? `data:image/png;base64,${fs.readFileSync(chartPath).toString("base64")}`
    : "";

  return `
    <figure>
      ${src
        ? `<img class="chart" src="${src}" alt="${escapeHtml(caption)}">`
        : `<p class="rfc-p">   [Chart not available: ${escapeHtml(fileName)}]</p>`}
      <p class="rfc-p">   Figure ${figNum}.  ${escapeHtml(caption)}</p>
    </figure>`;
}

// ── TOC ──────────────────────────────────────────────────────────────────────
function tocHtml() {
  const entries = [
    ["1.", "Introduction", "3"],
    ["2.", "Part 1A and Part 3 -- Dictionary Races", "3"],
    ["  2.1.", "Build Time and Memory", "3"],
    ["  2.2.", "Lookup Performance", "4"],
    ["3.", "Part 1B and 1C -- Graph Tasks", "5"],
    ["  3.1.", "Triwizard Tournament", "5"],
    ["  3.2.", "Aunt's Namesday Seating", "5"],
    ["4.", "Part 2 -- Full House (Hash Tables)", "6"],
    ["5.", "Conclusions", "7"],
    ["6.", "References", "7"],
  ];

  return entries.map(([num, title, pg]) => {
    const left = `${num.padEnd(8)}${title}`;
    const dots = ".".repeat(Math.max(4, 65 - left.length));
    return `<span class="toc-line">${escapeHtml(left)}${dots}${pg}</span>`;
  }).join("\n");
}

// ── References ────────────────────────────────────────────────────────────────
function referencesHtml() {
  const refs = [
    {
      tag: "[CLRS]",
      text: "Cormen, T. H., Leiserson, C. E., Rivest, R. L., and Stein, C.\n" +
            "         Introduction to Algorithms, 4th ed.  MIT Press, 2022.\n" +
            "         (Hash tables -- Chapter 11; Graph BFS/DFS -- Chapter 22)"
    },
    {
      tag: "[SED]",
      text: "Sedgewick, R. and Wayne, K.\n" +
            "         Algorithms, 4th ed.  Addison-Wesley, 2011.\n" +
            "         (Tries and symbol tables -- Part 5)"
    },
    {
      tag: "[KNU]",
      text: "Knuth, D. E.\n" +
            "         The Art of Computer Programming, Vol. 3: Sorting and Searching,\n" +
            "         2nd ed.  Addison-Wesley, 1998.\n" +
            "         (Hash functions and collision resolution -- Section 6.4)"
    },
    {
      tag: "[AI]",
      text: "AI & Web Tools.\n" +
            "         Development was assisted by AI tools (Claude by Anthropic,\n" +
            "         ChatGPT by OpenAI, GitHub Copilot by GitHub/Microsoft) and\n" +
            "         web resources (Google Search, Google Scholar).\n" +
            "         All implementations and analysis are the author's own."
    }
  ];

  return refs.map((ref) => `
    <div class="ref-block">
      <p class="rfc-p"><span class="label">${escapeHtml(ref.tag)}</span>  ${escapeHtml(ref.text)}</p>
    </div>
  `).join("");
}

// ── Section builders ──────────────────────────────────────────────────────────
function buildDictionarySection(spellResults) {
  const largestSize = Math.max(...spellResults.lookupResults.map((row) => row.requestedChars));
  const largestLookupRows = spellResults.lookupResults.filter((row) => row.requestedChars === largestSize);
  const fastestBuild   = minBy(spellResults.buildResults,  (row) => row.buildMedianMs);
  const fastestLookup  = minBy(largestLookupRows,          (row) => row.lookupMedianMs);
  const smallestMemory = minBy(spellResults.buildResults,  (row) => row.memoryBytes);

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
<!-- ════════════════════════════════════════════════════════
     PAGE 2 — DICTIONARY RACES
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Algorithms Assignment II</span>
    <span>Informational</span>
    <span>${new Date().getFullYear()}</span>
  </div>

  <h2 class="rfc-h2">2.  Part 1A and Part 3 -- Dictionary Races</h2>
  <p class="rfc-p">
   The benchmark loads ${escapeHtml(String(spellResults.dictionarySize))} normalised words from
   <code>english_words.txt</code>.  The default limit keeps the naive linear list
   measurable while still exercising a large dictionary.  Increase
   <code>DICTIONARY_LIMIT</code> to run a heavier experiment.

   Fastest build:    <strong>${escapeHtml(fastestBuild.dictionary)}</strong>
   Fastest lookup:   <strong>${escapeHtml(fastestLookup.dictionary)}</strong>  (largest text)
   Smallest memory:  <strong>${escapeHtml(smallestMemory.dictionary)}</strong>
  </p>

  ${chart("spell_lookup_rt.png", "Median spell-checking lookup time against text length.", 1)}
  ${chart("dictionary_build_time.png", "Dictionary construction time.", 2)}
  ${chart("dictionary_memory.png", "Approximate memory use for each dictionary structure.", 3)}

  <h2 class="rfc-h2">2.1.  Build Time and Memory</h2>
  <table>
    <thead>
      <tr><th>Dictionary</th><th>Build ms</th><th>Estimated Memory</th></tr>
    </thead>
    <tbody>
      ${tableRows(buildRows, [
        (row) => escapeHtml(row[0]),
        (row) => escapeHtml(row[1]),
        (row) => escapeHtml(row[2])
      ])}
    </tbody>
  </table>

  <h2 class="rfc-h2">2.2.  Largest Text Lookup</h2>
  <table>
    <thead>
      <tr><th>Dictionary</th><th>Characters</th><th>Tokens</th><th>Lookup ms</th><th>Misspelled</th></tr>
    </thead>
    <tbody>
      ${tableRows(lookupRows, [
        (row) => escapeHtml(row[0]),
        (row) => escapeHtml(String(row[1])),
        (row) => escapeHtml(String(row[2])),
        (row) => escapeHtml(row[3]),
        (row) => escapeHtml(String(row[4]))
      ])}
    </tbody>
  </table>

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</span>
    <span>[Page 2]</span>
  </div>
</div>`;
}

function buildGraphSection(graphResults) {
  const triwizardRows = graphResults.triwizard.competitors.map((wizard) => [
    wizard.name,
    wizard.distance,
    wizard.speed,
    wizard.minutes === null || wizard.minutes === Infinity ? "unreachable" : wizard.minutes.toFixed(3)
  ]);

  const namesday    = graphResults.namesday;
  const seatingText = namesday.possible
    ? `Table 1: ${namesday.tables[0].join(", ")}\n   Table 2: ${namesday.tables[1].join(", ")}`
    : `No valid seating.\n   Conflict: ${namesday.conflict.join(" - ")}`;

  const winner = graphResults.triwizard.winner
    ? graphResults.triwizard.winner.name
    : graphResults.triwizard.winners.map((w) => w.name).join(", ");

  return `
<!-- ════════════════════════════════════════════════════════
     PAGE 3 — GRAPH TASKS
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Algorithms Assignment II</span>
    <span>Informational</span>
    <span>${new Date().getFullYear()}</span>
  </div>

  <h2 class="rfc-h2">3.  Part 1B and 1C -- Graph Tasks</h2>

  <h2 class="rfc-h2">3.1.  Triwizard Tournament</h2>
  <p class="rfc-p">
   A single BFS from the exit builds the full shortest-path distance map.
   Each wizard's travel time is then computed as:

      minutes = shortest_corridor_distance / speed

   The wizard with the lowest minutes wins.
  </p>

  <table>
    <thead>
      <tr><th>Wizard</th><th>Shortest Distance</th><th>Speed</th><th>Minutes</th></tr>
    </thead>
    <tbody>
      ${tableRows(triwizardRows, [
        (row) => escapeHtml(row[0]),
        (row) => escapeHtml(String(row[1])),
        (row) => escapeHtml(String(row[2])),
        (row) => escapeHtml(row[3])
      ])}
    </tbody>
  </table>

  <p class="rfc-p">   Winner: <strong>${escapeHtml(winner)}</strong>.</p>

  <h2 class="rfc-h2">3.2.  Aunt's Namesday Seating</h2>
  <p class="rfc-p">
   The problem is modelled as a bipartite graph check using an explicit
   DFS stack.  Guests are nodes; conflicts are edges.  If the graph is
   2-colourable the two colour classes are the two tables.  If an odd
   cycle is found, no valid seating exists and the conflicting pair is
   reported.
  </p>
  <p class="rfc-p">   ${escapeHtml(seatingText)}</p>

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</span>
    <span>[Page 3]</span>
  </div>
</div>`;
}

function buildHashSection(hashResults) {
  const highestLoad     = Math.max(...hashResults.results.map((row) => row.loadFactor));
  const rowsAtHighLoad  = hashResults.results.filter((row) => row.loadFactor === highestLoad);
  const fastestInsert   = minBy(rowsAtHighLoad, (row) => row.insertUsPerOp);
  const fastestSearch   = minBy(rowsAtHighLoad, (row) => row.searchUsPerOp);

  return `
<!-- ════════════════════════════════════════════════════════
     PAGE 4 — HASH TABLES
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Algorithms Assignment II</span>
    <span>Informational</span>
    <span>${new Date().getFullYear()}</span>
  </div>

  <h2 class="rfc-h2">4.  Part 2 -- Full House (Hash Tables)</h2>
  <p class="rfc-p">
   Three open-addressing and chaining strategies are compared as the
   load factor climbs.  Insert and search times are reported as
   microseconds per operation (us/op).

      Strategies tested:
         Separate chaining
         Linear probing
         Double hashing

   At load factor ${escapeHtml(String(highestLoad))}, fastest insert is
   <strong>${escapeHtml(fastestInsert.table)}</strong> and fastest search is
   <strong>${escapeHtml(fastestSearch.table)}</strong>.
  </p>

  ${chart("hash_insert_vs_load.png", "Hash-table insertion time against load factor.", 4)}
  ${chart("hash_search_vs_load.png", "Hash-table search time against load factor.", 5)}

  <table>
    <thead>
      <tr>
        <th>Table</th>
        <th>Load Factor</th>
        <th>Insert us/op</th>
        <th>Search us/op</th>
        <th>Found</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows(rowsAtHighLoad, [
        (row) => escapeHtml(row.table),
        (row) => escapeHtml(String(row.loadFactor)),
        (row) => escapeHtml(row.insertUsPerOp.toFixed(3)),
        (row) => escapeHtml(row.searchUsPerOp.toFixed(3)),
        (row) => escapeHtml(String(row.found))
      ])}
    </tbody>
  </table>

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</span>
    <span>[Page 4]</span>
  </div>
</div>`;
}

// ── Full HTML ─────────────────────────────────────────────────────────────────
function buildHtml({ spellResults, graphResults, hashResults }) {
  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Algorithms Assignment II Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Courier Prime", "Courier New", Courier, monospace;
      font-size: 10.8pt;
      color: #000;
      background: #fff;
      line-height: 1.5;
    }

    .page {
      width: 680px;
      margin: 0 auto;
      padding: 22px 0 10px;
      position: relative;
      overflow: visible;
      break-after: auto;
      page-break-after: auto;
    }

    .page:first-of-type { padding-top: 48px; }
    .page:last-child { break-after: auto; page-break-after: auto; }

    /* RFC header / footer — hidden on screen, shown in print if desired */
    .rfc-header, .rfc-footer {
      display: none;
      justify-content: space-between;
      font-size: 9.5pt;
    }
    .rfc-header {
      border-bottom: 1px solid #000;
      padding-bottom: 6px;
      margin-bottom: 24px;
    }
    .rfc-footer {
      border-top: 1px solid #000;
      padding-top: 6px;
      margin-top: 36px;
    }
    .rfc-header span, .rfc-footer span { white-space: nowrap; }

    /* Cover */
    .cover-meta { text-align: center; margin-bottom: 36px; }
    .cover-meta p { font-size: 10pt; line-height: 1.8; }
    .cover-title { text-align: center; margin: 36px 0 24px; }
    .cover-title h1 {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .rfc-rule { border: none; border-top: 1px solid #000; margin: 18px 0; }

    .abstract { margin: 24px 0; }
    .abstract-label {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10pt;
      margin-bottom: 6px;
    }
    .abstract p { margin-left: 3em; font-size: 10pt; line-height: 1.55; }

    .status-memo {
      font-size: 9.5pt;
      line-height: 1.6;
      border: 1px solid #aaa;
      padding: 10px 14px;
      margin-bottom: 24px;
    }
    .status-memo p { margin-bottom: 4px; }

    /* TOC */
    .toc { margin: 8px 0 0; }
    .toc-line { display: block; white-space: pre; font-size: 10pt; line-height: 1.7; }

    /* Headings */
    h2.rfc-h2 {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 28px 0 10px;
      letter-spacing: 0.03em;
    }

    /* Body text */
    .rfc-p {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 10.5pt;
      line-height: 1.6;
      margin-bottom: 10px;
    }

    code { font-family: inherit; font-size: inherit; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px;
      font-size: 9.8pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #555;
      padding: 5px 8px;
      vertical-align: top;
      text-align: left;
    }
    th { font-weight: bold; background: #f0f0f0; }

    /* Charts */
    img.chart {
      display: block;
      width: 100%;
      margin: 12px 0 4px;
      border: 1px solid #888;
      background: #fff;
    }

    figure { margin: 14px 0 18px; break-inside: avoid; page-break-inside: avoid; }

    /* References */
    .ref-block { margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
    .label { font-weight: bold; }

    @media print {
      body { font-size: 10pt; }
      .page {
        width: 680px;
        margin: 0 auto;
        height: auto;
        overflow: visible;
        break-after: auto;
        page-break-after: auto;
        padding: 22px 0 10px;
      }
      .page:first-of-type { padding-top: 48px; }
      img, table, .ref-block { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<!-- ════════════════════════════════════════════════════════
     PAGE 1 — COVER / FRONT MATTER
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>University Assignment</span>
    <span>Algorithms II</span>
    <span>${year}</span>
  </div>

  <div class="cover-meta">
    <p>Author:   Ulugbek Norbutaev</p>
    <p>Date:     ${today}</p>
    <p>Category: Informational</p>
  </div>

  <hr class="rfc-rule">

  <div class="cover-title">
    <h1>Assignment II<br>Data Structures and Algorithms</h1>
  </div>

  <hr class="rfc-rule">

  <div class="status-memo">
    <p><strong>Status of This Document</strong></p>
    <p>This document is an informational submission prepared for university
    coursework.  It describes the design, implementation, and empirical
    evaluation of dictionary structures, graph algorithms, and hash-table
    strategies.</p>
    <p>This document does not specify an Internet Standard.</p>
  </div>

  <div class="abstract">
    <p class="abstract-label">Abstract</p>
    <p>
   This report covers three problem areas from Assignment II.  Part 1A
   and Part 3 benchmark four dictionary structures (linear list, binary
   search tree, hash set, and trie) on build time, memory, and spell-
   checking lookup speed using a corpus of English words.  Parts 1B and
   1C solve graph problems: a Triwizard Tournament shortest-path race
   using BFS, and a bipartite seating arrangement using DFS colouring.
   Part 2 compares three hash-table collision strategies (separate
   chaining, linear probing, and double hashing) across rising load
   factors.  Benchmarks confirm theoretical predictions and show that
   the best structure depends on the operation mix and input size.
    </p>
  </div>

  <hr class="rfc-rule">

  <h2 class="rfc-h2">Table of Contents</h2>
  <div class="toc">
    ${tocHtml()}
  </div>

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 1]</span>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════
     PAGE 1b — INTRODUCTION
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Algorithms Assignment II</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">1.  Introduction</h2>
  <p class="rfc-p">
   This project implements and benchmarks core data structures and graph
   algorithms in JavaScript (Node.js).

   Dictionary races (Part 1A / Part 3) measure how four structures
   perform on the task of spell-checking natural-language text.  The
   corpus is the word list from <code>english_words.txt</code>.  Text
   samples of varying length are tokenised and each token is looked up
   in the dictionary.

   Graph tasks (Parts 1B and 1C) work on a 2-D maze for the Triwizard
   problem and an adjacency list for the seating problem.

   Hash-table benchmarks (Part 2) insert a fixed number of keys at
   controlled load factors and measure insert and search cost per
   operation.

   All benchmarks take the median of three measured runs after one
   warm-up call to reduce sensitivity to garbage collection and OS
   scheduling jitter.

   Development was assisted by AI tools (Claude by Anthropic, ChatGPT
   by OpenAI, GitHub Copilot by GitHub/Microsoft) and web resources
   (Google Search, Google Scholar) [AI].  All implementations and
   analysis are the author's own.
  </p>

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 2]</span>
  </div>
</div>

${buildDictionarySection(spellResults)}
${buildGraphSection(graphResults)}
${buildHashSection(hashResults)}

<!-- ════════════════════════════════════════════════════════
     PAGE 5 — CONCLUSIONS + REFERENCES
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Algorithms Assignment II</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">5.  Conclusions</h2>
  <p class="rfc-p">
   Dictionary structures trade build cost against lookup speed.  The
   naive linear list is trivial to build but O(n) per lookup; the hash
   set pays a small build cost for O(1) average lookup; the BST offers
   O(log n) and ordered traversal; the trie is fastest for prefix-heavy
   workloads and has predictable worst-case behaviour.

   BFS from the exit produces the exact shortest-path map for the
   Triwizard maze in O(V + E) time.  The DFS bipartite check for the
   seating problem is likewise linear and handles disconnected guest
   graphs correctly.

   Among hash-table strategies, separate chaining degrades gracefully
   at high load factors while open-addressing schemes (linear probing,
   double hashing) are cache-friendlier at low load.  Double hashing
   avoids primary clustering but requires a careful second hash to
   guarantee full coverage.

   No single structure or strategy dominates every scenario.  The
   right choice depends on the expected operation mix, the load factor,
   and whether ordered traversal or prefix queries are required.
  </p>

  <h2 class="rfc-h2">6.  References</h2>
  <p class="rfc-p">
   The following sources were consulted during the design, implementation,
   and analysis of this project.
  </p>

  ${referencesHtml()}

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 5]</span>
  </div>
</div>

</body>
</html>`;
}

// ── PDF generation ────────────────────────────────────────────────────────────
async function generateReport(inputs = {}) {
  const spellResults  = inputs.spellResults  ?? loadJson("spell_results.json");
  const graphResults  = inputs.graphResults  ?? loadJson("graph_task_results.json");
  const hashResults   = inputs.hashResults   ?? loadJson("hash_table_results.json");
  const html          = buildHtml({ spellResults, graphResults, hashResults });
  const puppeteer     = ensurePuppeteer();

  fs.mkdirSync(path.dirname(REPORT_PDF_PATH), { recursive: true });
  const browser = await puppeteer.launch({ headless: "new" });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 760, height: 1000, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");

    const pdfSize = await page.evaluate(() => {
      const h = document.documentElement;
      const b = document.body;
      return {
        width:  Math.ceil(Math.max(h.scrollWidth,  b.scrollWidth)),
        height: Math.ceil(Math.max(h.scrollHeight, b.scrollHeight))
      };
    });

    await page.pdf({
      path: REPORT_PDF_PATH,
      width:  `${pdfSize.width}px`,
      height: `${pdfSize.height + 50}px`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
  } finally {
    await browser.close();
  }

  return { pdf: REPORT_PDF_PATH };
}

if (require.main === module) {
  generateReport().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { REPORT_PDF_PATH, buildHtml, generateReport };
