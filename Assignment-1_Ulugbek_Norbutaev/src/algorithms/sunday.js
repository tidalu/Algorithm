"use strict";

const { parseWildcardPattern, tokenMatchesChar } = require("./bruteForce");

function allIndicesForEmptyPattern(text) {
  return Array.from({ length: text.length + 1 }, (_, index) => index);
}

function buildSundayShiftTable(pattern) {
  const defaultShift = pattern.length + 1;
  const asciiShift = new Array(256).fill(defaultShift);
  const extraShift = new Map();

  for (let i = 0; i < pattern.length; i += 1) {
    const shift = pattern.length - i;
    const code = pattern.charCodeAt(i);
    if (code < 256) {
      asciiShift[code] = shift;
    } else {
      extraShift.set(pattern[i], shift);
    }
  }

  return {
    get(char) {
      if (char === undefined) return defaultShift;
      const code = char.charCodeAt(0);
      if (code < 256) return asciiShift[code];
      return extraShift.get(char) ?? defaultShift;
    }
  };
}

function sunday(text, pattern) {
  text = String(text);
  pattern = String(pattern);

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return allIndicesForEmptyPattern(text);
  if (m > n) return [];

  const shift = buildSundayShiftTable(pattern);
  const matches = [];
  let i = 0;

  while (i <= n - m) {
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) {
      j += 1;
    }

    if (j === m) {
      matches.push(i);
    }

    if (i + m >= n) break;
    i += shift.get(text[i + m]);
  }

  return matches;
}

function segmentLength(segment) {
  return segment.length;
}

function segmentMatchesAt(text, segment, index) {
  if (index + segment.length > text.length) return false;

  for (let i = 0; i < segment.length; i += 1) {
    if (!tokenMatchesChar(segment[i], text[index + i])) {
      return false;
    }
  }
  return true;
}

function buildWildcardSegmentShift(segment) {
  const length = segment.length;
  let defaultShift = length + 1;
  const asciiShift = new Array(256).fill(defaultShift);
  const extraShift = new Map();

  for (let i = 0; i < length; i += 1) {
    const token = segment[i];
    const shift = length - i;

    if (token.type === "any_one") {
      defaultShift = Math.min(defaultShift, shift);
      for (let code = 0; code < asciiShift.length; code += 1) {
        asciiShift[code] = Math.min(asciiShift[code], shift);
      }
      for (const [char, currentShift] of extraShift) {
        extraShift.set(char, Math.min(currentShift, shift));
      }
    } else if (token.type === "literal") {
      const code = token.char.charCodeAt(0);
      if (code < 256) {
        asciiShift[code] = Math.min(asciiShift[code], shift);
      } else {
        extraShift.set(token.char, Math.min(extraShift.get(token.char) ?? defaultShift, shift));
      }
    }
  }

  return {
    get(char) {
      if (char === undefined) return defaultShift;
      const code = char.charCodeAt(0);
      if (code < 256) return asciiShift[code];
      return extraShift.get(char) ?? defaultShift;
    }
  };
}

function findSegmentWithSunday(text, segment, startIndex) {
  const m = segmentLength(segment);
  if (m === 0) return startIndex;
  if (m > text.length) return -1;

  const shift = buildWildcardSegmentShift(segment);
  let i = Math.max(0, startIndex);

  while (i <= text.length - m) {
    if (segmentMatchesAt(text, segment, i)) {
      return i;
    }

    if (i + m >= text.length) break;
    i += shift.get(text[i + m]);
  }

  return -1;
}

function splitIntoSegments(tokens) {
  const segments = [];
  let current = [];

  for (const token of tokens) {
    if (token.type === "any_many") {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    } else {
      current.push(token);
    }
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
}

function sundayWildcard(text, pattern) {
  text = String(text);
  const tokens = parseWildcardPattern(pattern);
  if (tokens.length === 0 || tokens.every((token) => token.type === "any_many")) {
    return true;
  }

  const segments = splitIntoSegments(tokens);
  if (segments.length === 0) return true;

  let searchFrom = 0;
  for (const segment of segments) {
    const foundAt = findSegmentWithSunday(text, segment, searchFrom);
    if (foundAt === -1) {
      return false;
    }
    searchFrom = foundAt + segment.length;
  }

  return true;
}

module.exports = {
  sunday,
  sundayWildcard,
  buildSundayShiftTable
};
