"use strict";

function allIndicesForEmptyPattern(text) {
  return Array.from({ length: text.length + 1 }, (_, index) => index);
}

function buildPrefixFunction(pattern) {
  const prefix = new Array(pattern.length).fill(0);
  let matched = 0;

  for (let i = 1; i < pattern.length; i += 1) {
    while (matched > 0 && pattern[i] !== pattern[matched]) {
      matched = prefix[matched - 1];
    }

    if (pattern[i] === pattern[matched]) {
      matched += 1;
    }

    prefix[i] = matched;
  }

  return prefix;
}

function kmp(text, pattern) {
  text = String(text);
  pattern = String(pattern);

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return allIndicesForEmptyPattern(text);
  if (m > n) return [];

  const prefix = buildPrefixFunction(pattern);
  const matches = [];
  let matched = 0;

  for (let i = 0; i < n; i += 1) {
    while (matched > 0 && text[i] !== pattern[matched]) {
      matched = prefix[matched - 1];
    }

    if (text[i] === pattern[matched]) {
      matched += 1;
    }

    if (matched === m) {
      matches.push(i - m + 1);
      matched = prefix[matched - 1];
    }
  }

  return matches;
}

module.exports = {
  kmp,
  buildPrefixFunction
};
