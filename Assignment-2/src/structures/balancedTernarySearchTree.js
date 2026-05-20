"use strict";

class TSTNode {
  constructor(char) {
    this.char = char;
    this.left = null;
    this.equal = null;
    this.right = null;
    this.terminal = false;
  }
}

function insertMedianOrder(tree, words, left, right) {
  if (left > right) {
    return;
  }
  const middle = Math.floor((left + right) / 2);
  tree.insert(words[middle]);
  insertMedianOrder(tree, words, left, middle - 1);
  insertMedianOrder(tree, words, middle + 1, right);
}

class BalancedTernarySearchTree {
  constructor(words = []) {
    this.name = "Balanced Ternary Trie";
    this.root = null;
    this.nodes = 0;
    this.size = 0;
    if (words.length > 0) {
      this.build(words);
    }
  }

  build(words) {
    const sorted = Array.from(new Set(words)).sort();
    this.root = null;
    this.nodes = 0;
    this.size = 0;
    insertMedianOrder(this, sorted, 0, sorted.length - 1);
    return this;
  }

  insert(word) {
    if (!word) {
      return;
    }
    const before = this.size;
    this.root = this.insertAt(this.root, word, 0);
    if (this.size === before) {
      return;
    }
  }

  insertAt(node, word, index) {
    const char = word[index];
    let current = node;
    if (!current) {
      current = new TSTNode(char);
      this.nodes += 1;
    }

    if (char < current.char) {
      current.left = this.insertAt(current.left, word, index);
    } else if (char > current.char) {
      current.right = this.insertAt(current.right, word, index);
    } else if (index + 1 === word.length) {
      if (!current.terminal) {
        current.terminal = true;
        this.size += 1;
      }
    } else {
      current.equal = this.insertAt(current.equal, word, index + 1);
    }

    return current;
  }

  has(word) {
    if (!word) {
      return false;
    }
    let node = this.root;
    let index = 0;

    while (node) {
      const char = word[index];
      if (char < node.char) {
        node = node.left;
      } else if (char > node.char) {
        node = node.right;
      } else if (index + 1 === word.length) {
        return node.terminal;
      } else {
        index += 1;
        node = node.equal;
      }
    }

    return false;
  }

  estimateMemoryBytes() {
    return this.nodes * 56;
  }
}

module.exports = {
  BalancedTernarySearchTree
};
