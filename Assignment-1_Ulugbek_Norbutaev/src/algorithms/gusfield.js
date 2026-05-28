"use strict";

function allIndicesForEmptyPattern(text) {
  return Array.from({ length: text.length + 1 }, (_, index) => index);
}

function chooseSeparator(text, pattern) {
  const candidates = ["$", "\u0000", "\u0001", "\u0002", "\u001F", "\uE000"];
  for (const candidate of candidates) {
    if (!text.includes(candidate) && !pattern.includes(candidate)) {
      return candidate;
    }
  }
  throw new Error("Could not find a separator character not present in text or pattern.");
}

function buildZArray(value) {
  const z = new Array(value.length).fill(0);
  let left = 0;
  let right = 0;

  for (let i = 1; i < value.length; i += 1) {
    if (i <= right) {
      z[i] = Math.min(right - i + 1, z[i - left]);
    }

    while (i + z[i] < value.length && value[z[i]] === value[i + z[i]]) {
      z[i] += 1;
    }

    if (i + z[i] - 1 > right) {
      left = i;
      right = i + z[i] - 1;
    }
  }

  return z;
}

function gusfield(text, pattern) {
  text = String(text);
  pattern = String(pattern);

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return allIndicesForEmptyPattern(text);
  if (m > n) return [];

  const separator = chooseSeparator(text, pattern);
  const combined = `${pattern}${separator}${text}`;
  const z = buildZArray(combined);
  const matches = [];
  const textOffset = m + 1;

  for (let i = textOffset; i < combined.length; i += 1) {
    if (z[i] >= m) {
      matches.push(i - textOffset);
    }
  }

  return matches;
}

module.exports = {
  gusfield,
  buildZArray
};
