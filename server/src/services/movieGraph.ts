// Pure graph logic for feature 1, kept free of database code so it can be
// unit-tested directly. The graph maps each movie id to a node listing the ids
// of its prerequisites; each edge points from a movie to one of those.
export interface GraphNode {
  readonly prereqs: readonly string[];
}
export type Graph = ReadonlyMap<string, GraphNode>;

export class CycleError extends Error {
  // The cycle as a path that starts and ends on the same node,
  // where each node requires the next one.
  readonly path: string[];

  constructor(path: string[]) {
    super(`Circular dependency: ${path.join(' -> ')}`);
    this.name = 'CycleError';
    this.path = path;
  }
}

// Depth-first search from `start` along prerequisite edges, returning nodes in
// post-order: a node is emitted only after all of its prerequisites have been,
// so the result is already a valid watch order, and `start` is always last.
//
// Each node is tracked as in progress (on the current DFS path) or done.
// Reaching a node that is still in progress means we followed edges back to
// an ancestor, which is a cycle, so we throw a CycleError.
// Done nodes are skipped, so each node is emitted exactly once even when
// several movies share a prerequisite.
export function postOrder(graph: Graph, start: string): string[] {
  const state = new Map<string, 'inProgress' | 'done'>();
  const path: string[] = [];
  const order: string[] = [];

  function visit(node: string) {
    const s = state.get(node);
    if (s === 'done') return;
    if (s === 'inProgress') throw new CycleError([...path.slice(path.indexOf(node)), node]);

    state.set(node, 'inProgress');
    path.push(node);
    for (const prereq of graph.get(node)?.prereqs ?? []) visit(prereq);
    path.pop();
    state.set(node, 'done');
    order.push(node);
  }

  visit(start);
  return order;
}

// Every movie that must be watched before `target`, prerequisites first,
// excluding the target itself.
export function rewatchOrder(graph: Graph, target: string): string[] {
  return postOrder(graph, target).slice(0, -1);
}

// Returns the cycle that setting `node`'s prerequisites to `prereqs` would
// create, or null if the change is safe. The stored graph is always acyclic
// (every write goes through this check), so any new cycle must pass through
// `node`, and one DFS from `node` is enough to find it.
export function findCycle(node: string, prereqs: readonly string[], graph: Graph): string[] | null {
  const proposed = new Map(graph).set(node, { prereqs });
  try {
    postOrder(proposed, node);
    return null;
  } catch (err) {
    if (err instanceof CycleError) return err.path;
    throw err;
  }
}

// True if giving `node` these prerequisites would make some movie depend on itself.
export function createsCycle(node: string, prereqs: readonly string[], graph: Graph): boolean {
  return findCycle(node, prereqs, graph) !== null;
}
