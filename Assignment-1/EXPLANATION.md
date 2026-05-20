# Assignment I: Pattern Matching Algorithms

This file is written for defense preparation. The goal is not only to describe what the code does, but to make you comfortable explaining each algorithm at a whiteboard, tracing a small example by hand, and justifying the time and space complexity.

## 1. What is Pattern Matching?

Pattern matching asks this question:

Given a text `T` of length `n` and a pattern `P` of length `m`, find all positions `i` such that:

```text
T[i..i + m - 1] = P
```

The positions are zero-based in this project. For example:

```text
T = "ABCABDABC"
P = "ABC"
matches = [0, 6]
```

Pattern matching matters because many real systems reduce to "find this sequence inside a larger sequence":

- search engines find words or phrases inside documents
- text editors implement find/replace
- antivirus systems search for byte signatures
- DNA tools search for biological motifs
- compilers and interpreters scan source text
- plagiarism and similarity tools search for repeated fragments

The algorithms in this project solve the same basic problem in different ways. Some compare characters directly, some preprocess the pattern, some use a finite automaton, and some use hashes.

## 2. Brute Force

### Core idea

Brute Force is the naive algorithm:

1. Put the pattern at text position `i = 0`.
2. Compare `P[0]` with `T[i]`, then `P[1]` with `T[i + 1]`, and so on.
3. If all `m` characters match, record `i`.
4. Move the pattern one position to the right and repeat.

It does not try to remember anything about previous comparisons.

### Trace example

```text
T = "ABCABDABC"
P = "ABC"
```

At `i = 0`:

```text
T: A B C A B D A B C
   | | |
P: A B C
```

Comparisons:

```text
A = A
B = B
C = C
```

Match at index `0`.

At `i = 1`:

```text
T: A B C A B D A B C
     |
P:   A B C
```

First comparison:

```text
B != A
```

Stop immediately.

At `i = 2`:

```text
C != A
```

Stop.

At `i = 3`:

```text
A = A
B = B
D != C
```

No match.

At `i = 4`:

```text
B != A
```

At `i = 5`:

```text
D != A
```

At `i = 6`:

```text
A = A
B = B
C = C
```

Match at index `6`.

Final answer:

```text
[0, 6]
```

### Complexity

Worst case is `O(n*m)`.

The classic bad example is:

```text
T = "aaaaaaaaaaaaaaaa"
P = "aaaaab"
```

At many positions, the first five characters match and only the final `b` fails. That means one alignment can cost almost `m` comparisons, and there are about `n` alignments.

Best practical case is much faster. If most windows fail on the first character, each alignment costs one comparison, so the behavior is close to `O(n)`.

Space complexity is `O(1)` besides the output array.

### Repeated characters

Repeated characters are bad for Brute Force when they create long partial matches. If `T` is many `a` characters and `P` is many `a` characters followed by a different character, Brute Force wastes time rediscovering the same partial match at every position.

## 3. Sunday Algorithm

The Sunday algorithm is also called Quick Search. It is related to Boyer-Moore-style bad-character shifting, but its shift rule is especially simple.

### Key insight

Suppose the pattern has length `m` and is currently aligned at position `i`:

```text
T: ... [current window of length m] X ...
P:      [pattern length m]
```

The character `X = T[i + m]` is just after the current window.

If the next match starts anywhere after `i`, this character `X` must appear somewhere inside that next pattern window. So Sunday shifts the pattern until the rightmost occurrence of `X` in the pattern lines up with `X` in the text.

If `X` does not occur in the pattern, then no match can include the current window or `X`, so the algorithm shifts by `m + 1`.

### Shift table

For every character in the alphabet:

```text
shift[c] = m + 1
```

Then for every pattern index `i`:

```text
shift[P[i]] = m - i
```

Later occurrences overwrite earlier ones, so the final value corresponds to the rightmost occurrence.

Example:

```text
P = "ABCD"
m = 4
```

Default:

```text
shift[c] = 5
```

Pattern characters:

```text
shift['A'] = 4
shift['B'] = 3
shift['C'] = 2
shift['D'] = 1
```

Any character not in `"ABCD"` shifts by `5`.

### Trace example

