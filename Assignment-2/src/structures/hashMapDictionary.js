"use strict";

const { estimateWordsBytes } = require("./linearDictionary");

class HashMapDictionary {
  constructor(words = []) {
    this.name = "Hash Map";
    this.map = new Map();
    this.words = [];
    if (words.length > 0) {
      this.build(words);
    }
  }

  build(words) {
    this.map = new Map();
    this.words = words.slice();
    for (const word of words) {
      this.map.set(word, true);
    }
    return this;
  }

  has(word) {
    return this.map.has(word);
  }

  estimateMemoryBytes() {
    return this.map.size * 48 + estimateWordsBytes(this.words);
  }
}

module.exports = {
  HashMapDictionary
};
