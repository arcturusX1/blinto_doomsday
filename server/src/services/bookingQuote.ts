// Pure booking logic for feature 2, kept free of database code so it can be
// unit-tested directly.
export interface BundleCount {
  size: number;
  count: number;
}

export interface Quote {
  totalBundles: number;
  bundles: BundleCount[]; // largest size first
}

// The fewest bundles whose sizes add up to exactly `groupSize`, with any
// number of each size allowed, or null if no combination does.
//
// Taking the biggest bundle that fits doesn't work: for sizes 1, 3, 4 and a
// group of 6 it gives 4 + 1 + 1, but 3 + 3 is fewer. Instead this is solved
// bottom-up (dynamic programming): best[s] is the fewest bundles that make
// exactly s seats. A bundle of size b turns any answer for s - b into one for
// s, so best[s] = 1 + the smallest best[s - b] over every size b <= s.
// lastBundle[s] remembers which size gave that, so the bundles can be read
// back from groupSize down to 0.
//
// Ties: sizes are tried largest first and only a strictly better answer
// replaces the current one, so each step back keeps the largest bundle that
// still leads to a fewest-bundle answer. Quotes come out the same every time.
export function fewestBundles(sizes: readonly number[], groupSize: number): Quote | null {
  const largestFirst = [...new Set(sizes)].sort((a, b) => b - a);
  const best = new Array<number>(groupSize + 1).fill(Infinity);
  const lastBundle = new Array<number>(groupSize + 1).fill(0);
  best[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of largestFirst) {
      if (size <= seats && best[seats - size] + 1 < best[seats]) {
        best[seats] = best[seats - size] + 1;
        lastBundle[seats] = size;
      }
    }
  }

  if (best[groupSize] === Infinity) return null;

  const counts = new Map<number, number>();
  for (let seats = groupSize; seats > 0; seats -= lastBundle[seats]) {
    counts.set(lastBundle[seats], (counts.get(lastBundle[seats]) ?? 0) + 1);
  }

  return {
    totalBundles: best[groupSize],
    bundles: largestFirst.filter((size) => counts.has(size)).map((size) => ({ size, count: counts.get(size)! })),
  };
}