```text
T = "XXABCYABCD"
P = "ABCD"
```

At `i = 0`, compare:

```text
T window = "XXAB"
P        = "ABCD"
```

First character fails: `X != A`.

Look after the window:

```text
T[i + m] = T[4] = 'C'
```

`C` appears in the pattern at index `2`, so:

```text
shift['C'] = 4 - 2 = 2
```

Move to `i = 2`.

At `i = 2`:

```text
T window = "ABCY"
P        = "ABCD"
```

First three characters match, last fails: `Y != D`.

Look after the window:

```text
T[6] = 'A'
shift['A'] = 4
```

Move to `i = 6`.

At `i = 6`:

```text
T window = "ABCD"
P        = "ABCD"
```

Match at index `6`.

### Complexity

Preprocessing is `O(m + alphabet)` if a full alphabet table is built.

Best case can be close to `O(n / m)`, because the algorithm jumps by `m + 1` often.

Worst case is `O(n*m)`. For example, if shifts are tiny and each alignment compares many characters, Sunday loses its advantage.

Space is `O(alphabet)` for the shift table.

### Repeated characters

Repeated characters can reduce Sunday to small shifts. If a common text character appears near the right end of the pattern, the shift for that character may be `1` or `2`, so the algorithm examines many windows.

## 4. KMP

KMP stands for Knuth-Morris-Pratt.

### Problem with Brute Force

Brute Force forgets what it already matched. Suppose:

```text
P = "ABABC"
```

If we already matched `"ABAB"` and then fail, we should not restart from zero. The suffix `"AB"` of what we matched is also a prefix of the pattern, so we can continue from that partial state.

### Failure function

The failure function, also called the prefix function, stores:

```text
f[i] = length of the longest proper prefix of P[0..i]
       that is also a suffix of P[0..i]
```

"Proper" means the whole string itself is not allowed.

Example:

```text
P = "ABABC"
```

Compute each prefix:

```text
i = 0, "A"
proper prefixes: ""
suffixes: ""
f[0] = 0

i = 1, "AB"
proper prefixes: "", "A"
suffixes: "", "B"
f[1] = 0

i = 2, "ABA"
proper prefixes: "", "A", "AB"
suffixes: "", "A", "BA"
f[2] = 1

i = 3, "ABAB"
proper prefixes: "", "A", "AB", "ABA"
suffixes: "", "B", "AB", "BAB"
f[3] = 2

i = 4, "ABABC"
proper prefixes include "A", "AB", "ABA", "ABAB"
suffixes end in "C", so none match except ""
f[4] = 0
```

So:

```text
f = [0, 0, 1, 2, 0]
```

### Search

KMP maintains `j`, the number of pattern characters currently matched.

When `T[i] == P[j]`, increase `j`.

When `T[i] != P[j]`, do not move the text pointer backward. Instead:

```text
j = f[j - 1]
```

Repeat this fallback until either the characters match or `j = 0`.

### Trace

```text
T = "ABABABC"
P = "ABABC"
f = [0, 0, 1, 2, 0]
```

Read text:

```text
T[0] = A, P[0] = A -> j = 1
T[1] = B, P[1] = B -> j = 2
T[2] = A, P[2] = A -> j = 3
T[3] = B, P[3] = B -> j = 4
T[4] = A, P[4] = C -> mismatch
```

Fallback:

```text
j = f[3] = 2
```

Now compare same text character again:

```text
T[4] = A, P[2] = A -> j = 3
T[5] = B, P[3] = B -> j = 4
T[6] = C, P[4] = C -> j = 5
```

`j == m`, so match starts at:

```text
i - m + 1 = 6 - 5 + 1 = 2
```

### Complexity

Building the failure function is `O(m)`.

Searching is `O(n)`.

Total is `O(n + m)`.

The reason is that the text pointer never moves backward. The pattern pointer `j` can move backward using the failure function, but it only falls back after previous increases. Across the whole run, total increases and decreases are linear.

Space is `O(m)` for the failure table.

### Repeated characters

KMP handles repeated characters well. A pattern like `"aaaaab"` produces useful fallback information. Instead of testing the same `a` characters repeatedly from scratch, KMP falls back to the longest prefix that could still match.

