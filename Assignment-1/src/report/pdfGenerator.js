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
    return `${patternType} pattern: ${sorted[0].algorithm} had the lowest total median time, while ${sorted[sorted.length - 1].algorithm} had the highest.`;
  });

  return `${byPattern.join(" ")} Across increasing text sizes, the linear-time methods grow close to linearly, while methods that compare many characters per alignment become visibly more sensitive to pattern length and input structure.`;
}

function tableRows(rows, cells) {
  return rows.map((row) => `<tr>${cells.map((cell) => `<td>${cell(row)}</td>`).join("")}</tr>`).join("");
}

function algorithmDescriptionsHtml() {
  const descriptions = [
    {
      name: "Brute Force",
      category: "Exact matching baseline",
      core: "Tries every possible alignment of the pattern in the text and compares characters from left to right. It does no preprocessing and is easy to reason about. It is often quick when mismatches happen immediately, but repeated prefixes can force many repeated comparisons.",
      preprocessing: "None.",
      search: "For each index i, compare P[0..m-1] with T[i..i+m-1].",
      time: "Preprocessing O(1). Search O(n*m) worst case, often much better on random text.",
      space: "O(1) besides the output array.",
      best: "Most windows fail on the first character.",
      worst: "Text and pattern share long repeated prefixes, such as many a characters followed by one mismatch."
    },
    {
      name: "Sunday",
      category: "Heuristic bad-character shift method",
      core: "Compares a window, then looks at the character immediately after that window. The next possible match must include that character, so the algorithm shifts the pattern to align it with its rightmost occurrence. If the character is absent from the pattern, the whole window is skipped.",
      preprocessing: "Build a full bad-character shift table with default shift m + 1.",
      search: "Compare the current window, record a match if complete, then shift using T[i + m].",
      time: "Preprocessing O(m + alphabet). Average often sublinear; worst case O(n*m).",
      space: "O(alphabet) for the shift table.",
      best: "Characters after windows are not in the pattern, producing m + 1 jumps.",
      worst: "Highly repetitive inputs cause tiny shifts and many comparisons."
    },
    {
      name: "KMP",
      category: "Exact linear-time prefix-function algorithm",
      core: "Reuses information from a partial match. When a mismatch happens after j matched characters, KMP knows which pattern prefix is also a suffix of the matched text and resumes there instead of restarting from zero.",
      preprocessing: "Build the prefix/failure function f for the pattern.",
      search: "Scan the text once while maintaining how many pattern characters are currently matched.",
      time: "Preprocessing O(m). Search O(n). Worst case O(n + m).",
      space: "O(m) for the prefix table.",
      best: "Long patterns with repeated structure, where naive search would re-check characters.",
      worst: "Still linear; the constant factor appears when many fallback transitions occur."
    },
    {
      name: "FSM",
      category: "Deterministic finite automaton exact matcher",
      core: "Builds a machine with states 0..m, where state q means q pattern characters have been matched. Each incoming text character moves the machine to the next state. State m is accepting and reports a match.",
      preprocessing: "Build delta[state][char] transitions using the KMP fallback idea.",
      search: "Read each text character, follow one transition, and record accepting states.",
      time: "Preprocessing O(m * alphabet). Search O(n).",
      space: "O(m * alphabet), which can be large.",
      best: "Repeated searches with the same pattern and alphabet, where preprocessing can be reused.",
      worst: "Large alphabets make the transition table expensive."
    },
    {
      name: "Rabin-Karp",
      category: "Rolling-hash exact matcher",
      core: "Represents the pattern and each text window by a numeric hash. A rolling update moves the hash one character to the right in constant time. Matching hashes are verified with an exact comparison to guard against collisions.",
      preprocessing: "Compute the pattern hash, first window hash, and highest base power.",
      search: "Slide the window, compare hashes, and verify when hashes match.",
      time: "Average O(n + m). Worst case O(n*m) if every window requires verification.",
      space: "O(1) besides output.",
      best: "Few hash matches and therefore few full verifications.",
      worst: "Many true matches or collisions force repeated character-by-character checks."
    },
    {
      name: "Gusfield Z",
      category: "Exact linear-time Z-array method",
      core: "Builds S = P + separator + T and computes, for every position, how many characters match the prefix of S. A full pattern match in the text appears as a Z value of at least m after the separator.",
      preprocessing: "Construct the combined string and compute its Z-array using the rightmost Z-box.",
      search: "Read Z positions corresponding to text offsets and report those equal to the pattern length.",
      time: "O(n + m) to build and scan the Z-array.",
      space: "O(n + m) for the combined string and Z-array.",
      best: "When the full Z-array is useful, such as prefix-analysis tasks or one-shot exact search.",
      worst: "Still linear, but it always allocates and scans the combined string."
    }
  ];

  return descriptions.map((item) => `
    <article class="algorithm">
      <h3>${item.name}</h3>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Core idea:</strong> ${item.core}</p>
      <p><strong>Preprocessing:</strong> ${item.preprocessing}</p>
      <p><strong>Search:</strong> ${item.search}</p>
      <p><strong>Time complexity:</strong> ${item.time}</p>
      <p><strong>Space complexity:</strong> ${item.space}</p>
      <p><strong>Best case:</strong> ${item.best}</p>
      <p><strong>Worst case:</strong> ${item.worst}</p>
    </article>
  `).join("");
}

