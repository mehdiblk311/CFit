# How to Use Graphify — CFit Project

Graphify turns this entire codebase into a navigable knowledge graph. Instead of reading dozens of files to understand how things connect, you query the graph and get precise, sourced answers in seconds.

This guide is for both **humans** (developers) and **AI agents** working on CFit.

---

## What's in This Folder

```
graphify/
├── graphify-Front/          # Knowledge graph of the React frontend
│   ├── graph.html           # Interactive visualization — open in browser
│   ├── graph.json           # Raw graph data for queries
│   └── GRAPH_REPORT.md      # Audit report: god nodes, communities, gaps
├── graphify-Backend/        # Knowledge graph of the Go backend
│   ├── graph.html
│   ├── graph.json
│   └── GRAPH_REPORT.md
└── how-to-use-graphify.md   # This file
```

---

## For Humans

### Open the interactive graph

Open either `graph.html` file directly in your browser — no server needed.

- Nodes are colored by community (related modules cluster together)
- Click a node to see its connections
- Use it to orient yourself before touching unfamiliar code

### Read the report before starting a task

`GRAPH_REPORT.md` gives you:
- **God Nodes** — the most-connected abstractions (the things everything depends on)
- **Community map** — which modules cluster together
- **Knowledge gaps** — isolated nodes that may have missing connections

Read the relevant report before asking an agent to implement something in that area.

### Regenerate after major changes

After implementing a significant feature or refactor, rebuild the graph:

```bash
# Frontend graph
/graphify Front-End/AI/graphify/graphify-Front --update

# Backend graph
/graphify Front-End/AI/graphify/graphify-Backend --update
```

`--update` only re-extracts changed files — it's fast and cheap.

---

## For AI Agents

### Step 1 — Orient before acting

Before modifying any component, query the graph to understand what you're touching:

```
/graphify query "how does ActiveSession connect to useTimer"
/graphify query "what components depend on useAuth"
/graphify explain "Nutrition"
```

Do not skip this. Reading the graph costs ~200 tokens. Reading the files yourself costs 10x more and misses cross-file connections.

### Step 2 — Use god nodes as your anchor

The god nodes in `GRAPH_REPORT.md` are the highest-degree abstractions — the components and hooks that everything depends on. Always check whether the code you're about to write touches a god node. If it does, trace its neighborhood first:

```
/graphify explain "<god node name>"
```

### Step 3 — Find the shortest path between two concepts

If you need to understand how two parts of the system relate:

```
/graphify path "ComponentA" "ComponentB"
```

This returns the exact chain of dependencies between them, with source file references.

### Step 4 — Query before asking the user

If you're unsure whether something exists in the codebase, query the graph before asking the user:

```
/graphify query "does a nutrition logging hook exist"
/graphify query "where is authentication handled"
```

### Step 5 — Brief yourself with the right combination

The most effective agent context for CFit tasks is this combination:

| File | What it provides |
|------|-----------------|
| `agents/platform_context.md` | Domain knowledge (workouts, nutrition, goals, user flows) |
| `graphify-Front/GRAPH_REPORT.md` | Frontend architecture (god nodes, communities, gaps) |
| `graphify-Backend/GRAPH_REPORT.md` | Backend architecture |
| `agents/DESIGN.md` | Visual design system (Clay-Artisanal, colors, typography) |

Include all four when starting a feature that spans frontend + backend. Include only the relevant one(s) for isolated tasks.

---

## Query Reference

| Command | When to use |
|---------|-------------|
| `/graphify query "<question>"` | "What is X connected to?" — broad context, BFS |
| `/graphify query "<question>" --dfs` | "How does X reach Y?" — trace a specific dependency chain |
| `/graphify explain "<node>"` | Full neighborhood of one concept — before modifying it |
| `/graphify path "A" "B"` | Shortest connection between two concepts |
| `/graphify . --update` | After code changes — incremental rebuild, no full re-run |
| `/graphify . --cluster-only` | Re-run community detection on existing graph (no LLM needed) |

---

## Practical Workflow

### Starting a new screen or feature

1. Read `GRAPH_REPORT.md` — check god nodes and the relevant community
2. Run `/graphify explain "<main component involved>"`
3. Implement
4. Run `/graphify . --update` to keep the graph current

### Debugging a regression

1. Run `/graphify path "<broken thing>" "<thing it depends on>"`
2. Read the edge chain — the confidence tags (EXTRACTED / INFERRED) tell you how certain the relationship is
3. Check `source_location` fields — they point to the exact file and line

### Onboarding a new agent to the codebase

Give the agent this prompt template:

```
You are working on CFit, a fitness app (React frontend, Go backend).

Domain context: [paste agents/platform_context.md]
Frontend architecture: [paste graphify-Front/GRAPH_REPORT.md — God Nodes + Communities sections]
Design system: [paste agents/DESIGN.md — Section 9: Agent Prompt Guide]

Before modifying any component, run /graphify explain "<component>" to understand its connections.
```

---

## When to Rebuild the Full Graph

Run a full rebuild (not `--update`) when:
- A major refactor renamed or moved many files
- New modules were added that have no prior graph representation
- The graph feels stale or incomplete

```bash
/graphify .
```

Full rebuild re-extracts everything. It takes longer and costs more tokens but produces a complete, fresh graph.
