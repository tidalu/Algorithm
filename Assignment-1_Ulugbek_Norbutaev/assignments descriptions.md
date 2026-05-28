# Assignments

> **General submission rules**
> - Talk to the instructor about your work before receiving credit
> - Attach project files to an email before your defense
> - Upload your solution to the Moodle course after
> - Use **zip** for compression — skip executables
> - Every completed task must include a **report** (PDF, DOC, ODT, or similar) describing your work, findings, and graphs

---

## Assignment I

> Completing Part One is required to receive a positive mark.

### Part One — mark 3

#### A) "Mom bought me a new computer"

Implement the following pattern matching algorithms:

- Brute-force
- Sunday
- KMP
- FSM
- Rabin-Karp
- Gusfield Z

Compare their running times using chapters of a book, with a small pattern (a few words or a sentence) and a large pattern (a paragraph).

**Report must include:**
- A description of each algorithm
- Your findings
- A graph of running time vs. text length (x-axis = text length, using several different lengths)

Results must be reproducible.

---

#### B) "Wacky Races"

Prove empirically that the following performance relationships can occur:

- Binary Sunday is **at least 2× faster** than Gusfield Z
- KMP is **at least 2× faster** than Rabin-Karp
- Rabin-Karp is **at least 2× faster** than Sunday

For each case, provide a specific pattern `P` and text `T` (T ≥ 100 kB). Results must be reproducible, and the report must explain why each outcome occurs.

---

### Part Two — mark 4

#### "What was that char again?"

Extend the **Brute-force** and **Sunday** algorithms to support wildcards:

| Wildcard | Meaning |
|----------|---------|
| `?` | Matches any single character |
| `*` | Matches any sequence of characters |
| `\` | Escapes `?`, `*`, or `\` itself |

The implementation should return a **boolean** indicating whether a match was found. Explain your extensions in the report.

---

### Part Three — mark 5

#### "Jewish-style carp"

Design a 2D variant of the Rabin-Karp algorithm that checks whether the **top-right K×K corner** of an M×N picture appears anywhere else in the picture.

**Requirements:**
- The "picture" is a 2D array of arbitrary items
- Replace slow modulo-prime operations with **bitwise mask `&` operations**
- Running time must be **at most linear** in the number of pixels in the text

---

## Assignment II

> Completing Part One is required to receive a positive mark.
>
> Include a report with a description of your solution alongside the source code.

### Part One — mark 3

#### A) "Me spell rite"

Implement a spell checker that decides whether each word in a text file is spelled correctly (use the provided English word list).

Implement and compare the following data structures:

| Structure | Notes |
|-----------|-------|
| Naive linear list | For baseline comparison |
| String BBST | e.g. `std::set` or equivalent |
| Trie | Prefix tree |
| Hash map | — |

**Report must include:**
- Description of each approach
- Comparison of dictionary build times and spell-check times
- Graph of running time vs. text length

---

#### B) "Triwizard Tournament"

Given a labyrinth map, the initial positions of three wizards, and their speeds (corridors per minute), determine which wizard reaches the exit first.

**Requirements:**
- Wizards always follow a shortest possible path (guided by their wands)
- **BFS must be used exactly once**

---

#### C) "Aunt's Namesday"

Aunt Petunia is hosting a party and wants to seat guests at **two separate tables** so that no two guests who dislike each other share a table.

Given the guest list and animosity pairs, determine a valid seating arrangement using a **non-recursive DFS** algorithm.

---

### Part Two — mark 4

#### "Full house"

Implement three hash table variants:

1. **Separate chaining**
2. **Open addressing — linear probing**
3. **Open addressing — double hashing**

Compare search and insert times (y-axis) against the load factor (x-axis) for each implementation.

---

### Part Three — mark 5

#### "Fast & Furious: Dictionary Races"

Extend the Part One A) implementations with more advanced variants:

| Original | Advanced variant |
|----------|-----------------|
| Trie | Ordinary trie + ternary prefix tree with balancing + DAT (Double-Array Trie) |
| `std::set` | Red-Black tree |

Graphically compare all dictionary implementations in terms of:
- Build time
- Lookup time
- Memory usage