import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createsCycle, findCycle, postOrder, rewatchOrder, type Graph } from './movieGraph.ts';
import { sampleMovies } from '../data/sampleMovies.ts';

// The brief's sample data, keyed by title instead of id
const sample: Graph = new Map(sampleMovies.map((m) => [m.title, m]));

// Every movie appears exactly once and only after all of its own prereqs.
function assertValidOrder(graph: Graph, order: string[]) {
  assert.equal(new Set(order).size, order.length, 'movies repeated');
  order.forEach((movie, i) => {
    for (const prereq of graph.get(movie)?.prereqs ?? []) {
      assert.ok(order.indexOf(prereq) < i && order.includes(prereq), `${prereq} should come before ${movie}`);
    }
  });
}

test('rewatch order for Avengers: Doomsday is all 7 other movies in a valid order', () => {
  const order = rewatchOrder(sample, 'Avengers: Doomsday');
  assert.equal(order.length, 7);
  assert.ok(!order.includes('Avengers: Doomsday'), 'target must be excluded');
  assert.deepEqual(new Set(order), new Set(sampleMovies.map((m) => m.title).filter((t) => t !== 'Avengers: Doomsday')));
  assertValidOrder(sample, order);
});

test('rewatch order for Captain America: Civil War is Iron Man and The First Avenger, then The Avengers', () => {
  const order = rewatchOrder(sample, 'Captain America: Civil War');
  assert.deepEqual(new Set(order.slice(0, 2)), new Set(['Iron Man', 'Captain America: The First Avenger']));
  assert.deepEqual(order.slice(2), ['The Avengers']);
});

test('rewatch order for Thor: Ragnarok is empty', () => {
  assert.deepEqual(rewatchOrder(sample, 'Thor: Ragnarok'), []);
});

test('making Avengers: Endgame a prerequisite of Iron Man is a cycle', () => {
  const cycle = findCycle('Iron Man', ['Avengers: Endgame'], sample);
  assert.deepEqual(cycle, [
    'Iron Man',
    'Avengers: Endgame',
    'Avengers: Infinity War',
    'Captain America: Civil War',
    'The Avengers',
    'Iron Man',
  ]);
});

test('a movie depending directly on itself is a cycle', () => {
  assert.deepEqual(findCycle('Thor: Ragnarok', ['Thor: Ragnarok'], sample), ['Thor: Ragnarok', 'Thor: Ragnarok']);
});

test('createsCycle is true for changes that loop back', () => {
  assert.equal(createsCycle('Iron Man', ['Avengers: Endgame'], sample), true);
  assert.equal(createsCycle('The Avengers', ['Thor: Ragnarok', 'Captain America: Civil War'], sample), true);
});

test('valid prerequisite changes are not cycles', () => {
  assert.equal(createsCycle('Thor: Ragnarok', ['Iron Man', 'The Avengers'], sample), false);
  assert.equal(createsCycle('Avengers: Doomsday', [], sample), false);
  // A brand-new movie nobody depends on yet
  assert.equal(createsCycle('New Movie', ['Avengers: Doomsday'], sample), false);
  assert.equal(findCycle('Thor: Ragnarok', ['Iron Man'], sample), null);
});

test('a prerequisite shared by several movies is listed once', () => {
  // Diamond: D needs B and C, which both need A
  const diamond: Graph = new Map([
    ['A', { prereqs: [] }],
    ['B', { prereqs: ['A'] }],
    ['C', { prereqs: ['A'] }],
    ['D', { prereqs: ['B', 'C'] }],
  ]);
  const order = rewatchOrder(diamond, 'D');
  assert.equal(order.length, 3);
  assert.equal(order[0], 'A');
  assertValidOrder(diamond, order);
});

test('post-order ends with the start node and ignores unrelated movies', () => {
  const order = postOrder(sample, 'The Avengers');
  assert.equal(order.at(-1), 'The Avengers');
  assert.ok(!order.includes('Thor: Ragnarok'));
});
