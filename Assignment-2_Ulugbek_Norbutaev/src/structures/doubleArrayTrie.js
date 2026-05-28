"use strict";

const { TrieNode } = require("./trieDictionary");

function buildCharacterMap(words) {
  const chars = new Set();
  for (const word of words) {
    for (const char of word) {
      chars.add(char);
    }
  }
  return new Map(Array.from(chars).sort().map((char, index) => [char, index + 1]));
}

class DoubleArrayTrie {
  constructor(words = []) {
    this.name = "Double-Array Trie";
    this.base = [];
    this.check = [];
    this.terminal = [];
    this.charCode = new Map();
    this.nextBaseCandidate = 1;
    this.usedSlots = 0;
    this.size = 0;
    if (words.length > 0) {
      this.build(words);
    }
  }

  build(words) {
    const uniqueWords = Array.from(new Set(words));
    this.charCode = buildCharacterMap(uniqueWords);
    this.base = [];
    this.check = [];
    this.terminal = [];
    this.nextBaseCandidate = 1;
    this.usedSlots = 1;
    this.size = uniqueWords.length;

    const root = new TrieNode();
    for (const word of uniqueWords) {
      let node = root;
      for (const char of word) {
        let child = node.children.get(char);
        if (!child) {
          child = new TrieNode();
          node.children.set(char, child);
        }
        node = child;
      }
      node.terminal = true;
    }

    this.check[1] = 0;
    this.terminal[1] = false;
    this.placeNode(root, 1);
    return this;
  }

  findBase(codes) {
    let base = this.nextBaseCandidate;

    search:
    while (true) {
      for (const code of codes) {
        const index = base + code;
        if (this.check[index] !== undefined) {
          base += 1;
          continue search;
        }
      }
      this.nextBaseCandidate = base;
      return base;
    }
  }

  placeNode(node, index) {
    const entries = Array.from(node.children.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) {
      this.base[index] = 0;
      return;
    }

    const codes = entries.map(([char]) => this.charCode.get(char));
    const base = this.findBase(codes);
    this.base[index] = base;

    for (const [char, child] of entries) {
      const childIndex = base + this.charCode.get(char);
      this.check[childIndex] = index;
      this.terminal[childIndex] = child.terminal;
      this.usedSlots += 1;
    }

    for (const [char, child] of entries) {
      const childIndex = base + this.charCode.get(char);
      this.placeNode(child, childIndex);
    }
  }

  has(word) {
    let index = 1;
    for (const char of word) {
      const code = this.charCode.get(char);
      if (!code) {
        return false;
      }
      const next = this.base[index] + code;
      if (this.check[next] !== index) {
        return false;
      }
      index = next;
    }
    return this.terminal[index] === true;
  }

  estimateMemoryBytes() {
    return this.base.length * 8 + this.check.length * 8 + this.terminal.length;
  }
}

module.exports = {
  DoubleArrayTrie
};
