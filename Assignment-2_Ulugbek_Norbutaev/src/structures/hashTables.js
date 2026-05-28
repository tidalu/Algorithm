"use strict";

function hashString(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashString2(value) {
  let hash = 5381;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash, 33) ^ text.charCodeAt(i);
  }
  return hash >>> 0;
}

class SeparateChainingHashTable {
  constructor(capacity = 1024) {
    this.name = "Separate Chaining";
    this.capacity = capacity;
    this.buckets = Array.from({ length: capacity }, () => []);
    this.size = 0;
  }

  insert(key, value = true) {
    const index = hashString(key) % this.capacity;
    const bucket = this.buckets[index];
    for (const entry of bucket) {
      if (entry.key === key) {
        entry.value = value;
        return;
      }
    }
    bucket.push({ key, value });
    this.size += 1;
  }

  search(key) {
    const index = hashString(key) % this.capacity;
    const bucket = this.buckets[index];
    for (const entry of bucket) {
      if (entry.key === key) {
        return entry.value;
      }
    }
    return undefined;
  }
}

class LinearProbingHashTable {
  constructor(capacity = 1024) {
    this.name = "Linear Probing";
    this.capacity = capacity;
    this.table = new Array(capacity);
    this.size = 0;
  }

  insert(key, value = true) {
    let index = hashString(key) % this.capacity;
    for (let probe = 0; probe < this.capacity; probe += 1) {
      const entry = this.table[index];
      if (!entry) {
        this.table[index] = { key, value };
        this.size += 1;
        return;
      }
      if (entry.key === key) {
        entry.value = value;
        return;
      }
      index = (index + 1) % this.capacity;
    }
    throw new Error("Linear probing table is full");
  }

  search(key) {
    let index = hashString(key) % this.capacity;
    for (let probe = 0; probe < this.capacity; probe += 1) {
      const entry = this.table[index];
      if (!entry) {
        return undefined;
      }
      if (entry.key === key) {
        return entry.value;
      }
      index = (index + 1) % this.capacity;
    }
    return undefined;
  }
}

class DoubleHashingHashTable {
  constructor(capacity = 1024) {
    this.name = "Double Hashing";
    this.capacity = capacity;
    this.table = new Array(capacity);
    this.size = 0;
  }

  step(key) {
    return 1 + (hashString2(key) % (this.capacity - 1));
  }

  insert(key, value = true) {
    const start = hashString(key) % this.capacity;
    const step = this.step(key);

    for (let probe = 0; probe < this.capacity; probe += 1) {
      const index = (start + probe * step) % this.capacity;
      const entry = this.table[index];
      if (!entry) {
        this.table[index] = { key, value };
        this.size += 1;
        return;
      }
      if (entry.key === key) {
        entry.value = value;
        return;
      }
    }
    throw new Error("Double hashing table is full");
  }

  search(key) {
    const start = hashString(key) % this.capacity;
    const step = this.step(key);

    for (let probe = 0; probe < this.capacity; probe += 1) {
      const index = (start + probe * step) % this.capacity;
      const entry = this.table[index];
      if (!entry) {
        return undefined;
      }
      if (entry.key === key) {
        return entry.value;
      }
    }
    return undefined;
  }
}

module.exports = {
  DoubleHashingHashTable,
  LinearProbingHashTable,
  SeparateChainingHashTable,
  hashString,
  hashString2
};
