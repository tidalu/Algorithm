"use strict";

function sliceByApproximateByteLength(text, targetBytes) {
  if (targetBytes <= 0) return "";
  if (Buffer.byteLength(text, "utf8") <= targetBytes) return text;

  let low = 0;
  let high = Math.min(text.length, targetBytes);

  while (high < text.length && Buffer.byteLength(text.slice(0, high), "utf8") < targetBytes) {
    low = high;
    high = Math.min(text.length, high * 2);
  }

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const bytes = Buffer.byteLength(text.slice(0, mid), "utf8");
    if (bytes <= targetBytes) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return text.slice(0, low);
}

function getSlices(text, sizes) {
  if (!Array.isArray(sizes)) {
    throw new Error("sizes must be an array of byte lengths.");
  }

  return sizes.map((size) => ({
    size,
    slice: sliceByApproximateByteLength(String(text), size)
  }));
}

module.exports = {
  getSlices
};
