"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_CHART_DIR = path.join(__dirname, "..", "..", "output", "charts");

const COLORS = [
  "#1f77b4",
  "#d62728",
  "#2ca02c",
  "#9467bd",
  "#ff7f0e",
  "#17becf"
];

function ensureChartDependency() {
  try {
    return require("chartjs-node-canvas").ChartJSNodeCanvas;
  } catch (error) {
    throw new Error("chartjs-node-canvas is not installed. Run npm install before generating charts.");
  }
}

function createCanvas() {
  const ChartJSNodeCanvas = ensureChartDependency();
  return new ChartJSNodeCanvas({
    width: 1100,
    height: 650,
    backgroundColour: "white"
  });
}

function normalizeChartDir(outputPath) {
  const chartDir = outputPath || DEFAULT_CHART_DIR;
  fs.mkdirSync(chartDir, { recursive: true });
  return chartDir;
}

function readJsonInput(input) {
  if (typeof input === "string") {
    return JSON.parse(fs.readFileSync(input, "utf8"));
  }
  return input;
}

function algorithmsFor(results) {
  return Array.from(new Set(results.map((result) => result.algorithm)));
}

async function renderLineChart(results, patternType, outputFile) {
  const canvas = createCanvas();
  const filtered = results.results.filter((result) => result.patternType === patternType);
  const sizes = results.sizes;
  const algorithms = algorithmsFor(filtered);

  const datasets = algorithms.map((algorithm, index) => ({
    label: algorithm,
    data: sizes.map((size) => {
      const point = filtered.find((result) => result.algorithm === algorithm && result.size === size);
      return point ? Number(point.medianMs.toFixed(4)) : null;
    }),
    borderColor: COLORS[index % COLORS.length],
    backgroundColor: COLORS[index % COLORS.length],
    borderWidth: 2,
    pointRadius: 3,
    tension: 0.2,
    spanGaps: true
  }));

  const configuration = {
    type: "line",
    data: {
      labels: sizes.map((size) => size.toLocaleString()),
      datasets
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Running Time vs Text Length (${patternType} pattern)`,
          font: { size: 20 }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Text length (characters)" },
          grid: { color: "#eeeeee" }
        },
        y: {
          title: { display: true, text: "Median running time (ms)" },
          beginAtZero: true,
          grid: { color: "#eeeeee" }
        }
      }
    }
  };

  const buffer = await canvas.renderToBuffer(configuration);
  fs.writeFileSync(outputFile, buffer);
}

async function generateRTvsLengthChart(results, outputPath) {
  results = readJsonInput(results);
  const chartDir = normalizeChartDir(outputPath);
  const smallPath = path.join(chartDir, "rt_small_pattern.png");
  const largePath = path.join(chartDir, "rt_large_pattern.png");

  await renderLineChart(results, "small", smallPath);
  await renderLineChart(results, "large", largePath);

  return {
    small: smallPath,
    large: largePath
  };
}

async function generateWackyChart(wackyResults, outputPath) {
  wackyResults = readJsonInput(wackyResults);
  const chartDir = normalizeChartDir(outputPath);
  const outputFile = path.join(chartDir, "wacky_races.png");
  const canvas = createCanvas();

  const labels = wackyResults.races.map((race) => race.title.replace(" >= 2x faster than ", " vs "));
  const faster = wackyResults.races.map((race) => {
    const measurement = race.measurements.find((item) => race.title.startsWith(item.algorithm));
    return measurement ? Number(measurement.medianMs.toFixed(4)) : null;
  });
  const slower = wackyResults.races.map((race) => {
    const fasterName = race.title.split(" >= ")[0];
    const measurement = race.measurements.find((item) => item.algorithm !== fasterName);
    return measurement ? Number(measurement.medianMs.toFixed(4)) : null;
  });

  const configuration = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Faster algorithm median ms",
          data: faster,
          backgroundColor: "#2ca02c"
        },
        {
          label: "Slower algorithm median ms",
          data: slower,
          backgroundColor: "#d62728"
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: "Wacky Races: Adversarial Inputs",
          font: { size: 20 }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Race" },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: "Median running time (ms)" },
          beginAtZero: true,
          grid: { color: "#eeeeee" }
        }
      }
    }
  };

  const buffer = await canvas.renderToBuffer(configuration);
  fs.writeFileSync(outputFile, buffer);
  return outputFile;
}

if (require.main === module) {
  const benchmarkPath = path.join(__dirname, "..", "..", "output", "benchmark_results.json");
  const wackyPath = path.join(__dirname, "..", "..", "output", "wacky_results.json");

  (async () => {
    if (fs.existsSync(benchmarkPath)) {
      await generateRTvsLengthChart(JSON.parse(fs.readFileSync(benchmarkPath, "utf8")), DEFAULT_CHART_DIR);
    }
    if (fs.existsSync(wackyPath)) {
      await generateWackyChart(JSON.parse(fs.readFileSync(wackyPath, "utf8")), DEFAULT_CHART_DIR);
    }
  })().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  generateRTvsLengthChart,
  generateWackyChart,
  DEFAULT_CHART_DIR
};