## 5. FSM (Finite State Machine)

The finite state machine approach builds a deterministic automaton for one pattern.

### State meaning

State `q` means:

```text
We have matched the first q characters of P.
```

States are:

```text
0, 1, 2, ..., m
```

State `m` is accepting, meaning the full pattern was just matched.

### Transition table

The table is:

```text
delta[state][char] = next_state
```

The mathematical definition:

```text
delta[q][c] = length of the longest prefix of P
              that is a suffix of P[0..q-1] + c
```

That means: if we have matched `q` characters and then read character `c`, how many pattern characters are matched now?

The code computes this using the same fallback idea as KMP.

### Small DFA for P = "AB"

States:

```text
0 = matched ""
1 = matched "A"
2 = matched "AB" accepting
```

For alphabet `{A, B}`:

```text
state 0:
  on A -> 1
  on B -> 0

state 1:
  on A -> 1
  on B -> 2

state 2:
  on A -> 1
  on B -> 0
```

Why does state `2` on `A` go to `1`? Because after seeing `"ABA"`, the longest suffix that is also a prefix of `"AB"` is `"A"`.

### Search

Once the table exists, searching is simple:

```text
state = delta[state][T[i]]
if state == m:
  report i - m + 1
```

There is no backtracking.

### Complexity

Preprocessing is:

```text
O(m * alphabet)
```

Search is:

```text
O(n)
```

Space is:

```text
O(m * alphabet)
```

The table can be expensive if the alphabet is huge. In this project, transitions are stored in maps for the characters that actually appear in the text or pattern.

### Repeated characters

Repeated characters are handled by transitions. The machine can stay in a high partial-match state without rescanning text. This gives the same linear search guarantee as KMP, but with more preprocessing space.

## 6. Rabin-Karp

Rabin-Karp uses hashing.

### Core idea

Instead of comparing every window character by character, compute:

```text
hash(P)
hash(T[i..i+m-1])
```

If the hashes differ, the strings are definitely treated as different by the hash and no full comparison is needed.

If the hashes are equal, the algorithm verifies with a real string comparison because hash collisions are possible.

### Polynomial hash

The hash treats characters as digits in a base `B` number:

```text
hash(P) =
  P[0] * B^(m-1) +
  P[1] * B^(m-2) +
  ...
  P[m-1]
```

The code takes this modulo a large prime:

```text
Q = 1000000007
B = 256
```

So:

```text
hash = (hash * B + charCode) mod Q
```

### Rolling hash

Suppose the current window is:

```text
T[i..i+m-1]
```

To slide one step right:

1. Remove the contribution of `T[i]`.
2. Multiply by `B`.
3. Add `T[i + m]`.

Formula:

```text
hash(T[i+1..i+m]) =
  (hash(T[i..i+m-1]) - T[i] * B^(m-1)) * B + T[i+m]
```

The code applies modulo `Q` after the arithmetic.

### Spurious hits

A spurious hit is when:

```text
hash(window) == hash(pattern)
```

but:

```text
window != pattern
```

With a good prime and base, this is rare. Still, Rabin-Karp must verify, because correctness cannot depend on "probably no collision".

### Complexity

Preprocessing is `O(m)`.

Average search is `O(n)`, because each rolling update is constant time and hash matches are rare.

Worst case is `O(n*m)` if many windows require verification. That can happen with many true matches or with many collisions.

Space is `O(1)` besides output.

### Why base and prime matter

The base should spread character positions well. `256` is natural for byte-like text.

The prime should be large enough to reduce collisions but small enough that arithmetic remains efficient. This project uses `1000000007`, a common large prime.

### Repeated characters

Repeated text can be good or bad. If the pattern does not hash-match those repeated windows, Rabin-Karp remains fast. If every repeated window is a real match, as with text `"aaaaaa..."` and pattern `"aaaa"`, Rabin-Karp must verify many windows.

## 7. Gusfield Z-Algorithm

The Z-algorithm computes how much each suffix of a string matches the prefix.

### Z-array definition

For a string `S`:

```text
Z[i] = length of the longest substring starting at S[i]
       that is also a prefix of S
```

