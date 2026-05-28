# Assignment II: Dictionaries, Graphs, and Hash Tables

This file is written for defense preparation. It explains the algorithms used in the source code, why they solve the assignment tasks, and what time and space complexity to expect.

## 1. Project Scope

Assignment II has five algorithmic parts in this implementation:

- Part 1A: spell checking with a linear list, a red-black tree, an ordinary trie, and a hash map.
- Part 1B: Triwizard Tournament shortest-path prediction using BFS exactly once.
- Part 1C: Aunt's Namesday seating using non-recursive DFS.
- Part 2: three hash tables: separate chaining, linear probing, and double hashing.
- Part 3: dictionary races with ordinary trie, balanced ternary trie, double-array trie, and red-black tree.

The implementation is dependency-free Node.js. Run everything with:

```bash
node run.js
```

The pipeline writes benchmark JSON files, SVG charts, and a report into `output/`.

## 2. Part 1A: Spell Checking

The spell-checking problem is:

Given a dictionary `D` and a text file, decide for every word in the text whether it appears in `D`.

The project normalizes words to lowercase and tokenizes text with a word-oriented regular expression. Punctuation is not considered part of a word. For example:

```text
"Algorithm," -> "algorithm"
"WIZARD"     -> "wizard"
```

The benchmark builds each dictionary structure from `english_words.txt`, then checks generated text of increasing length. The generated text is deterministic, so benchmark results are reproducible.

### Correctness idea

Every dictionary structure implements the same operation:

```js
dictionary.has(word) -> boolean
```

The spell checker is therefore simple:

```text
for each token in text:
  if dictionary.has(token):
    count it as correct
  else:
    count it as misspelled
```

The difference between algorithms is not the answer. The difference is how much work is needed to answer `has(word)`.

## 3. Linear List Dictionary

### Core idea

The linear list stores dictionary words in an array:

```text
["a", "aah", "aahed", ...]
```

To check a word, scan the array from left to right until the word is found or the end is reached.

### Trace

Dictionary:

```text
["apple", "banana", "dragon", "wizard"]
```

Lookup:

```text
word = "dragon"

apple  != dragon
banana != dragon
dragon == dragon -> found
```

Lookup for `"spell"` scans all four entries and fails.

### Complexity

Let:

```text
d = number of dictionary words
k = length of the lookup word
```

Build time:

```text
O(d)
```

Lookup time:

```text
O(d * k)
```

In practice the string comparison often stops early, but the worst case still scans the whole dictionary.

Space:

```text
O(d)
```

### Expected benchmark behavior

The linear list is usually the fastest to build because building is just copying an array. It is usually the slowest to check text, because every misspelled word requires scanning the entire list.

## 4. Red-Black Tree Dictionary

### Core idea

A red-black tree is a self-balancing binary search tree. Every node stores one word, and left/right children obey the ordering rule:

```text
left subtree  < node.word < right subtree
```

The color rules keep the tree height logarithmic:

- every node is red or black
- the root is black
- red nodes cannot have red children
- every path from a node to a null leaf has the same number of black nodes

The code inserts words one by one and uses rotations plus recoloring to repair the tree.

### Lookup trace

Suppose the root is `"mango"` and we search for `"dragon"`:

```text
dragon < mango -> go left
dragon > banana -> go right
dragon == dragon -> found
```

At each step, about half of the remaining ordered search space is discarded.

### Complexity

Build time:

```text
O(d log d)
```

Lookup time:

```text
O(log d * k)
```

Space:

```text
O(d)
```

The implementation uses a custom red-black tree instead of `std::set`, because the assignment's extra part asks to use an RB tree.

### Expected benchmark behavior

The red-black tree builds slower than the linear list and hash map, but lookup is much better than linear scan. It is usually slower than a hash map for exact word lookup because each tree step performs string comparisons.

## 5. Hash Map Dictionary

### Core idea

A hash map computes a hash code for a word and uses that code to find a bucket or table position.

Conceptually:

```text
hash("dragon") -> 937120
index = hash % tableSize
```

This project uses JavaScript's built-in `Map` for the spell-checking hash map. Part 2 contains the custom hash-table implementations.

### Complexity

Expected build time:

```text
O(d)
```

Expected lookup time:

```text
O(k)
```

The `k` appears because the word still has to be hashed or compared.

Worst-case lookup can be worse if many keys collide, but real hash maps are designed to make that rare.

Space:

```text
O(d)
```

### Expected benchmark behavior

The hash map is expected to be one of the fastest lookup structures. It trades extra table overhead for very fast membership checks.

## 6. Ordinary Trie

### Core idea

A trie stores words by characters. Each edge is a character, and a terminal marker means "a word ends here".

Dictionary:

```text
car
cat
dog
```

Trie shape:

```text
root
  c
    a
      r*
      t*
  d
    o
      g*
```

The `*` marks terminal nodes.

### Lookup trace

Lookup `"cat"`:

```text
root -> c -> a -> t
t is terminal -> found
```

Lookup `"cab"`:

```text
root -> c -> a
there is no b child -> not found
```

