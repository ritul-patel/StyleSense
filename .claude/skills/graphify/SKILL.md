---
name: graphify
description: Build and navigate the graphify knowledge graph for this codebase. Use this skill to generate or refresh the graph, explore architecture, find god nodes, and answer structural questions about the project.
license: MIT
metadata:
  author: local
  version: "1.0.0"
  abstract: Graphify builds a static knowledge graph of the codebase at graphify-out/. It identifies god nodes (high-centrality files), community clusters, and dependency structure. Use /graphify to rebuild the graph or explore it.
---

# Graphify — Codebase Knowledge Graph

Graphify produces a static knowledge graph at `graphify-out/` that maps file relationships, identifies high-centrality "god nodes", and clusters the codebase into logical communities.

## When to Use

- Before answering architecture or codebase-structure questions
- After significant refactors to refresh the graph
- To find which files are most central / most depended-upon
- To understand community structure (which files cluster together)

## Workflow

### Rebuild the graph

```bash
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

Run this after modifying code files to keep the graph current.

### Read the graph report

1. Check `graphify-out/GRAPH_REPORT.md` — summary of god nodes and community structure
2. If `graphify-out/wiki/index.md` exists, navigate that instead of reading raw files

### Answer architecture questions

1. Read `graphify-out/GRAPH_REPORT.md` first
2. Navigate `graphify-out/wiki/` for detailed per-file context
3. Use graph centrality scores to prioritise which files to read

## Output Files

| File | Purpose |
|------|---------|
| `graphify-out/GRAPH_REPORT.md` | God nodes, communities, summary stats |
| `graphify-out/graph.json` | Raw graph data (nodes + edges) |
| `graphify-out/wiki/index.md` | Human-readable wiki index |
| `graphify-out/wiki/*.md` | Per-file pages with imports, exports, callers |

## Rules

- Always read `graphify-out/GRAPH_REPORT.md` before answering architecture questions
- Prefer `graphify-out/wiki/index.md` over grepping raw source files
- After editing source files, rebuild the graph to keep it current