Usually `Z[0]` is set to `0` because the whole string trivially matches itself.

### Pattern matching construction

Build:

```text
S = P + "$" + T
```

The separator must not appear in either `P` or `T`. The code chooses a safe separator.

If the pattern has length `m`, then a match at text position `i` means:

```text
Z[m + 1 + i] >= m
```

The separator prevents a match from accidentally crossing from the pattern into the text.

### Z-box idea

The efficient algorithm keeps the rightmost known matching interval:

```text
[L, R]
```

This is called the Z-box.

If `i > R`, we do not know anything useful, so we compare characters naively from `i` and update `[L, R]`.

If `i <= R`, then `i` is inside a known matching box. We can reuse:

```text
Z[i - L]
```

as a starting estimate, because the substring inside the box mirrors the prefix. If that estimate reaches the right edge, we try to extend beyond `R`.

### Trace example

```text
P = "ABC"
T = "ABCABDABC"
S = "ABC$ABCABDABC"
```

Important positions:

```text
index 0: A
index 1: B
index 2: C
index 3: $
index 4: A  <- text position 0
index 10: A <- text position 6
```

At `S[4]`, the substring is:

```text
ABCABDABC
```

It matches prefix `"ABC"` for 3 characters, so:

```text
Z[4] = 3
```

That reports text index:

```text
4 - (m + 1) = 4 - 4 = 0
```

At `S[10]`, again:

```text
Z[10] = 3
```

Report:

```text
10 - 4 = 6
```

### Complexity

The Z-array is built in `O(n + m)`.

Each character is compared at most a constant number of times because the right boundary `R` only moves to the right.

Space is `O(n + m)` for the combined string and the Z-array.

### Repeated characters

Repeated characters create long Z-boxes. The algorithm is designed for this: it reuses previous Z information instead of comparing the same repeated characters from scratch.

## 8. Part 1B: Wacky Races Explained

The file `src/benchmark/wackyRaces.js` creates adversarial inputs to show that the fastest algorithm depends on the input.

### Race 1: Sunday faster than Gusfield Z

Construction:

```text
T = "cccccc...."       at least 100 KB
P = "aaaa....aaab"    length 256
```

Why Sunday is fast:

The character after each Sunday window is `c`. The pattern contains no `c`, so the shift is `m + 1`. Sunday inspects very few windows.

Why Gusfield is slower:

Gusfield must always build the full combined string:

```text
P + separator + T
```

and compute a Z value over the whole input. It is linear, but it cannot skip large parts of the text.

Theoretical reason for a ratio above 2:

Sunday does about `n / m` alignments, while Gusfield processes about `n + m` characters. With `m = 256`, Sunday has much less work.

### Race 2: KMP faster than Rabin-Karp

Construction:

```text
T = "aaaaaaaa...."  at least 100 KB
P = "aaaaaaaa...."  length 128
```

Why KMP is fast:

KMP moves through the text once and uses the failure function to report overlapping matches without rescanning.

Why Rabin-Karp is slower:

Every window is a real hash hit, so Rabin-Karp must verify many long windows. This creates the same verification bottleneck that collisions would create.

Theoretical reason for a ratio above 2:

KMP does linear state updates. Rabin-Karp does rolling arithmetic plus `m`-character verification for almost every position.

### Race 3: Rabin-Karp faster than Sunday

Construction:

```text
T = "aaaaaaaa...."       at least 100 KB
P = "aaaa....aaab"      length 256
```

Why Sunday is slow:

Each alignment matches almost the whole pattern, then fails at the final `b`. The after-window character is `a`, which appears near the end of the pattern, so the shift is small.

Why Rabin-Karp is fast:

Rabin-Karp rolls one hash per text position. The pattern hash almost never equals the window hash, so it avoids full verification.

Theoretical reason for a ratio above 2:

Sunday does roughly `m` comparisons per small shift. Rabin-Karp does constant work per shift.

## 9. Part 2: Wildcard Matching Explained

The wildcard functions return a Boolean:

```text
true  -> pattern occurs somewhere in text
false -> no occurrence
```

They do not return indices because the assignment asks for a Boolean result.

### Wildcard tokens

