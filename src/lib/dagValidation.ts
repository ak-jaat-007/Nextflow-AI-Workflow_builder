export function createsCycle(
  nodes: any[],
  edges: any[],
  source: string,
  target: string
): boolean {
  // 🚫 Self-loop check
  if (source === target) return true;

  // Build adjacency list from existing edges
  const graph: Record<string, string[]> = {};

  for (const node of nodes) {
    graph[node.id] = [];
  }

  for (const edge of edges) {
    if (!graph[edge.source]) {
      graph[edge.source] = [];
    }
    graph[edge.source].push(edge.target);
  }

  /**
   * If there is already a path:
   * target → ... → source
   * then adding source → target creates a cycle
   */

  const visited = new Set<string>();

  function dfs(current: string): boolean {
    if (current === source) return true;
    if (visited.has(current)) return false;

    visited.add(current);

    for (const neighbor of graph[current] || []) {
      if (dfs(neighbor)) return true;
    }

    return false;
  }

  return dfs(target);
}