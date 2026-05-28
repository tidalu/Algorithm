"use strict";

function parseLabyrinth(labyrinth) {
  const grid = labyrinth.map((row) => Array.from(row));
  let exit = null;

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === "E") {
        exit = { row, col };
      }
    }
  }

  if (!exit) {
    throw new Error("Labyrinth must contain an exit marked with E");
  }

  return { grid, exit };
}

function isOpen(grid, row, col) {
  return (
    row >= 0 &&
    row < grid.length &&
    col >= 0 &&
    col < grid[row].length &&
    grid[row][col] !== "#"
  );
}

function bfsDistancesFromExit(labyrinth) {
  const { grid, exit } = parseLabyrinth(labyrinth);
  const distances = grid.map((row) => row.map(() => Infinity));
  const queue = [exit];
  let head = 0;
  distances[exit.row][exit.col] = 0;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;

    const nextCells = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 }
    ];

    for (const next of nextCells) {
      if (!isOpen(grid, next.row, next.col)) {
        continue;
      }
      if (distances[next.row][next.col] !== Infinity) {
        continue;
      }
      distances[next.row][next.col] = distances[current.row][current.col] + 1;
      queue.push(next);
    }
  }

  return { grid, exit, distances };
}

function predictTriwizardWinner(labyrinth, wizards) {
  const { exit, distances } = bfsDistancesFromExit(labyrinth);

  const competitors = wizards.map((wizard) => {
    const distance = distances[wizard.row]?.[wizard.col] ?? Infinity;
    const minutes = distance === Infinity ? Infinity : distance / wizard.speed;
    return {
      name: wizard.name,
      row: wizard.row,
      col: wizard.col,
      speed: wizard.speed,
      distance,
      minutes
    };
  });

  const ranked = competitors
    .slice()
    .sort((a, b) => a.minutes - b.minutes || a.name.localeCompare(b.name));
  const bestTime = ranked[0]?.minutes ?? Infinity;
  const winners = ranked.filter((wizard) => wizard.minutes === bestTime);

  return {
    exit,
    competitors: ranked,
    winner: winners.length === 1 ? winners[0] : null,
    winners,
    distances
  };
}

function sampleTriwizardCase() {
  const labyrinth = [
    "#########",
    "#A..#..E#",
    "#.#.#.#.#",
    "#.#...#.#",
    "#...#...#",
    "#########"
  ];

  const wizards = [
    { name: "Cedric", row: 1, col: 1, speed: 3 },
    { name: "Fleur", row: 4, col: 1, speed: 2 },
    { name: "Krum", row: 4, col: 7, speed: 1 }
  ];

  return { labyrinth, wizards };
}

module.exports = {
  bfsDistancesFromExit,
  predictTriwizardWinner,
  sampleTriwizardCase
};