The pattern is first parsed into tokens:

```text
literal char: { type: "literal", char }
?           : { type: "any_one" }
*           : { type: "any_many" }
```

Escapes are handled before matching:

```text
\? -> literal ?
\* -> literal *
\\ -> literal \
```

### Meaning of ?

`?` matches exactly one arbitrary character.

Example:

```text
P = "h?llo"
T = "hello"
```

The `?` matches `e`.

It cannot match zero characters.

### Meaning of *

`*` matches zero or more arbitrary characters.

Example:

```text
P = "ab*cd"
```

This matches:

```text
"abcd"       because * consumes empty string
"abXYZcd"    because * consumes "XYZ"
"ab12345cd"  because * consumes "12345"
```

### Brute Force wildcard approach

The brute-force wildcard matcher uses backtracking.

For ordinary literals and `?`, it moves one character forward.

For `*`, it first tries to let the star match zero characters. If the rest of the pattern fails later, it backtracks and lets the star consume one more character, then tries again.

Conceptually:

```text
P = "h?llo*world"
T = "hello beautiful world"
```

Steps:

```text
h matches h
? matches e
l matches l
l matches l
o matches o
* first tries to consume nothing
world does not match at the next position
* expands to consume " beautiful "
world now matches world
```

Because the assignment asks for "found anywhere", the implementation treats the text before and after the matched substring as irrelevant. Intuitively, it behaves like there is an implicit `*` before and after the pattern.

### Sunday wildcard approach

The Sunday wildcard matcher splits the pattern on real `*` tokens.

Example:

```text
P = "h?llo*world"
segments:
  "h?llo"
  "world"
```

Then it searches for each segment in order:

1. Find `"h?llo"` using a Sunday-style search where `?` matches any one character.
2. Continue after that segment.
3. Find `"world"`.
4. If all segments appear in increasing non-overlapping order, the wildcard pattern matches.

Between segments, the `*` can consume any amount of text.

### How ? affects Sunday's shift table

In exact Sunday, the shift table depends on literal characters in the pattern.

With `?`, any text character could match that position. Therefore the shift table must be conservative. If a segment contains `?`, the shift for many characters may need to become smaller, because skipping too far could skip a valid match.

The code treats `?` as a position that can match any character and takes the minimum safe shift.

### Escaped characters

Escaped wildcard characters are literals.

Example:

```text
P = "file\?.txt"
```

This matches:

```text
"file?.txt"
```

It does not match:

```text
"file1.txt"
```

because `\?` means literal question mark.

## 10. Part 3: 2D Rabin-Karp Explained

The 2D problem is:

Given a picture as an `M x N` array and a number `K`, take the top-right `K x K` corner and check whether that same block appears anywhere else in the picture.

The pattern block is:

```text
rows 0..K-1
cols N-K..N-1
```

The function returns:

```js
{ found: true, position: { row, col } }
```

or:

```js
{ found: false, position: null }
```

The original top-right corner is not counted as "elsewhere".

### Arbitrary items

Rabin-Karp needs numbers, but the picture can contain arbitrary items:

```js
[
  ["red", "blue"],
  ["green", "red"]
]
```

The code first maps each unique item to an integer using a `Map`:

```text
"red"   -> 1
"blue"  -> 2
"green" -> 3
```

Then hashing works on integer codes.

### Step 1: row hashes

For each row, compute rolling hashes of all length-`K` horizontal windows.

Example row:

```text
A B C D E
K = 2
```

Row windows:

```text
AB, BC, CD, DE
```

Each gets one hash.

### Step 2: column hash of row hashes

For a `K x K` block, there are `K` row hashes.

Example:

```text
D E
I J
```

First:

```text
hash(DE)
hash(IJ)
```

Then combine those two row hashes into one vertical hash:

```text
hash2D = hash(hash(DE), hash(IJ))
```

### Step 3: slide the 2D window

For every possible top-left position `(r, c)`:

1. Use the precomputed horizontal row hashes.
2. Roll the vertical hash down the column in `O(1)`.
3. Compare the 2D hash to the pattern hash.
4. If equal, verify by direct `K x K` comparison.

### Worked 5x5 example

Picture:

