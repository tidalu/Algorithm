# Algorithm Assignments

Node.js implementations for two university algorithm assignments. Each assignment is self-contained and can generate benchmark outputs, PNG charts, and a PDF report.

## Assignments

| Folder | Topic | Report |
|---|---|---|
| [`Assignment-1`](./Assignment-1) | Pattern matching algorithms, wildcard matching, and 2D Rabin-Karp | [`Assignment-1/output/report.pdf`](./Assignment-1/output/report.pdf) |
| [`Assignment-2`](./Assignment-2) | Dictionaries, graph tasks, and hash tables | [`Assignment-2/output/report.pdf`](./Assignment-2/output/report.pdf) |

The `_Ulugbek_Norbutaev` folders are submission-named copies of the same projects.

## Quick Start

Run Assignment 1:

```bash
cd Assignment-1
npm install
npm run start
```

Run Assignment 2:

```bash
cd Assignment-2
npm install
npm run start
```

Each command writes JSON results, chart images, and `output/report.pdf` inside that assignment folder.

## Documentation

Assignment 1:

- [Description](./Assignment-1/assignments%20descriptions.md)
- [Explanation](./Assignment-1/EXPLANATION.md)
- [Walkthrough](./Assignment-1/WALKTHROUGH.md)
- [Project README](./Assignment-1/README.md)

Assignment 2:

- [Description](./Assignment-2/assignments%20descriptions.md)
- [Explanation](./Assignment-2/EXPLANATION.md)
- [Walkthrough](./Assignment-2/WALKTHROUGH.md)
- [Project README](./Assignment-2/README.md)

## Outputs

Generated artifacts are stored under each assignment's `output/` directory:

- `*.json` benchmark and task results
- `output/charts/*.png` chart images
- `output/report.pdf` final single-page PDF report

`node_modules/` is intentionally ignored inside assignment folders.
