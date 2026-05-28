"use strict";

function planSeating(guests, dislikes) {
  const adjacency = new Map();
  for (const guest of guests) {
    adjacency.set(guest, []);
  }

  for (const [a, b] of dislikes) {
    if (!adjacency.has(a)) {
      adjacency.set(a, []);
    }
    if (!adjacency.has(b)) {
      adjacency.set(b, []);
    }
    adjacency.get(a).push(b);
    adjacency.get(b).push(a);
  }

  const color = new Map();

  for (const guest of adjacency.keys()) {
    if (color.has(guest)) {
      continue;
    }

    color.set(guest, 0);
    const stack = [guest];

    while (stack.length > 0) {
      const current = stack.pop();
      const currentColor = color.get(current);

      for (const neighbor of adjacency.get(current)) {
        if (!color.has(neighbor)) {
          color.set(neighbor, 1 - currentColor);
          stack.push(neighbor);
        } else if (color.get(neighbor) === currentColor) {
          return {
            possible: false,
            conflict: [current, neighbor],
            tables: null,
            color
          };
        }
      }
    }
  }

  const tables = [[], []];
  for (const guest of adjacency.keys()) {
    tables[color.get(guest)].push(guest);
  }

  return {
    possible: true,
    conflict: null,
    tables,
    color
  };
}

function sampleNamesdayCase() {
  const guests = ["Petunia", "Vernon", "Harry", "Dudley", "Marge", "Arabella", "Lily", "James"];
  const dislikes = [
    ["Petunia", "Harry"],
    ["Vernon", "Harry"],
    ["Dudley", "Harry"],
    ["Marge", "Harry"],
    ["Petunia", "Lily"],
    ["Vernon", "James"],
    ["Marge", "Arabella"]
  ];

  return { guests, dislikes };
}

module.exports = {
  planSeating,
  sampleNamesdayCase
};
