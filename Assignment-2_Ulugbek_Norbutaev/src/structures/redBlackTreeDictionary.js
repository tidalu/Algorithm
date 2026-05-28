"use strict";

const RED = true;
const BLACK = false;

class RBNode {
  constructor(word) {
    this.word = word;
    this.color = RED;
    this.left = null;
    this.right = null;
    this.parent = null;
  }
}

class RedBlackTreeDictionary {
  constructor(words = []) {
    this.name = "Red-Black Tree";
    this.root = null;
    this.size = 0;
    this.charCount = 0;
    if (words.length > 0) {
      this.build(words);
    }
  }

  build(words) {
    this.root = null;
    this.size = 0;
    this.charCount = 0;
    for (const word of words) {
      this.insert(word);
    }
    return this;
  }

  rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left) {
      y.left.parent = x;
    }
    y.parent = x.parent;
    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }
    y.left = x;
    x.parent = y;
  }

  rotateRight(x) {
    const y = x.left;
    x.left = y.right;
    if (y.right) {
      y.right.parent = x;
    }
    y.parent = x.parent;
    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.right) {
      x.parent.right = y;
    } else {
      x.parent.left = y;
    }
    y.right = x;
    x.parent = y;
  }

  insert(word) {
    let parent = null;
    let node = this.root;

    while (node) {
      parent = node;
      if (word === node.word) {
        return;
      }
      node = word < node.word ? node.left : node.right;
    }

    const inserted = new RBNode(word);
    inserted.parent = parent;
    if (!parent) {
      this.root = inserted;
    } else if (word < parent.word) {
      parent.left = inserted;
    } else {
      parent.right = inserted;
    }

    this.size += 1;
    this.charCount += word.length;
    this.fixInsert(inserted);
  }

  fixInsert(node) {
    let current = node;

    while (current.parent && current.parent.color === RED) {
      const parent = current.parent;
      const grandparent = parent.parent;

      if (parent === grandparent.left) {
        const uncle = grandparent.right;
        if (uncle && uncle.color === RED) {
          parent.color = BLACK;
          uncle.color = BLACK;
          grandparent.color = RED;
          current = grandparent;
        } else {
          if (current === parent.right) {
            current = parent;
            this.rotateLeft(current);
          }
          current.parent.color = BLACK;
          current.parent.parent.color = RED;
          this.rotateRight(current.parent.parent);
        }
      } else {
        const uncle = grandparent.left;
        if (uncle && uncle.color === RED) {
          parent.color = BLACK;
          uncle.color = BLACK;
          grandparent.color = RED;
          current = grandparent;
        } else {
          if (current === parent.left) {
            current = parent;
            this.rotateRight(current);
          }
          current.parent.color = BLACK;
          current.parent.parent.color = RED;
          this.rotateLeft(current.parent.parent);
        }
      }
    }

    this.root.color = BLACK;
  }

  has(word) {
    let node = this.root;
    while (node) {
      if (word === node.word) {
        return true;
      }
      node = word < node.word ? node.left : node.right;
    }
    return false;
  }

  estimateMemoryBytes() {
    return this.size * 64 + this.charCount * 2;
  }
}

module.exports = {
  RedBlackTreeDictionary
};
