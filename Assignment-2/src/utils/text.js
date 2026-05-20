"use strict";

const fs = require("fs");
const path = require("path");

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

function normalizeWord(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^[^a-z]+/g, "")
    .replace(/[^a-z]+$/g, "");
}

function tokenize(text) {
  const tokens = [];
  const matches = String(text).matchAll(WORD_RE);
  for (const match of matches) {
    const word = normalizeWord(match[0]);
    if (word) {
      tokens.push(word);
    }
  }
  return tokens;
}

function readWordList(filePath, options = {}) {
  const { limit = Infinity } = options;
  const text = fs.readFileSync(filePath, "utf8");
  const words = [];
  const seen = new Set();

  for (const rawLine of text.split(/\r?\n/)) {
    const word = normalizeWord(rawLine);
    if (!word || seen.has(word)) {
      continue;
    }
    seen.add(word);
    words.push(word);
    if (words.length >= limit) {
      break;
    }
  }

  return words;
}

function corruptWord(word) {
  if (word.length <= 2) {
    return `${word}zz`;
  }
  const middle = Math.floor(word.length / 2);
  return `${word.slice(0, middle)}qz${word.slice(middle + 1)}`;
}

function buildSpellText(words, targetChars) {
  const output = [];
  let chars = 0;
  let index = 0;

  while (chars < targetChars) {
    const original = words[(index * 37 + 11) % words.length];
    const word = index % 11 === 0 ? corruptWord(original) : original;
    output.push(word);
    chars += word.length + 1;
    index += 1;
  }

  return output.join(" ");
}

function bytesToHuman(bytes) {
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function assignmentRoot(...segments) {
  return path.resolve(__dirname, "..", "..", ...segments);
}

module.exports = {
  WORD_RE,
  assignmentRoot,
  bytesToHuman,
  buildSpellText,
  corruptWord,
  normalizeWord,
  readWordList,
  tokenize
};
