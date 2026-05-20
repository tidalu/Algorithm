"use strict";

const MASK = (1 << 31) - 1;
const ROW_BASE = 911382323;
const COL_BASE = 972663749;

function mask(value) {
  return value & MASK;
}

function multiply(a, b) {
  return Math.imul(a, b) & MASK;
}

function encodePicture(picture) {
  const codes = new Map();
  let nextCode = 1;

  return picture.map((row) => row.map((item) => {
    if (!codes.has(item)) {
      codes.set(item, nextCode);
      nextCode += 1;
    }
    return codes.get(item);
  }));
}

function power(base, exponent) {
  let result = 1;
  for (let i = 0; i < exponent; i += 1) {
    result = multiply(result, base);
  }
  return result;
}

function hashSequence(values, base) {
  let hash = 0;
  for (const value of values) {
    hash = mask(multiply(hash, base) + value);
  }
  return hash;
}

function computeHorizontalHashes(encodedPicture, K) {
  const rowCount = encodedPicture.length;
  const colCount = encodedPicture[0].length;
  const windowCount = colCount - K + 1;
  const basePower = power(ROW_BASE, K - 1);
  const hashes = Array.from({ length: rowCount }, () => new Array(windowCount).fill(0));

  for (let row = 0; row < rowCount; row += 1) {
    let hash = hashSequence(encodedPicture[row].slice(0, K), ROW_BASE);
    hashes[row][0] = hash;

    for (let col = 1; col < windowCount; col += 1) {
      const outgoing = multiply(encodedPicture[row][col - 1], basePower);
      const incoming = encodedPicture[row][col + K - 1];
      hash = mask(multiply(mask(hash - outgoing), ROW_BASE) + incoming);
      hashes[row][col] = hash;
    }
  }

  return hashes;
}

function windowsAreEqual(picture, patternStartCol, row, col, K) {
  for (let r = 0; r < K; r += 1) {
    for (let c = 0; c < K; c += 1) {
      if (!Object.is(picture[r][patternStartCol + c], picture[row + r][col + c])) {
        return false;
      }
    }
  }
  return true;
}

function validatePicture(picture, K) {
  if (!Array.isArray(picture) || picture.length === 0 || !Array.isArray(picture[0])) {
    return false;
  }

  const colCount = picture[0].length;
  if (!Number.isInteger(K) || K <= 0 || K > picture.length || K > colCount) {
    return false;
  }

  return picture.every((row) => Array.isArray(row) && row.length === colCount);
}

function rabinKarp2D(picture, K) {
  if (!validatePicture(picture, K)) {
    return { found: false, position: null };
  }

  const rowCount = picture.length;
  const colCount = picture[0].length;
  const patternCol = colCount - K;
  const encodedPicture = encodePicture(picture);
  const horizontalHashes = computeHorizontalHashes(encodedPicture, K);
  const patternRowHashes = horizontalHashes.slice(0, K).map((row) => row[patternCol]);
  const patternHash = hashSequence(patternRowHashes, COL_BASE);
  const verticalPower = power(COL_BASE, K - 1);

  for (let col = 0; col <= colCount - K; col += 1) {
    let windowHash = hashSequence(
      horizontalHashes.slice(0, K).map((row) => row[col]),
      COL_BASE
    );

    for (let row = 0; row <= rowCount - K; row += 1) {
      const isOriginalTopRightCorner = row === 0 && col === patternCol;
      if (!isOriginalTopRightCorner && windowHash === patternHash) {
        if (windowsAreEqual(picture, patternCol, row, col, K)) {
          return { found: true, position: { row, col } };
        }
      }

      if (row < rowCount - K) {
        const outgoing = multiply(horizontalHashes[row][col], verticalPower);
        const incoming = horizontalHashes[row + K][col];
        windowHash = mask(multiply(mask(windowHash - outgoing), COL_BASE) + incoming);
      }
    }
  }

  return { found: false, position: null };
}

module.exports = {
  rabinKarp2D,
  MASK
};
