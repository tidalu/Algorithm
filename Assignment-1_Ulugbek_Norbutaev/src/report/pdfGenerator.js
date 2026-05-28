"use strict";

const fs = require("fs");
const path = require("path");

const { generateRTvsLengthChart, generateWackyChart, DEFAULT_CHART_DIR } = require("./chartGenerator");

const OUTPUT_DIR = path.join(__dirname, "..", "..", "output");
const REPORT_PATH = path.join(OUTPUT_DIR, "report.pdf");
const BENCHMARK_PATH = path.join(OUTPUT_DIR, "benchmark_results.json");
const WACKY_PATH = path.join(OUTPUT_DIR, "wacky_results.json");
const WILDCARD_PATH = path.join(OUTPUT_DIR, "wildcard_results.json");

function ensurePuppeteer() {
  try {
    return require("puppeteer");
  } catch (error) {
    throw new Error("puppeteer is not installed. Run npm install before generating the PDF report.");
  }
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function imageToDataUri(filePath) {
  if (!fs.existsSync(filePath)) return "";
  const data = fs.readFileSync(filePath).toString("base64");
  return `data:image/png;base64,${data}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMs(value) {
  return Number.isFinite(value) ? `${value.toFixed(3)} ms` : "n/a";
}

function benchmarkAnalysis(benchmarkResults) {
  if (!benchmarkResults?.results?.length) {
    return "Benchmark data was not available when this report was generated.";
  }

  const byPattern = ["small", "large"].map((patternType) => {
    const rows = benchmarkResults.results.filter((result) => result.patternType === patternType);
    const totals = new Map();
    for (const row of rows) {
      totals.set(row.algorithm, (totals.get(row.algorithm) ?? 0) + row.medianMs);
    }

    const sorted = Array.from(totals, ([algorithm, total]) => ({ algorithm, total }))
      .sort((a, b) => a.total - b.total);
    return `${patternType} pattern: ${sorted[0].algorithm} had the lowest total median ` +
           `time, while ${sorted[sorted.length - 1].algorithm} had the highest.`;
  });

  return `${byPattern.join("  ")} Across increasing text sizes, the linear-time ` +
    `methods grow close to linearly, while methods that compare many characters per ` +
    `alignment become visibly more sensitive to pattern length and input structure.`;
}

function tableRows(rows, cells) {
  return rows.map((row) => `<tr>${cells.map((cell) => `<td>${cell(row)}</td>`).join("")}</tr>`).join("");
}

function algorithmDescriptionsHtml() {
  const descriptions = [
    {
      name: "Brute Force",
      category: "Exact matching baseline",
      core: "Tries every possible alignment of the pattern in the text and compares characters from left to right.  It does no preprocessing and is easy to reason about.",
      time: "O(1) preprocessing.  O(n*m) worst case, often better on random text.",
      space: "O(1) besides the output array.",
      best: "Most windows fail on the first character.",
      worst: "Text and pattern share long repeated prefixes."
    },
    {
      name: "Sunday",
      category: "Heuristic bad-character shift method",
      core: "After comparing a window, looks at the character immediately after that window.  Shifts the pattern to align that character with its rightmost occurrence in the pattern.  If absent, skips the whole window.",
      time: "O(m + alphabet) preprocessing.  Average often sublinear; O(n*m) worst case.",
      space: "O(alphabet) for the shift table.",
      best: "After-window characters absent from pattern yield m+1 jumps.",
      worst: "Highly repetitive inputs cause tiny shifts and many comparisons."
    },
    {
      name: "KMP (Knuth-Morris-Pratt)",
      category: "Exact linear-time prefix-function algorithm",
      core: "Builds a prefix/failure function f[i] = length of the longest proper prefix of P[0..i] that is also a suffix.  On mismatch after j matches, resumes at f[j-1] instead of restarting.",
      time: "O(m) preprocessing.  O(n) search.  O(n+m) total.",
      space: "O(m) for the prefix table.",
      best: "Patterns with repeated structure where naive search re-checks characters.",
      worst: "Still linear; fallback transitions add a constant factor."
    },
    {
      name: "FSM (Finite State Machine)",
      category: "Deterministic finite automaton exact matcher",
      core: "Builds states 0..m where state q means q pattern characters have been matched.  Each text character follows one transition.  State m is accepting.",
      time: "O(m * alphabet) preprocessing.  O(n) search.",
      space: "O(m * alphabet), which can be large for wide alphabets.",
      best: "Repeated searches with the same pattern where preprocessing is amortized.",
      worst: "Large alphabets make the transition table expensive to build and store."
    },
    {
      name: "Rabin-Karp",
      category: "Rolling-hash exact matcher",
      core: "Hashes the pattern and each text window.  A rolling update slides the hash one character right in O(1).  Hash matches are verified by direct comparison to guard against collisions.",
      time: "O(n+m) average.  O(n*m) worst case if every window requires verification.",
      space: "O(1) besides output.",
      best: "Few hash matches and therefore few full verifications.",
      worst: "Many true matches or collisions force repeated character-by-character checks."
    },
    {
      name: "Gusfield Z-Algorithm",
      category: "Exact linear-time Z-array method",
      core: "Builds S = P + separator + T and computes, for every position, how many characters match the prefix of S.  A Z value of at least m after the separator indicates a full match.",
      time: "O(n+m) to build and scan the Z-array.",
      space: "O(n+m) for the combined string and Z-array.",
      best: "One-shot exact search or prefix-analysis tasks.",
      worst: "Still linear, but always allocates and scans the full combined string."
    }
  ];

  return descriptions.map((item, idx) => `
    <div class="algo-block">
      <p class="algo-name">2.${idx + 1}.  ${item.name}</p>
      <p class="algo-cat">   Category: ${item.category}</p>
      <p class="algo-field"><span class="label">   Core idea:</span> ${item.core}</p>
      <p class="algo-field"><span class="label">   Time:     </span> ${item.time}</p>
      <p class="algo-field"><span class="label">   Space:    </span> ${item.space}</p>
      <p class="algo-field"><span class="label">   Best:     </span> ${item.best}</p>
      <p class="algo-field"><span class="label">   Worst:    </span> ${item.worst}</p>
    </div>
  `).join("");
}

function wackyHtml(wackyResults) {
  if (!wackyResults?.races?.length) {
    return "<p>Wacky race results were not available.</p>";
  }

  return wackyResults.races.map((race, idx) => `
    <div class="race-block">
      <p class="race-title">4.${idx + 1}.  ${escapeHtml(race.title)}</p>
      <pre class="rfc-pre">   T[:100] : ${escapeHtml(race.textPrefix100)}
   Pattern : ${escapeHtml(race.pattern)}</pre>
      <table>
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Median Time</th>
            <th>Matches</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows(race.measurements, [
            (row) => escapeHtml(row.algorithm),
            (row) => formatMs(row.medianMs),
            (row) => String(row.matchCount)
          ])}
        </tbody>
      </table>
      <p class="rfc-p">   Ratio: ${race.ratio.toFixed(2)}x.  ${escapeHtml(race.explanation)}</p>
    </div>
  `).join("");
}

function wildcardHtml(wildcardResults) {
  if (!wildcardResults?.tests?.length) {
    return "<p>Wildcard test results were not available.</p>";
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Case</th>
          <th>Pattern</th>
          <th>Expected</th>
          <th>Brute Force</th>
          <th>Sunday</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows(wildcardResults.tests, [
          (row) => escapeHtml(row.name),
          (row) => `<code>${escapeHtml(row.pattern)}</code>`,
          (row) => String(row.expected),
          (row) => String(row.bruteForceWildcard),
          (row) => String(row.sundayWildcard),
          (row) => row.passed ? "PASS" : "FAIL"
        ])}
      </tbody>
    </table>
    <p class="rfc-p">   Large-text timing used ${wildcardResults.largeTiming?.textLength ?? "n/a"} characters
   with pattern <code>${escapeHtml(wildcardResults.largeTiming?.pattern ?? "")}</code>.
   Brute Force: ${formatMs(wildcardResults.largeTiming?.bruteForceWildcard?.ms)}.
   Sunday: ${formatMs(wildcardResults.largeTiming?.sundayWildcard?.ms)}.</p>
  `;
}