function wackyHtml(wackyResults) {
  if (!wackyResults?.races?.length) {
    return "<p>Wacky race results were not available.</p>";
  }

  return wackyResults.races.map((race) => `
    <article class="race">
      <h3>${escapeHtml(race.title)}</h3>
      <p><strong>T[:100]:</strong> <code>${escapeHtml(race.textPrefix100)}</code></p>
      <p><strong>P:</strong> <code>${escapeHtml(race.pattern)}</code></p>
      <table>
        <thead><tr><th>Algorithm</th><th>Median time</th><th>Matches</th></tr></thead>
        <tbody>
          ${tableRows(race.measurements, [
            (row) => escapeHtml(row.algorithm),
            (row) => formatMs(row.medianMs),
            (row) => String(row.matchCount)
          ])}
        </tbody>
      </table>
      <p><strong>Ratio:</strong> ${race.ratio.toFixed(2)}x. ${escapeHtml(race.explanation)}</p>
    </article>
  `).join("");
}

function wildcardHtml(wildcardResults) {
  if (!wildcardResults?.tests?.length) {
    return "<p>Wildcard test results were not available.</p>";
  }

  return `
    <table>
      <thead><tr><th>Case</th><th>Pattern</th><th>Expected</th><th>Brute Force</th><th>Sunday</th><th>Status</th></tr></thead>
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
    <p>The large text timing used ${wildcardResults.largeTiming?.textLength ?? "n/a"} characters and pattern <code>${escapeHtml(wildcardResults.largeTiming?.pattern ?? "")}</code>.
    Brute Force took ${formatMs(wildcardResults.largeTiming?.bruteForceWildcard?.ms)} and Sunday took ${formatMs(wildcardResults.largeTiming?.sundayWildcard?.ms)}.</p>
  `;
}

