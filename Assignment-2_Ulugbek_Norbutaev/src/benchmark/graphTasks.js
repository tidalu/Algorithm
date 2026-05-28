"use strict";

const fs = require("fs");
const path = require("path");

const { planSeating, sampleNamesdayCase } = require("../algorithms/auntNamesday");
const { predictTriwizardWinner, sampleTriwizardCase } = require("../algorithms/triwizard");
const { assignmentRoot } = require("../utils/text");

const RESULT_PATH = assignmentRoot("output", "graph_task_results.json");

async function runGraphTaskExamples() {
  const triwizardInput = sampleTriwizardCase();
  const triwizard = predictTriwizardWinner(triwizardInput.labyrinth, triwizardInput.wizards);

  const namesdayInput = sampleNamesdayCase();
  const namesday = planSeating(namesdayInput.guests, namesdayInput.dislikes);

  const result = {
    generatedAt: new Date().toISOString(),
    triwizard: {
      input: triwizardInput,
      exit: triwizard.exit,
      competitors: triwizard.competitors,
      winner: triwizard.winner,
      winners: triwizard.winners
    },
    namesday: {
      input: namesdayInput,
      possible: namesday.possible,
      conflict: namesday.conflict,
      tables: namesday.tables
    }
  };

  fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
  fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2));

  console.log("\nTriwizard ranking:");
  console.table(
    triwizard.competitors.map((wizard) => ({
      Wizard: wizard.name,
      Distance: wizard.distance,
      Speed: wizard.speed,
      Minutes: wizard.minutes === Infinity ? "unreachable" : wizard.minutes.toFixed(2)
    }))
  );

  console.log("\nNamesday seating:");
  if (namesday.possible) {
    console.table([
      { Table: 1, Guests: namesday.tables[0].join(", ") },
      { Table: 2, Guests: namesday.tables[1].join(", ") }
    ]);
  } else {
    console.log(`No valid seating because of conflict: ${namesday.conflict.join(" - ")}`);
  }

  return result;
}

if (require.main === module) {
  runGraphTaskExamples().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  RESULT_PATH,
  runGraphTaskExamples
};