function tocHtml() {
  const entries = [
    ["1.", "Introduction", "3"],
    ["2.", "Algorithm Descriptions", "3"],
    ["  2.1.", "Brute Force", "3"],
    ["  2.2.", "Sunday", "3"],
    ["  2.3.", "KMP", "4"],
    ["  2.4.", "FSM", "4"],
    ["  2.5.", "Rabin-Karp", "4"],
    ["  2.6.", "Gusfield Z-Algorithm", "4"],
    ["3.", "Part 1A -- Benchmark Results", "5"],
    ["4.", "Part 1B -- Wacky Races", "6"],
    ["5.", "Part 2 -- Wildcard Matching", "7"],
    ["6.", "Part 3 -- 2D Rabin-Karp", "8"],
    ["7.", "Conclusions", "8"],
    ["8.", "References", "9"],
  ];

  const lines = entries.map(([num, title, pg]) => {
    const left = `${num.padEnd(8)}${title}`;
    const dots = ".".repeat(Math.max(4, 65 - left.length));
    return `<span class="toc-line">${escapeHtml(left)}${dots}${pg}</span>`;
  });

  return lines.join("\n");
}

function referencesHtml() {
  const refs = [
    {
      tag: "[CLRS]",
      text: "Cormen, T. H., Leiserson, C. E., Rivest, R. L., and Stein, C.\n" +
            "         Introduction to Algorithms, 4th ed.  MIT Press, 2022.\n" +
            "         (KMP, Rabin-Karp, FSM string matcher -- Chapter 32)"
    },
    {
      tag: "[GUS]",
      text: "Gusfield, D.\n" +
            "         Algorithms on Strings, Trees, and Sequences.\n" +
            "         Cambridge University Press, 1997.\n" +
            "         (Z-Algorithm -- Chapter 1)"
    },
    {
      tag: "[CL]",
      text: "Crochemore, M. and Lecroq, T.\n" +
            "         Handbook of Exact String Matching Algorithms.\n" +
            "         King's College London Publications, 2004.\n" +
            "         (Brute Force, Sunday -- Chapters 1 and 8)"
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

function buildHtml({ benchmarkResults, wackyResults, wildcardResults, chartUris }) {
  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const year = new Date().getFullYear();

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pattern Matching Algorithms</title>
  <style>
    /* ── RFC base typography ─────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Courier Prime", "Courier New", Courier, monospace;
      font-size: 10.8pt;
      color: #000;
      background: #fff;
      line-height: 1.5;
    }

    /* ── Page shell ──────────────────────────────────────── */
    .page {
      width: 680px;
      margin: 0 auto;
      padding: 22px 0 10px;
      position: relative;
      height: auto;
      min-height: auto;
      overflow: visible;
      break-after: auto;
      page-break-after: auto;
    }

    .page:first-of-type {
      padding-top: 48px;
    }

    .page:last-child {
      break-after: auto;
      page-break-after: auto;
    }


    /* ── RFC page header ─────────────────────────────────── */
    .rfc-header {
      display: none;
      justify-content: space-between;
      border-bottom: 1px solid #000;
      padding-bottom: 6px;
      margin-bottom: 24px;
      font-size: 9.5pt;
    }
    .rfc-header span { white-space: nowrap; }

    /* ── RFC page footer ─────────────────────────────────── */
    .rfc-footer {
      display: none;
      justify-content: space-between;
      border-top: 1px solid #000;
      padding-top: 6px;
      margin-top: 36px;
      font-size: 9pt;
    }
    .rfc-footer span { white-space: nowrap; }

    /* ── Cover / first page ──────────────────────────────── */
    .cover-meta {
      text-align: center;
      margin-bottom: 36px;
    }
    .cover-meta p { font-size: 10pt; line-height: 1.8; }

    .cover-title {
      text-align: center;
      margin: 36px 0 24px;
    }
    .cover-title h1 {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .rfc-rule {
      border: none;
      border-top: 1px solid #000;
      margin: 18px 0;
    }

    /* ── Abstract box ────────────────────────────────────── */
    .abstract {
      margin: 24px 0;
    }
    .abstract-label {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10pt;
      margin-bottom: 6px;
    }
    .abstract p {
      margin-left: 3em;
      font-size: 10pt;
      line-height: 1.55;
    }

    /* ── Status of memo ──────────────────────────────────── */
    .status-memo {
      font-size: 9.5pt;
      line-height: 1.6;
      border: 1px solid #aaa;
      padding: 10px 14px;
      margin-bottom: 24px;
    }
    .status-memo p { margin-bottom: 4px; }

    /* ── TOC ─────────────────────────────────────────────── */
    .toc { margin: 8px 0 0 0; }
    .toc-line {
      display: block;
      white-space: pre;
      font-size: 10pt;
      line-height: 1.7;
    }

    /* ── Section headings ────────────────────────────────── */
    h2.rfc-h2 {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 28px 0 10px;
      letter-spacing: 0.03em;
    }

    /* ── Body text ───────────────────────────────────────── */
    .rfc-p {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 10.5pt;
      line-height: 1.6;
      margin-bottom: 10px;
    }

    /* ── Algorithm blocks ────────────────────────────────── */
    .algo-block {
      margin-bottom: 20px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .algo-name {
      font-weight: bold;
      font-size: 10.5pt;
      margin-bottom: 2px;
    }
    .algo-cat {
      font-size: 10pt;
      font-style: italic;
      margin-bottom: 4px;
    }
    .algo-field {
      font-size: 10pt;
      line-height: 1.55;
      white-space: pre-wrap;
      margin-bottom: 2px;
    }
    .label { font-weight: bold; }

    /* ── Race blocks ─────────────────────────────────────── */
    .race-block {
      margin-bottom: 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .race-title {
      font-weight: bold;
      font-size: 10.5pt;
      margin-bottom: 6px;
    }

    /* ── Pre / code ──────────────────────────────────────── */
    .rfc-pre {
      white-space: pre-wrap;
      word-break: break-all;
      font-size: 9.5pt;
      margin: 6px 0 10px;
      line-height: 1.5;
    }
    code {
      font-family: inherit;
      font-size: inherit;
    }

    /* ── Tables ──────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px;
      font-size: 9.8pt;
    }
    th, td {
      border: 1px solid #555;
      padding: 5px 8px;
      vertical-align: top;
      text-align: left;
    }
    th {
      font-weight: bold;
      background: #f0f0f0;
    }

    /* ── Charts ──────────────────────────────────────────── */
    img.chart {
      display: block;
      width: 100%;
      margin: 12px 0 20px;
      border: 1px solid #888;
    }

    /* ── References ──────────────────────────────────────── */
    .ref-block {
      margin-bottom: 16px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* ── Print tweaks ────────────────────────────────────── */
    @media print {
      body {
        font-size: 10pt;
      }

      .page {
        width: 680px;
        margin: 0 auto;
        height: auto;
        min-height: auto;
        overflow: visible;
        break-after: auto;
        page-break-after: auto;
        padding: 22px 0 10px;
      }

      .page:first-of-type {
        padding-top: 48px;
      }

      .page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      img,
      table,
      .algo-block,
      .race-block,
      .ref-block {
        break-inside: avoid;
        page-break-inside: avoid;
      }
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
    <span>Pattern Matching</span>
    <span>${year}</span>
  </div>

  <div class="cover-meta">
    <p>Author:   Ulugbek Norbutaev</p>
    <p>Id:       405293</p>
    <p>Date:     ${today}</p>
    <p>Category: Informational</p>
  </div>

  <hr class="rfc-rule">

  <div class="cover-title">
    <h1>Assignment I<br>Pattern Matching Algorithms</h1>
  </div>

  <hr class="rfc-rule">

  <div class="status-memo">
    <p><strong>Status of This Document</strong></p>
    <p>This document is an informational submission prepared for university
    coursework.  It describes the design, implementation, and empirical
    evaluation of six exact pattern matching algorithms, two wildcard
    matchers, and a two-dimensional Rabin-Karp matcher.</p>
    <p>This document does not specify an Internet Standard.</p>
  </div>

  <div class="abstract">
    <p class="abstract-label">Abstract</p>
    <p>
   Pattern matching locates all occurrences of a pattern P of length m
   inside a text T of length n.  This document describes and evaluates
   six algorithms: Brute Force, Sunday, Knuth-Morris-Pratt (KMP), a
   Finite State Machine (FSM) matcher, Rabin-Karp, and Gusfield's
   Z-Algorithm.  Wildcard extensions supporting "?" and "*" tokens are
   implemented for Brute Force and Sunday.  A two-dimensional Rabin-Karp
   matcher is provided for Part 3.  Empirical benchmarks on Moby Dick
   (Project Gutenberg) with text sizes from 10,000 to 1,000,000
   characters confirm theoretical complexity predictions and demonstrate
   that no single algorithm dominates all input shapes.
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
     PAGE 2 — INTRODUCTION + ALGORITHM DESCRIPTIONS
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Pattern Matching Algorithms</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">1.  Introduction</h2>
  <p class="rfc-p">
   Pattern matching asks where a pattern P of length m appears inside a
   text T of length n.  It is a fundamental operation in text editors,
   search engines, plagiarism detectors, compilers, antivirus scanners,
   and DNA sequence analysis tools.

   This project implements six exact matchers, two wildcard matchers,
   and one two-dimensional hash-based matcher.  All implementations are
   in JavaScript (Node.js).  Benchmarks run against the full text of
   Herman Melville's "Moby Dick" obtained from Project Gutenberg
   (https://www.gutenberg.org/files/2701/2701-0.txt) and cached locally
   to ensure reproducibility.

   All exact one-dimensional matchers share the signature:

      algorithm(text, pattern) -&gt; Array of zero-based match indices

   Wildcard matchers return a Boolean.  The 2D matcher returns an object
   { found, position }.

   Development was assisted by AI tools (Claude by Anthropic, ChatGPT
   by OpenAI, GitHub Copilot by GitHub/Microsoft) and web resources
   (Google Search, Google Scholar) [AI].  All implementations and
   analysis are the author's own.
  </p>

  <h2 class="rfc-h2">2.  Algorithm Descriptions</h2>
  ${algorithmDescriptionsHtml()}

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 2]</span>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════
     PAGE 3 — PART 1A BENCHMARK RESULTS
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Pattern Matching Algorithms</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">3.  Part 1A -- Benchmark Results (RT vs Text Length)</h2>
  <p class="rfc-p">
   Text slices of approximately 10,000 / 50,000 / 100,000 / 200,000 /
   500,000 / 1,000,000 characters are taken from the beginning of the
   cached Moby Dick text.  Two patterns are tested:

      Small pattern : "the White Whale"  (15 characters, first exact
                       occurrence in the book)
      Large pattern : 300-character substring starting at position 20,000

   Each (algorithm, size, pattern) triple is measured three times after
   one warm-up call.  The median of the three measured runs is recorded
   to reduce sensitivity to garbage-collection pauses and OS scheduling.
  </p>

  ${chartUris.small ? `<img class="chart" src="${chartUris.small}" alt="Running time vs text length — small pattern">` : "<p class=\"rfc-p\">   [Chart not available: rt_small_pattern.png]</p>"}

  <p class="rfc-p">
   Figure 1.  Running time vs text length for the small pattern.
  </p>

  ${chartUris.large ? `<img class="chart" src="${chartUris.large}" alt="Running time vs text length — large pattern">` : "<p class=\"rfc-p\">   [Chart not available: rt_large_pattern.png]</p>"}

  <p class="rfc-p">
   Figure 2.  Running time vs text length for the large pattern.
  </p>

  <p class="rfc-p">   ${escapeHtml(benchmarkAnalysis(benchmarkResults))}</p>

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 3]</span>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════
     PAGE 4 — PART 1B WACKY RACES
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Pattern Matching Algorithms</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">4.  Part 1B -- Wacky Races</h2>
  <p class="rfc-p">
   Adversarial inputs are constructed to show that no single algorithm
   wins on all input shapes.  Each race text is at least 100 KB.  Each
   algorithm is warmed up once, then timed for five runs; the median is
   recorded.  A ratio >= 2.0x is required.
  </p>

  ${chartUris.wacky ? `<img class="chart" src="${chartUris.wacky}" alt="Wacky races bar chart">` : "<p class=\"rfc-p\">   [Chart not available: wacky_races.png]</p>"}

  <p class="rfc-p">   Figure 3.  Median execution times for each race.</p>

  ${wackyHtml(wackyResults)}

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 4]</span>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════
     PAGE 5 — PART 2 WILDCARD MATCHING
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Pattern Matching Algorithms</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">5.  Part 2 -- Wildcard Matching</h2>
  <p class="rfc-p">
   Wildcard patterns support three token types:

      ?   Matches exactly one arbitrary character.
      *   Matches zero or more arbitrary characters.
      \\? \\* \\\\   Escaped tokens are treated as literals.

5.1.  Brute Force Wildcard

   The pattern is tokenized into literals, "any_one" tokens (?), and
   "any_many" tokens (*).  A recursive backtracking matcher tries each
   possible expansion of * lazily (zero characters first, then one
   more on backtrack).  The search function wraps the core matcher so
   that the pattern is allowed to match any substring of the text,
   behaving as though implicit * tokens surround the pattern.

5.2.  Sunday Wildcard

   The token stream is split on * tokens, producing fixed segments.
   Each segment is searched left to right with a Sunday-style bad-
   character shift table.  Question marks are handled conservatively:
   any text character is a valid match at a ? position, so the shift
   table must not skip over positions that could satisfy ?.  Segments
   must appear in non-overlapping, strictly increasing order; *
   tokens permit arbitrary text gaps between segments.

5.3.  Correctness Test Results
  </p>

  ${wildcardHtml(wildcardResults)}

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 5]</span>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════
     PAGE 6 — PART 3 + CONCLUSIONS
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Pattern Matching Algorithms</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">6.  Part 3 -- 2D Rabin-Karp</h2>
  <p class="rfc-p">
   Given an M x N picture of arbitrary items and an integer K, the
   function checks whether the top-right K x K block appears anywhere
   else in the picture.

   Signature:
      rabinKarp2D(picture, K)
      -&gt; { found: boolean, position: { row, col } | null }

6.1.  Item Encoding

   Picture items may be of any type.  Before hashing, each unique item
   is mapped to a positive integer code using a Map.  Hashing then
   operates on integer codes.

6.2.  Two-Pass Hashing

   Pass 1 (horizontal): For every row, compute rolling hashes of all
   length-K windows.  Store one hash per (row, col) pair.

   Pass 2 (vertical): For every column-window position col, maintain
   a rolling vertical hash over the K row hashes above.  Roll the
   hash down each row in O(1) by subtracting the departing row hash
   and adding the arriving row hash.

6.3.  Verification

   Hash matches are verified by direct K x K cell comparison.
   Correctness does not depend on hash uniqueness; it depends only on
   the verification step.

6.4.  Hash Arithmetic

   The bitwise mask  &amp; ((1 &lt;&lt; 31) - 1)  is used in place of modulo
   division for speed.  The mask value 2^31 - 1 is a Mersenne prime
   but the operation is a simple bit truncation, not true modular
   arithmetic.  Collisions are possible but rare; each is resolved by
   direct comparison, so the result is always correct.

6.5.  Complexity

      Horizontal pass : O(M * N)
      Vertical pass   : O(M * N)
      Verification    : O(K^2) per hash hit, expected O(1) hits
      Total expected  : O(M * N)
      Space           : O(M * (N - K + 1)) for the row hash table
  </p>

  <h2 class="rfc-h2">7.  Conclusions</h2>
  <p class="rfc-p">
   Brute Force is the correct baseline: zero preprocessing, simple
   reasoning, and often acceptable performance on random text.

   Sunday performs well in practice when its shift table produces
   large jumps, but degrades to O(n*m) on repetitive inputs.

   KMP and FSM both guarantee O(n+m) worst-case search time.  KMP is
   usually preferred for space efficiency; FSM is attractive when the
   same pattern is searched many times and the transition table can
   be constructed once and reused.

   Rabin-Karp excels when searching for multiple patterns (compare
   all hashes in one pass) and extends naturally to two-dimensional
   matching.  Its weakness is degenerate inputs with many true
   matches or collisions.

   Gusfield's Z-Algorithm is a clean, self-contained linear-time
   exact matcher.  Its Z-array also solves broader prefix-analysis
   problems, making it more general than a dedicated search routine.

   No single algorithm is best for all inputs.  The wacky-race
   experiments confirm this: each of Sunday, KMP, and Rabin-Karp can
   be made to win or lose by at least 2x depending on the structure
   of the text and pattern.
  </p>

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 6]</span>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════
     PAGE 7 — REFERENCES
     ════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="rfc-header">
    <span>Pattern Matching Algorithms</span>
    <span>Informational</span>
    <span>${year}</span>
  </div>

  <h2 class="rfc-h2">8.  References</h2>
  <p class="rfc-p">
   The following sources were consulted during the design, implementation,
   and analysis of this project.
  </p>

  ${referencesHtml()}

  <div class="rfc-footer">
    <span>Norbutaev</span>
    <span>${today}</span>
    <span>[Page 7]</span>
  </div>
</div>

</body>
</html>`;
}

async function ensureCharts(benchmarkResults, wackyResults) {
  const smallChart = path.join(DEFAULT_CHART_DIR, "rt_small_pattern.png");
  const largeChart = path.join(DEFAULT_CHART_DIR, "rt_large_pattern.png");
  const wackyChart = path.join(DEFAULT_CHART_DIR, "wacky_races.png");

  if (benchmarkResults && (!fs.existsSync(smallChart) || !fs.existsSync(largeChart))) {
    await generateRTvsLengthChart(benchmarkResults, DEFAULT_CHART_DIR);
  }

  if (wackyResults && !fs.existsSync(wackyChart)) {
    await generateWackyChart(wackyResults, DEFAULT_CHART_DIR);
  }

  return {
    small: imageToDataUri(smallChart),
    large: imageToDataUri(largeChart),
    wacky: imageToDataUri(wackyChart)
  };
}

async function generatePdfReport(inputs = {}) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const benchmarkResults = inputs.benchmarkResults ?? readJsonIfExists(BENCHMARK_PATH, null);
  const wackyResults = inputs.wackyResults ?? readJsonIfExists(WACKY_PATH, null);
  const wildcardResults = inputs.wildcardResults ?? readJsonIfExists(WILDCARD_PATH, null);
  const chartUris = await ensureCharts(benchmarkResults, wackyResults);
  const html = buildHtml({ benchmarkResults, wackyResults, wildcardResults, chartUris });
  const puppeteer = ensurePuppeteer();
  const browser = await puppeteer.launch({ headless: "new" });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 760, height: 1000, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    const pdfSize = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return {
        width: Math.ceil(Math.max(html.scrollWidth, body.scrollWidth)),
        height: Math.ceil(Math.max(html.scrollHeight, body.scrollHeight))
      };
    });

    await page.pdf({
      path: REPORT_PATH,
      width: `${pdfSize.width}px`,
      height: `${pdfSize.height + 50}px`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
  } finally {
    await browser.close();
  }

  return REPORT_PATH;
}

if (require.main === module) {
  generatePdfReport().then((reportPath) => {
    console.log(`Report saved to ${reportPath}`);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  generatePdfReport,
  buildHtml,
  REPORT_PATH
};
