import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fewestBundles, type Quote } from './bookingQuote.ts';

// Every bundle is an offered size and the seats add up to exactly the group.
function assertExact(sizes: number[], groupSize: number, quote: Quote) {
  for (const { size, count } of quote.bundles) {
    assert.ok(sizes.includes(size), `${size} is not an offered size`);
    assert.ok(count > 0);
  }
  assert.equal(quote.bundles.reduce((sum, b) => sum + b.size * b.count, 0), groupSize);
  assert.equal(quote.bundles.reduce((sum, b) => sum + b.count, 0), quote.totalBundles);
}

// Reference answer by exhaustive search: tries every count of every size.
function bruteForceFewest(sizes: number[], groupSize: number): number | null {
  let best = Infinity;
  function tryCounts(i: number, remaining: number, used: number) {
    if (i === sizes.length) {
      if (remaining === 0) best = Math.min(best, used);
      return;
    }
    for (let count = 0; count * sizes[i] <= remaining; count++) {
      tryCounts(i + 1, remaining - count * sizes[i], used + count);
    }
  }
  tryCounts(0, groupSize, 0);
  return best === Infinity ? null : best;
}

test('sizes 1, 3, 4 for 6: 2 bundles, 3 x 2 (biggest-first would give 3)', () => {
  assert.deepEqual(fewestBundles([1, 3, 4], 6), { totalBundles: 2, bundles: [{ size: 3, count: 2 }] });
});

test('sizes 2, 5 for 11: 4 bundles, 5 x 1 and 2 x 3', () => {
  assert.deepEqual(fewestBundles([2, 5], 11), {
    totalBundles: 4,
    bundles: [
      { size: 5, count: 1 },
      { size: 2, count: 3 },
    ],
  });
});

test('sizes 6, 9, 20 for 44: 4 bundles, 20 x 1, 9 x 2, 6 x 1', () => {
  assert.deepEqual(fewestBundles([6, 9, 20], 44), {
    totalBundles: 4,
    bundles: [
      { size: 20, count: 1 },
      { size: 9, count: 2 },
      { size: 6, count: 1 },
    ],
  });
});

test('sizes 4, 6 for 7: not possible', () => {
  assert.equal(fewestBundles([4, 6], 7), null);
});

test('a group smaller than every bundle is not possible', () => {
  assert.equal(fewestBundles([5, 8], 3), null);
});

test('bundle size 1 makes every group possible', () => {
  assert.deepEqual(fewestBundles([1], 7), { totalBundles: 7, bundles: [{ size: 1, count: 7 }] });
});

test('input order and repeated sizes do not matter', () => {
  assert.deepEqual(fewestBundles([2, 5, 2], 11), fewestBundles([5, 2], 11));
});

test('ties keep the largest bundle that still gives the fewest', () => {
  // 6 = 4 + 2 = 3 + 3, both 2 bundles
  assert.deepEqual(fewestBundles([2, 3, 4], 6), {
    totalBundles: 2,
    bundles: [
      { size: 4, count: 1 },
      { size: 2, count: 1 },
    ],
  });
});

test('handles the largest inputs quickly', () => {
  const start = performance.now();
  assert.deepEqual(fewestBundles([499, 500], 9999), {
    totalBundles: 20,
    bundles: [
      { size: 500, count: 19 },
      { size: 499, count: 1 },
    ],
  });
  const tenSizes = [500, 499, 498, 497, 496, 495, 494, 493, 492, 491];
  const quote = fewestBundles(tenSizes, 10000);
  assert.ok(quote);
  assertExact(tenSizes, 10000, quote);
  assert.ok(performance.now() - start < 500, 'took too long');
});

test('matches an exhaustive search on every small case', () => {
  const pool = [1, 2, 3, 4, 5, 7, 9];
  // Every set of 1 to 3 sizes from the pool, against every group from 1 to 60
  const sizeSets: number[][] = [];
  for (let a = 0; a < pool.length; a++) {
    sizeSets.push([pool[a]]);
    for (let b = a + 1; b < pool.length; b++) {
      sizeSets.push([pool[a], pool[b]]);
      for (let c = b + 1; c < pool.length; c++) sizeSets.push([pool[a], pool[b], pool[c]]);
    }
  }

  for (const sizes of sizeSets) {
    for (let groupSize = 1; groupSize <= 60; groupSize++) {
      const quote = fewestBundles(sizes, groupSize);
      const expected = bruteForceFewest(sizes, groupSize);
      assert.equal(quote?.totalBundles ?? null, expected, `sizes ${sizes} for ${groupSize}`);
      if (quote) assertExact(sizes, groupSize, quote);
    }
  }
});