```text
A B C D E
F G H I J
K L M D E
P Q R I J
U V W X Y
```

Let `K = 2`.

The top-right corner is:

```text
D E
I J
```

It also appears starting at row `2`, col `3`:

```text
row 2, col 3: D E
row 3, col 3: I J
```

The algorithm hashes the top-right block, slides all `2 x 2` windows, and when the hash at `(2, 3)` matches, it verifies the four cells directly.

### Bitwise mask

The assignment requires:

```js
& ((1 << 31) - 1)
```

instead of `% prime`.

This is faster because bitwise AND is a simple integer operation, while modulo uses division-like arithmetic. The mask keeps hash values inside a 31-bit range. The value `2^31 - 1` is a Mersenne prime, but note an important practical detail: bitwise masking is not exactly the same mathematical operation as modulo by that prime. It is a fast truncation to lower bits.

That is still safe for this assignment because hashes are only used as a filter. Every hash match is verified by direct comparison, so collisions cannot produce a wrong answer. More collisions would only hurt performance.

### Complexity proof

Let the picture have `M` rows and `N` columns.

Horizontal row hashes:

```text
Each row is processed in O(N)
There are M rows
Total O(M*N)
```

Vertical rolling hashes:

```text
For each column-window position, roll down M rows
There are O(N) column-window positions
Total O(M*N)
```

Verification:

Only happens on hash matches. With a reasonable hash, this is rare. Correctness does not depend on rarity, but the expected running time does.

Overall expected time:

```text
O(M*N)
```

Space:

```text
O(M * (N - K + 1))
```

for the horizontal row hashes.

## 11. Common Interview Questions and Answers

### Why use KMP over Brute Force?

KMP never moves the text pointer backward. When a mismatch happens after a partial match, KMP uses the failure function to keep the longest useful prefix and continue. This is much faster on long patterns with repeated structure.

### When is Rabin-Karp preferred?

Rabin-Karp is especially useful when searching for many patterns. You can hash many patterns and compare each text-window hash against a set of pattern hashes. It also extends naturally to 2D matching.

### What is the difference between Sunday and Boyer-Moore?

Boyer-Moore uses information about the mismatch inside the current window and can combine bad-character and good-suffix rules.

Sunday looks at the character just after the current window. It is simpler and often fast in practice, but it has weaker worst-case guarantees.

### Can KMP have O(n*m) worst case?

No. KMP is always `O(n + m)`. The text pointer never moves backward, and pattern fallback work is bounded by previous successful advances.

### What if the alphabet is very large?

The FSM table can become too large because it stores transitions for each state and each character. Use maps or compute transitions lazily instead of building a dense array.

Sunday also has an alphabet table, but it can use a default shift plus a map for characters that actually matter.

### How does the Z-algorithm relate to KMP?

Both exploit prefix structure.

KMP stores, for each pattern prefix, the longest proper prefix that is also a suffix.

The Z-algorithm stores, for each position in a larger string, how much that suffix matches the full prefix.

Both avoid throwing away previous comparison information.

### What happens if the pattern has many repeated characters?

Brute Force can become slow because many alignments share long partial matches.

Sunday can become slow if repeated characters cause small shifts.

KMP remains linear because the failure function captures the repeated structure.

FSM remains linear after preprocessing because transitions encode the repeated structure.

Rabin-Karp depends on hash behavior and verification frequency. If every repeated window is a true match, it verifies many windows.

Gusfield Z remains linear because Z-box reuse handles repeated prefixes efficiently.

### How would you change Rabin-Karp to use a different base?

Change the `BASE` constant in `src/algorithms/rabinKarp.js`.

Then make sure:

1. The pattern hash uses the new base.
2. The window hash uses the new base.
3. The highest base power `BASE^(m-1)` is recomputed using the new base.
4. The rolling update subtracts `leftChar * highestBasePower`.

The same logic works for any reasonable base. A poor base may increase collisions.

### Why do all exact algorithms return arrays?

Because exact pattern matching can find zero, one, or many occurrences. The assignment requires all starting indices, so the functions return arrays of zero-based positions.

Wildcard functions return Boolean because the assignment asks only whether a wildcard match exists.