### Complexity

Build time:

```text
O(total dictionary characters)
```

Lookup time:

```text
O(k)
```

Space:

```text
O(number of trie nodes)
```

The number of nodes can be much smaller than the total characters if many words share prefixes, but each node has child-map overhead.

### Expected benchmark behavior

The ordinary trie lookup time depends mainly on word length, not dictionary size. It can use more memory than a hash map or double-array trie because each node owns a map of children.

## 7. Balanced Ternary Prefix Tree

### Core idea

A ternary search tree stores one character per node and has three pointers:

```text
left   -> characters smaller than node.char
equal  -> next character in the word
right  -> characters larger than node.char
```

For example, at a node containing `"m"`:

```text
search char < m -> left
search char = m -> equal
search char > m -> right
```

This combines trie-like character progress with binary-search-tree-like branching.

### Balancing choice

The assignment allows balancing "of your choice". This implementation sorts the unique dictionary words and inserts them in median order. That keeps the horizontal left/right structure much less skewed than inserting already sorted words from the file.

This is a practical static-dictionary balancing strategy. It is especially reasonable here because the dictionary is built once, then used for many lookups.

### Complexity

Lookup is roughly:

```text
O(k * h)
```

where `h` is the height of the character-comparison tree at each level. With balanced horizontal branching, `h` is small.

Space:

```text
O(number of character nodes)
```

### Expected benchmark behavior

The balanced ternary trie usually uses less memory than an ordinary trie because every node has fixed pointers instead of a map. Lookup is usually fast, though it may do several character comparisons at one word position.

## 8. Double-Array Trie

### Core idea

A double-array trie represents trie transitions using two arrays:

```text
base[state]
check[nextState]
```

For a transition by character code `c`:

```text
nextState = base[state] + c
```

The transition is valid only if:

```text
check[nextState] == state
```

Terminal states are stored in a separate Boolean array.

### Why it is compact

An ordinary trie node stores a map of child characters. A double-array trie replaces those maps with array positions. That can save memory and improve cache locality, at the cost of more expensive construction.

### Lookup trace

For word `"cat"`:

```text
state = root
state = base[state] + code(c), require check[state] == root
state = base[state] + code(a), require check[state] == previous
state = base[state] + code(t), require check[state] == previous
terminal[state] must be true
```

### Complexity

Lookup time:

```text
O(k)
```

Build time is higher than an ordinary trie because the builder must find non-conflicting `base` values for child groups.

Space:

```text
O(array length)
```

### Expected benchmark behavior

The double-array trie often gives excellent lookup time and relatively low estimated memory. Its build step is expected to be slower than the simpler structures.

## 9. Part 1B: Triwizard Tournament

The problem:

Given a labyrinth, three starting positions, their speeds, and one exit, predict who reaches the exit first. The wands guide the wizards along shortest paths.

### Why BFS from the exit

If we run BFS separately from each wizard, that would be three BFS runs. The assignment says BFS should be used exactly once.

Instead, run one BFS from the exit. In an unweighted grid, BFS computes the shortest corridor distance from the exit to every reachable cell. Because grid paths are reversible, this is also the shortest distance from every wizard to the exit.

### Algorithm

```text
distance[exit] = 0
queue = [exit]

while queue is not empty:
  current = queue.pop_front()
  for each open neighbor:
    if neighbor has no distance:
      distance[neighbor] = distance[current] + 1
      queue.push_back(neighbor)
```

Then for each wizard:

```text
minutes = distance[start] / speed
```

The smallest time wins. If two or more wizards have the same best time, the result is a tie.

### Complexity

Let:

```text
R = number of rows
C = number of columns
```

BFS time:

```text
O(R*C)
```

Space:

```text
O(R*C)
```

The post-processing for three wizards is constant time.

## 10. Part 1C: Aunt's Namesday

The problem:

Given guests and pairs of guests who dislike each other, split guests into two tables so no disliked pair sits at the same table.

This is exactly the bipartite graph problem:

- guests are vertices
- dislike relationships are undirected edges
- table numbers are two colors

### Non-recursive DFS

The assignment asks for non-recursive DFS. The code uses an explicit stack:

```text
for each uncolored guest:
  color guest with 0
  push guest on stack

  while stack is not empty:
    current = stack.pop()
    for each neighbor:
      if neighbor is uncolored:
        color neighbor with 1 - color[current]
        push neighbor
      else if neighbor has same color as current:
        conflict -> impossible
```

If no conflict is found, color `0` is table 1 and color `1` is table 2.

### Why this works

A graph is bipartite if and only if it can be colored with two colors so that every edge connects different colors. DFS tries to enforce exactly that rule. A same-color edge proves an odd cycle or another contradiction, so no two-table seating is possible.

### Complexity

Let:

```text
V = number of guests
E = number of dislike pairs
```

Time:

```text
O(V + E)
```

Space:

```text
O(V + E)
```

## 11. Part 2: Hash Tables

The "Full House" task compares insert and search time as the load factor increases.

The load factor is:

```text
alpha = number of stored keys / table capacity
```

