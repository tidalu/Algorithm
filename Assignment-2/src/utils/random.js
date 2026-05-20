"use strict";

function createLCG(seed = 123456789) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateKeys(count, prefix = "key") {
  const random = createLCG(987654321);
  const keys = [];
  for (let i = 0; i < count; i += 1) {
    const noise = Math.floor(random() * 0xffffffff).toString(36);
    keys.push(`${prefix}_${i}_${noise}`);
  }
  return keys;
}

module.exports = {
  createLCG,
  generateKeys
};
