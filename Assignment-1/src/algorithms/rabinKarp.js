"use strict";

const PRIME = 1000000007;
const BASE = 256;

function allIndicesForEmptyPattern(text) {
  return Array.from({ length: text.length + 1 }, (_, index) => index);
}

function mod(value) {
  value %= PRIME;
  return value < 0 ? value + PRIME : value;
}

function rabinKarp(text, pattern) {
  text = String(text);
  pattern = String(pattern);

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return allIndicesForEmptyPattern(text);
  if (m > n) return [];

  let patternHash = 0;
  let windowHash = 0;
  let highestBasePower = 1;

  for (let i = 0; i < m - 1; i += 1) {
    highestBasePower = (highestBasePower * BASE) % PRIME;
  }

  for (let i = 0; i < m; i += 1) {
    patternHash = (patternHash * BASE + pattern.charCodeAt(i)) % PRIME;
    windowHash = (windowHash * BASE + text.charCodeAt(i)) % PRIME;
  }

  const matches = [];

  for (let i = 0; i <= n - m; i += 1) {
    if (patternHash === windowHash && text.slice(i, i + m) === pattern) {
      matches.push(i);
    }

    if (i < n - m) {
      const left = text.charCodeAt(i);
      const right = text.charCodeAt(i + m);
      windowHash = mod(windowHash - (left * highestBasePower) % PRIME);
      windowHash = (windowHash * BASE + right) % PRIME;
    }
  }

  return matches;
}

module.exports = {
  rabinKarp,
  PRIME,
  BASE
};
