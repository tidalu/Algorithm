"use strict";

function estimateWordsBytes(words) {
  return words.reduce((sum, word) => sum + word.length * 2, 0);
}

class LinearDictionary {
  constructor(words = []) {
    this.name = "Linear List";
    this.words = [];
    if (words.length > 0) {
      this.build(words);
    }
  }

  build(words) {
    this.words = words.slice();
    return this;
  }

  has(word) {
    for (let i = 0; i < this.words.length; i += 1) {
      if (this.words[i] === word) {
        return true;
      }
    }
    return false;
  }

  estimateMemoryBytes() {
    return this.words.length * 8 + estimateWordsBytes(this.words);
  }
}

module.exports = {
  LinearDictionary,
  estimateWordsBytes
};