High load factor means the table is fuller. Full tables have more collisions, longer chains, or longer probe sequences.

## 12. Separate Chaining

### Core idea

Each table slot stores a list of entries:

```text
table[index] = [(key1, value1), (key2, value2), ...]
```

If two keys hash to the same index, both are stored in the same bucket.

### Insert

```text
index = hash(key) mod capacity
scan bucket:
  if key exists, update it
  else append new entry
```

### Search

```text
index = hash(key) mod capacity
scan bucket for key
```

### Complexity

Expected chain length is close to the load factor `alpha`.

Expected insert/search:

```text
O(1 + alpha)
```

Worst case:

```text
O(n)
```

if all keys land in one bucket.

### Benchmark behavior

Separate chaining handles high load factors gracefully compared with open addressing because it can keep adding entries to buckets. The chains get longer, but the table never needs to find an empty slot during probing.

## 13. Linear Probing

### Core idea

Open addressing stores all entries directly inside the table array. Linear probing handles a collision by trying the next slot:

```text
index, index + 1, index + 2, ...
```

wrapping around at the end.

### Insert

```text
index = hash(key) mod capacity
while table[index] is occupied by a different key:
  index = (index + 1) mod capacity
place key there
```

### Search

Use the same probe sequence. Stop when:

- the key is found, or
- an empty slot is found

An empty slot means the key cannot be later in that probe chain.

### Clustering

Linear probing suffers from primary clustering. Once a group of occupied cells forms, future colliding keys tend to extend that group. At high load factors, searches can walk through long clusters.

### Complexity

Expected performance is constant at low load factors. As `alpha` approaches `1`, probe sequences grow quickly.

Worst case:

```text
O(n)
```

## 14. Double Hashing

### Core idea

Double hashing is also open addressing, but the step size comes from a second hash function:

```text
index_i = (hash1(key) + i * hash2(key)) mod capacity
```

The code uses:

```text
step = 1 + (hash2(key) mod (capacity - 1))
```

This avoids a zero step.

### Why it helps

Different keys get different probe steps. That reduces clustering compared with linear probing, because colliding keys do not all march through the table in the same one-slot-at-a-time pattern.

### Complexity

Expected insert/search:

```text
O(1)
```

when the table is not too full and the hash functions distribute keys well.

Worst case:

```text
O(n)
```

The benchmark uses a prime default capacity so the second hash step can visit the table well.

## 15. Complexity Summary

| Structure or algorithm | Build | Lookup/Search | Space |
|---|---:|---:|---:|
| Linear list dictionary | `O(d)` | `O(d*k)` | `O(d)` |
| Red-black tree dictionary | `O(d log d)` | `O(log d * k)` | `O(d)` |
| Hash map dictionary | expected `O(d)` | expected `O(k)` | `O(d)` |
| Ordinary trie | `O(total chars)` | `O(k)` | `O(nodes)` |
| Balanced ternary trie | about `O(total chars * h)` | about `O(k*h)` | `O(nodes)` |
| Double-array trie | high construction cost | `O(k)` | `O(array length)` |
| Triwizard BFS | `O(R*C)` | distances after one BFS | `O(R*C)` |
| Namesday DFS | `O(V+E)` | same pass | `O(V+E)` |
| Separate chaining HT | `O(n)` inserts | expected `O(1+alpha)` | `O(n + capacity)` |
| Linear probing HT | expected `O(n)` inserts | worsens as `alpha -> 1` | `O(capacity)` |
| Double hashing HT | expected `O(n)` inserts | usually better than linear probing at high load | `O(capacity)` |

## 16. Common Defense Questions

### Why is one BFS enough for the Triwizard task?

BFS from the exit computes the shortest distance from the exit to every reachable cell. In an undirected labyrinth, the shortest path from a wizard to the exit has the same length as the shortest path from the exit to that wizard. So one BFS gives all three distances.

### Why does the seating task use bipartite checking?

Two tables are two colors. A dislike edge means the endpoints must have different colors. If the graph can be colored with two colors, the seating is possible. If DFS finds a same-color edge, the seating is impossible.

### Why is the hash map faster than the red-black tree for spell checking?

The hash map usually jumps directly to a small candidate set using a hash code. The red-black tree must do about `log d` ordered string comparisons. For exact membership lookup, hashing is normally faster.

### Why use a red-black tree at all?

It gives guaranteed logarithmic height and ordered dictionary behavior. It is a good replacement for an ordered set such as `std::set`.

### Why is the double-array trie build slower?

It first builds trie structure, then searches for `base` values that place child transitions without collisions. That extra packing work makes construction slower, but lookup becomes simple array arithmetic.

### Why does linear probing slow down at high load factors?

Open slots become rare, and occupied slots form clusters. Insert and search operations must probe through these clusters. As the load factor approaches `1`, the expected number of probes rises quickly.

### What does the memory graph mean?

JavaScript does not expose exact object memory per structure. The project reports consistent estimates based on node counts, array lengths, stored words, and table entries. The estimates are useful for comparing shapes, not for exact byte accounting.

