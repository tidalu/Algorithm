# Assignment II

> Completing Part One is required to receive a positive mark.
>
> Include a report with a description of your solution alongside the source code.

---

## Part One — mark 3

### A) "Me spell rite"

The Evil Lord Wladimir has cast the *Spellus Incorrectus* magical spell on your fellow students. Your task is to implement a simple spell checker that decides whether each individual word in a text file is spelled correctly. You may use the English word list available in this directory.

Implement and compare the following data structures:

| Structure | Notes |
|-----------|-------|
| Naive linear list | Baseline comparison |
| String BBST | e.g. `std::set` (ordered) or equivalent |
| Trie | Prefix tree |
| Hash map | — |

**Report must include:**
- Description of each approach
- Comparison of dictionary build times and spell-check times
- Graph of running time vs. text length

---

### B) "Triwizard Tournament"

One competition in the Triwizard Tournament is escaping a labyrinth as quickly as possible. Given the labyrinth map, the initial positions of three competing wizards, and their speeds (in corridors per minute), predict which wizard reaches the exit first.

**Requirements:**
- Wizards always follow a shortest possible path (guided by their magical wands)
- **BFS must be used exactly once**

---

### C) "Aunt's Namesday"

Your beloved aunt Petunia is throwing her namesday party and invites all her friends and family. There are some animosities among the guests, so she wants to seat everyone at **two separate tables** so that no two people who dislike each other share a table.

Given the guest list and the list of animosity pairs, use a **non-recursive DFS** algorithm to determine a valid seating arrangement.

---

## Part Two — mark 4

### "Full house"

Implement three hash table variants:

1. **Separate chaining**
2. **Open addressing — linear probing**
3. **Open addressing — double hashing**

Compare search and insert times (y-axis) against the load factor (x-axis) for each implementation.

---

## Part Three — mark 5

### "Fast & Furious: Dictionary Races"

Extend the Part One A) implementations with more advanced variants:

| Original | Advanced variant |
|----------|-----------------|
| Trie | Ordinary trie + ternary prefix tree (with balancing of your choice) + DAT (Double-Array Trie) |
| `std::set` | Red-Black tree |

Graphically compare all dictionary implementations in terms of:
- Build time
- Lookup time
- Memory usage