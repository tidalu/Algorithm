"use strict";

class TrieNode {
  constructor() {
    this.children = new Map();
    this.terminal = false;
  }
}

class TrieDictionary {
  constructor(words = []) {
    this.name = "Ordinary Trie";
    this.root = new TrieNode();
    this.nodes = 1;
    this.edges = 0;
    this.size = 0;
    if (words.length > 0) {
      this.build(words);
    }
  }

  build(words) {
    this.root = new TrieNode();
    this.nodes = 1;
    this.edges = 0;
    this.size = 0;
    for (const word of words) {
      this.insert(word);
    }
    return this;
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      let child = node.children.get(char);
      if (!child) {
        child = new TrieNode();
        node.children.set(char, child);
        this.nodes += 1;
        this.edges += 1;
      }
      node = child;
    }

    if (!node.terminal) {
      node.terminal = true;
      this.size += 1;
    }
  }

  has(word) {
    let node = this.root;
    for (const char of word) {
      node = node.children.get(char);
      if (!node) {
        return false;
      }
    }
    return node.terminal;
  }

  estimateMemoryBytes() {
    return this.nodes * 48 + this.edges * 24;
  }
}

module.exports = {
  TrieDictionary,
  TrieNode
};
