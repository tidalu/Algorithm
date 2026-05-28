"use strict";

function allIndicesForEmptyPattern(text) {
  return Array.from({ length: text.length + 1 }, (_, index) => index);
}

function bruteForce(text, pattern) {
  text = String(text);
  pattern = String(pattern);

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return allIndicesForEmptyPattern(text);
  if (m > n) return [];

  const matches = [];
  for (let i = 0; i <= n - m; i += 1) {
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) {
      j += 1;
    }
    if (j === m) {
      matches.push(i);
    }
  }
  return matches;
}

function pushWildcardToken(tokens, token) {
  if (token.type === "any_many" && tokens[tokens.length - 1]?.type === "any_many") {
    return;
  }
  tokens.push(token);
}

function parseWildcardPattern(pattern) {
  pattern = String(pattern);
  const tokens = [];

  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];

    if (char === "\\") {
      const next = pattern[i + 1];
      if (next === "?" || next === "*" || next === "\\") {
        tokens.push({ type: "literal", char: next });
        i += 1;
      } else if (next !== undefined) {
        tokens.push({ type: "literal", char: next });
        i += 1;
      } else {
        tokens.push({ type: "literal", char: "\\" });
      }
      continue;
    }

    if (char === "?") {
      tokens.push({ type: "any_one" });
    } else if (char === "*") {
      pushWildcardToken(tokens, { type: "any_many" });
    } else {
      tokens.push({ type: "literal", char });
    }
  }

  return tokens;
}

function tokenMatchesChar(token, char) {
  return token.type === "any_one" || (token.type === "literal" && token.char === char);
}

function wildcardMatchesSubstring(text, tokens) {
  if (tokens.length === 0) return true;

  const wrapped = [{ type: "any_many" }, ...tokens, { type: "any_many" }];
  let textIndex = 0;
  let tokenIndex = 0;
  let lastStarIndex = -1;
  let textIndexAtLastStar = 0;

  while (textIndex < text.length) {
    const token = wrapped[tokenIndex];

    if (token && token.type !== "any_many" && tokenMatchesChar(token, text[textIndex])) {
      textIndex += 1;
      tokenIndex += 1;
    } else if (token && token.type === "any_many") {
      lastStarIndex = tokenIndex;
      textIndexAtLastStar = textIndex;
      tokenIndex += 1;
    } else if (lastStarIndex !== -1) {
      tokenIndex = lastStarIndex + 1;
      textIndexAtLastStar += 1;
      textIndex = textIndexAtLastStar;
    } else {
      return false;
    }
  }

  while (tokenIndex < wrapped.length && wrapped[tokenIndex].type === "any_many") {
    tokenIndex += 1;
  }

  return tokenIndex === wrapped.length;
}

function bruteForceWildcard(text, pattern) {
  text = String(text);
  const tokens = parseWildcardPattern(pattern);
  return wildcardMatchesSubstring(text, tokens);
}

module.exports = {
  bruteForce,
  bruteForceWildcard,
  parseWildcardPattern,
  tokenMatchesChar
};
