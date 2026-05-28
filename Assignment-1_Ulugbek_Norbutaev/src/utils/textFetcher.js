"use strict";

const fs = require("fs");
const path = require("path");

const GUTENBERG_URL = "https://www.gutenberg.org/files/2701/2701-0.txt";
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const MOBY_DICK_PATH = path.join(DATA_DIR, "mobydick.txt");

async function downloadText() {
  let fetch;
  try {
    fetch = require("node-fetch");
  } catch (error) {
    throw new Error("node-fetch is not installed. Run npm install before downloading Moby Dick.");
  }

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const response = await fetch(GUTENBERG_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    fs.writeFileSync(MOBY_DICK_PATH, text, "utf8");
    return text;
  } catch (error) {
    throw new Error(`Failed to download Moby Dick from Project Gutenberg: ${error.message}`);
  }
}

async function getText() {
  try {
    if (fs.existsSync(MOBY_DICK_PATH)) {
      return fs.readFileSync(MOBY_DICK_PATH, "utf8");
    }
    return await downloadText();
  } catch (error) {
    throw new Error(`Could not read or fetch text: ${error.message}`);
  }
}

async function getChapter(n) {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("Chapter number must be a positive integer.");
  }

  const text = await getText();
  const chapterMatches = [...text.matchAll(/(^|\r?\n)(CHAPTER\s+[^\r\n]+)/gi)];

  if (chapterMatches.length === 0) {
    return text;
  }

  const chapterIndex = n - 1;
  if (chapterIndex >= chapterMatches.length) {
    throw new Error(`Chapter ${n} was not found. Only ${chapterMatches.length} chapter headings were detected.`);
  }

  const start = chapterMatches[chapterIndex].index + chapterMatches[chapterIndex][1].length;
  const end = chapterIndex + 1 < chapterMatches.length
    ? chapterMatches[chapterIndex + 1].index
    : text.length;

  return text.slice(start, end).trim();
}

module.exports = {
  getText,
  getChapter,
  MOBY_DICK_PATH,
  GUTENBERG_URL
};
