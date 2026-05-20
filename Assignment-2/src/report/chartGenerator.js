"use strict";

const fs = require("fs");
const path = require("path");

const { assignmentRoot } = require("../utils/text");

const DEFAULT_CHART_DIR = assignmentRoot("output", "charts");
const PALETTE = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#be123c"];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTick(value) {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  if (Math.abs(value) < 10 && value !== 0) {
    return value.toFixed(2);
  }
  return value.toFixed(0);
}

function lineChart(options) {
  const {
    title,
    xLabel,
    yLabel,
    series,
    width = 960,
    height = 560
  } = options;

  const margin = { top: 54, right: 32, bottom: 94, left: 86 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const allPoints = series.flatMap((entry) => entry.points);
  const xMin = Math.min(...allPoints.map((point) => point.x));
  const xMax = Math.max(...allPoints.map((point) => point.x));
  const yMax = Math.max(1, ...allPoints.map((point) => point.y)) * 1.12;
  const xScale = (x) => margin.left + ((x - xMin) / Math.max(1, xMax - xMin)) * plotWidth;
  const yScale = (y) => margin.top + plotHeight - (y / yMax) * plotHeight;
  const uniqueX = Array.from(new Set(allPoints.map((point) => point.x))).sort((a, b) => a - b);
  const yTicks = Array.from({ length: 6 }, (_, index) => (yMax * index) / 5);

  const xAxis = uniqueX
    .map((x) => {
      const sx = xScale(x);
      return `
        <line x1="${sx}" y1="${margin.top + plotHeight}" x2="${sx}" y2="${margin.top + plotHeight + 6}" stroke="#334155"/>
        <text x="${sx}" y="${margin.top + plotHeight + 24}" text-anchor="middle" font-size="12" fill="#334155">${escapeXml(formatTick(x))}</text>`;
    })
    .join("");

  const yAxis = yTicks
    .map((y) => {
      const sy = yScale(y);
      return `
        <line x1="${margin.left - 6}" y1="${sy}" x2="${margin.left}" y2="${sy}" stroke="#334155"/>
        <line x1="${margin.left}" y1="${sy}" x2="${margin.left + plotWidth}" y2="${sy}" stroke="#e2e8f0"/>
        <text x="${margin.left - 12}" y="${sy + 4}" text-anchor="end" font-size="12" fill="#334155">${escapeXml(formatTick(y))}</text>`;
    })
    .join("");

  const lines = series
    .map((entry, index) => {
      const color = PALETTE[index % PALETTE.length];
      const points = entry.points.map((point) => `${xScale(point.x).toFixed(2)},${yScale(point.y).toFixed(2)}`).join(" ");
      const circles = entry.points
        .map((point) => `<circle cx="${xScale(point.x).toFixed(2)}" cy="${yScale(point.y).toFixed(2)}" r="4" fill="${color}"/>`)
        .join("");
      return `<polyline fill="none" stroke="${color}" stroke-width="2.4" points="${points}"/>${circles}`;
    })
    .join("");

  const legend = series
    .map((entry, index) => {
      const color = PALETTE[index % PALETTE.length];
      const x = margin.left + (index % 3) * 270;
      const y = height - 48 + Math.floor(index / 3) * 22;
      return `
        <rect x="${x}" y="${y - 10}" width="12" height="12" fill="${color}"/>
        <text x="${x + 18}" y="${y}" font-size="13" fill="#0f172a">${escapeXml(entry.label)}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <g font-family="Arial, sans-serif">
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#334155"/>
    <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#334155"/>
    ${xAxis}
    ${yAxis}
    ${lines}
    <text x="${margin.left + plotWidth / 2}" y="${height - 18}" text-anchor="middle" font-size="14" fill="#0f172a">${escapeXml(xLabel)}</text>
    <text transform="translate(24 ${margin.top + plotHeight / 2}) rotate(-90)" text-anchor="middle" font-size="14" fill="#0f172a">${escapeXml(yLabel)}</text>
    ${legend}
  </g>
</svg>`;
}

function barChart(options) {
  const {
    title,
    yLabel,
    bars,
    width = 960,
    height = 560
  } = options;

  const margin = { top: 54, right: 28, bottom: 122, left: 86 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(1, ...bars.map((bar) => bar.value)) * 1.12;
  const barGap = 16;
  const barWidth = Math.max(24, (plotWidth - barGap * (bars.length + 1)) / bars.length);
  const yScale = (y) => margin.top + plotHeight - (y / maxValue) * plotHeight;
  const yTicks = Array.from({ length: 6 }, (_, index) => (maxValue * index) / 5);

  const yAxis = yTicks
    .map((y) => {
      const sy = yScale(y);
      return `
        <line x1="${margin.left - 6}" y1="${sy}" x2="${margin.left}" y2="${sy}" stroke="#334155"/>
        <line x1="${margin.left}" y1="${sy}" x2="${margin.left + plotWidth}" y2="${sy}" stroke="#e2e8f0"/>
        <text x="${margin.left - 12}" y="${sy + 4}" text-anchor="end" font-size="12" fill="#334155">${escapeXml(formatTick(y))}</text>`;
    })
    .join("");

  const renderedBars = bars
    .map((bar, index) => {
      const x = margin.left + barGap + index * (barWidth + barGap);
      const y = yScale(bar.value);
      const h = margin.top + plotHeight - y;
      const color = bar.color || PALETTE[index % PALETTE.length];
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="${color}"/>
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="12" fill="#0f172a">${escapeXml(formatTick(bar.value))}</text>
        <text transform="translate(${x + barWidth / 2} ${margin.top + plotHeight + 18}) rotate(35)" text-anchor="start" font-size="12" fill="#334155">${escapeXml(bar.label)}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <g font-family="Arial, sans-serif">
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#334155"/>
    <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#334155"/>
    ${yAxis}
    ${renderedBars}
    <text transform="translate(24 ${margin.top + plotHeight / 2}) rotate(-90)" text-anchor="middle" font-size="14" fill="#0f172a">${escapeXml(yLabel)}</text>
  </g>
</svg>`;
}

function groupLookupSeries(spellResults) {
  const byDictionary = new Map();
  for (const row of spellResults.lookupResults) {
    if (!byDictionary.has(row.dictionary)) {
      byDictionary.set(row.dictionary, []);
    }
    byDictionary.get(row.dictionary).push({
      x: row.actualChars,
      y: row.lookupMedianMs
    });
  }

  return Array.from(byDictionary.entries()).map(([label, points]) => ({
    label,
    points: points.sort((a, b) => a.x - b.x)
  }));
}

function groupHashSeries(hashResults, metric) {
  const byTable = new Map();
  for (const row of hashResults.results) {
    if (!byTable.has(row.table)) {
      byTable.set(row.table, []);
    }
    byTable.get(row.table).push({
      x: row.loadFactor,
      y: row[metric]
    });
  }

  return Array.from(byTable.entries()).map(([label, points]) => ({
    label,
    points: points.sort((a, b) => a.x - b.x)
  }));
}

async function generateCharts(inputs, outputDir = DEFAULT_CHART_DIR) {
  const { spellResults, hashResults } = inputs;
  fs.mkdirSync(outputDir, { recursive: true });

  const lookupSvg = lineChart({
    title: "Spell Checking RT vs Text Length",
    xLabel: "Text length in characters",
    yLabel: "Median lookup time (ms)",
    series: groupLookupSeries(spellResults)
  });
  fs.writeFileSync(path.join(outputDir, "spell_lookup_rt.svg"), lookupSvg);

  const buildSvg = barChart({
    title: "Dictionary Build Time",
    yLabel: "Build time (ms)",
    bars: spellResults.buildResults.map((row, index) => ({
      label: row.dictionary,
      value: row.buildMedianMs,
      color: PALETTE[index % PALETTE.length]
    }))
  });
  fs.writeFileSync(path.join(outputDir, "dictionary_build_time.svg"), buildSvg);

  const memorySvg = barChart({
    title: "Estimated Dictionary Memory",
    yLabel: "Estimated memory (MB)",
    bars: spellResults.buildResults.map((row, index) => ({
      label: row.dictionary,
      value: row.memoryBytes / (1024 * 1024),
      color: PALETTE[index % PALETTE.length]
    }))
  });
  fs.writeFileSync(path.join(outputDir, "dictionary_memory.svg"), memorySvg);

  const insertSvg = lineChart({
    title: "Hash Table Insert Time vs Load Factor",
    xLabel: "Load factor",
    yLabel: "Median insert time (microseconds/op)",
    series: groupHashSeries(hashResults, "insertUsPerOp")
  });
  fs.writeFileSync(path.join(outputDir, "hash_insert_vs_load.svg"), insertSvg);

  const searchSvg = lineChart({
    title: "Hash Table Search Time vs Load Factor",
    xLabel: "Load factor",
    yLabel: "Median search time (microseconds/op)",
    series: groupHashSeries(hashResults, "searchUsPerOp")
  });
  fs.writeFileSync(path.join(outputDir, "hash_search_vs_load.svg"), searchSvg);

  return {
    lookup: path.join(outputDir, "spell_lookup_rt.svg"),
    build: path.join(outputDir, "dictionary_build_time.svg"),
    memory: path.join(outputDir, "dictionary_memory.svg"),
    hashInsert: path.join(outputDir, "hash_insert_vs_load.svg"),
    hashSearch: path.join(outputDir, "hash_search_vs_load.svg")
  };
}

if (require.main === module) {
  const spellResults = JSON.parse(fs.readFileSync(assignmentRoot("output", "spell_results.json"), "utf8"));
  const hashResults = JSON.parse(fs.readFileSync(assignmentRoot("output", "hash_table_results.json"), "utf8"));
  generateCharts({ spellResults, hashResults }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_CHART_DIR,
  barChart,
  generateCharts,
  lineChart
};
