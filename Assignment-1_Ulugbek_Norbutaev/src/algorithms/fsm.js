"use strict";

const { buildPrefixFunction } = require("./kmp");

function allIndicesForEmptyPattern(text) {
  return Array.from({ length: text.length + 1 }, (_, index) => index);
}

function buildAlphabet(text, pattern) {
  return Array.from(new Set(`${text}${pattern}`));
}

function buildTransitionTable(pattern, alphabet) {
  const m = pattern.length;
  const prefix = buildPrefixFunction(pattern);
  const delta = Array.from({ length: m + 1 }, () => new Map());

  for (let q = 0; q <= m; q += 1) {
    for (const char of alphabet) {
      if (q < m && char === pattern[q]) {
        delta[q].set(char, q + 1);
      } else if (q === 0) {
        delta[q].set(char, 0);
      } else {
        delta[q].set(char, delta[prefix[q - 1]].get(char) ?? 0);
      }
    }
  }

  return delta;
}

function fsm(text, pattern) {
  text = String(text);
  pattern = String(pattern);

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return allIndicesForEmptyPattern(text);
  if (m > n) return [];

  const alphabet = buildAlphabet(text, pattern);
  const delta = buildTransitionTable(pattern, alphabet);
  const matches = [];
  let state = 0;

  for (let i = 0; i < n; i += 1) {
    state = delta[state].get(text[i]) ?? 0;
    if (state === m) {
      matches.push(i - m + 1);
    }
  }

  return matches;
}

module.exports = {
  fsm,
  buildTransitionTable
};
