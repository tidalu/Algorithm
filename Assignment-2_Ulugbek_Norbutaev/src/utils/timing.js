"use strict";

const { performance } = require("perf_hooks");

function median(values) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function measure(fn, runs = 3) {
  const times = [];
  let result;

  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    result = fn();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    medianMs: median(times),
    runsMs: times,
    result
  };
}

module.exports = {
  measure,
  median
};