function buildHtml({ benchmarkResults, wackyResults, wildcardResults, chartUris }) {
  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Assignment I — Pattern Matching Algorithms</title>
  <style>
    body { font-family: Arial, sans-serif; color: #202124; line-height: 1.45; margin: 0; }
    .page { padding: 44px 54px; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    h1 { font-size: 34px; margin: 0 0 18px; }
    h2 { font-size: 23px; border-bottom: 2px solid #222; padding-bottom: 6px; margin: 0 0 18px; }
    h3 { font-size: 17px; margin: 20px 0 6px; }
    p, li { font-size: 11.5px; }
    code { font-family: Consolas, monospace; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 10px; }
    th, td { border: 1px solid #d6d6d6; padding: 6px; vertical-align: top; }
    th { background: #f3f5f7; }
    img.chart { width: 100%; margin: 12px 0 20px; border: 1px solid #eeeeee; }
    .cover { display: flex; flex-direction: column; justify-content: center; height: 90vh; }
    .subtitle { font-size: 16px; color: #555; }
    .algorithm { break-inside: avoid; }
    .race { break-inside: avoid; margin-bottom: 18px; }
  </style>
</head>
<body>
  <section class="page cover">
    <h1>Assignment I — Pattern Matching Algorithms</h1>
    <p class="subtitle">Student name: [YOUR NAME]</p>
    <p class="subtitle">Date: ${today}</p>
  </section>

  <section class="page">
    <h2>1. Introduction</h2>
    <p>Pattern matching asks where a pattern P of length m appears inside a text T of length n. It matters in text editors, search engines, plagiarism tools, compilers, antivirus scanners, and DNA sequence analysis because all of these systems need to find structured sequences inside larger data.</p>
    <p>This project implements Brute Force, Sunday, Knuth-Morris-Pratt, a finite-state-machine matcher, Rabin-Karp, Gusfield's Z-algorithm, wildcard extensions for Brute Force and Sunday, and a 2D Rabin-Karp matcher.</p>
  </section>

  <section class="page">
    <h2>2. Algorithm Descriptions</h2>
    ${algorithmDescriptionsHtml()}
  </section>

  <section class="page">
    <h2>3. Part 1A Benchmark Results</h2>
    ${chartUris.small ? `<img class="chart" src="${chartUris.small}" alt="Small pattern chart">` : ""}
    ${chartUris.large ? `<img class="chart" src="${chartUris.large}" alt="Large pattern chart">` : ""}
    <p>${escapeHtml(benchmarkAnalysis(benchmarkResults))}</p>
  </section>

  <section class="page">
    <h2>4. Part 1B — Wacky Races</h2>
    ${chartUris.wacky ? `<img class="chart" src="${chartUris.wacky}" alt="Wacky races chart">` : ""}
    ${wackyHtml(wackyResults)}
  </section>

  <section class="page">
    <h2>5. Part 2 — Wildcard Matching</h2>
    <p>The Brute Force wildcard matcher tokenizes the pattern into literals, question marks, and stars, then uses backtracking over a glob-style matcher. The question mark consumes exactly one character. The star records a backtracking point and can later expand to consume zero or more characters.</p>
    <p>The Sunday wildcard matcher splits the token stream on stars. Each fixed segment is searched left to right with a Sunday-style shift table, and question marks are treated conservatively because they can match any character. The segments must appear in increasing, non-overlapping order, while stars allow arbitrary text between them.</p>
    ${wildcardHtml(wildcardResults)}
  </section>

  <section class="page">
    <h2>6. Part 3 — 2D Rabin-Karp</h2>
    <p>The 2D version checks whether the K by K top-right corner appears elsewhere in the picture. Arbitrary picture items are first mapped to integer codes with a Map. Each row window is hashed with a 1D rolling hash, and then each vertical stack of K row hashes is hashed again to form one 2D hash.</p>
    <p>The implementation uses <code>&amp; ((1 &lt;&lt; 31) - 1)</code> instead of modulo division. Bitwise masking is fast in JavaScript because it operates on 32-bit integers, and it avoids the division-like cost of <code>% prime</code>. A hash hit is always verified by direct K by K comparison.</p>
    <p>The algorithm is O(M*N): horizontal row hashes are computed once for every row and column window, vertical hashes are rolled in O(1), and every pixel participates in a constant number of rolling-hash updates. Verification is only done on hash matches.</p>
    <p>Worked example with K=2: in a 5 by 5 picture, the pattern is rows 0..1 and columns 3..4. If those four values are <code>[[D,E],[I,J]]</code>, the algorithm hashes <code>D,E</code> and <code>I,J</code>, combines those two row hashes, then slides a 2 by 2 window through all positions except the original top-right location.</p>
  </section>

  <section class="page">
    <h2>7. Conclusions</h2>
    <p>Brute Force is best as a simple baseline. Sunday is excellent on ordinary text when the after-window character creates large jumps, but it can degrade on repetitive inputs. KMP and FSM give deterministic linear scans; KMP is usually more space-efficient, while FSM is attractive when the transition table can be reused. Rabin-Karp is practical when hashes avoid frequent verification and especially useful as a basis for multi-pattern or multidimensional matching. Gusfield's Z-algorithm is a clean linear-time exact matcher that is also valuable for prefix-analysis problems.</p>
  </section>
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
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: REPORT_PATH,
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm"
      }
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
