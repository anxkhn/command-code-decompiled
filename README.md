# Command Code v0.33.0 — Full Decompilation

End-to-end reverse-engineering of the [`command-code`](https://www.npmjs.com/package/command-code) npm package (v0.33.0). Continues from the [v0.28.1 decompilation](https://github.com/anxkhn/command-code-decompiled/tree/main) with 5 new models, expanded repair coverage, the new `deslop` design tool, taste system, and context compaction.

## What's Inside

| Document | Description |
|---|---|
| **[CHANGES-v0.33.0.md](CHANGES-v0.33.0.md)** | Full diff: v0.28.1 → v0.33.0 (models, repair, design, deps, taste, compaction, retry) |
| **[TOOL-REPAIR-v0.33.0.md](TOOL-REPAIR-v0.33.0.md)** | Deep-dive: repair system at v0.33.0 — 60 aliases, schema coercions, extractRepairNotes |
| **[DESIGN-SKILLS-v0.33.0.md](DESIGN-SKILLS-v0.33.0.md)** | Design skill system: 17 tools, 6 groups, 25 reference docs |
| **[DESLOP-ANALYSIS.md](DESLOP-ANALYSIS.md)** | New `deslop` anti-AI-slop tool — 10 antidotes, 3-report gate, domain traps |

| File / Directory | Contents |
|---|---|
| **[`index.mjs`](index.mjs)** | Full beautified v0.33.0 bundle (72,405 lines) with import mapping |
| **[`dist/index.mjs`](dist/index.mjs)** | Original minified v0.33.0 production bundle |
| **[`source/`](source/)** | Extracted key sections with meaningful variable names |
| **[`skills/`](skills/)** | v0.33.0 bundled skill files — design system (17 tools + 25 references) and agent browser |
| **[`vsix-extension/`](vsix-extension/)** | Decompiled VS Code extension |

### Previous Analysis (v0.28.1)

| Document | Description |
|---|---|
| **[TOOL-REPAIR.md](TOOL-REPAIR.md)** | Original repair analysis: 13 mechanisms, 36K+ production repairs |
| **[DESIGN-SKILLS.md](DESIGN-SKILLS.md)** | Original design skill analysis: 16 tools, 24 reference docs |

---

## Key Findings

### 1. Tool Input Repair — Validate-Then-Repair Architecture

The core insight: **model errors at tool boundaries are a small, finite, compositional set.** ~170 lines of repair code handle 36K+ production repairs. The architecture:

```
safeParse(input)
  ├─ success → ship it (valid inputs never touched)
  └─ failure → walk issue list
       ├─ for each issue path: try 5 rules in order
       │   1. renameAliasedField (60 aliases across 7 tools)
       │   2. dropNullOrUndefinedField
       │   3. dropEmptyObjectPlaceholder
       │   4. parseJsonStringifiedArray
       │   5. wrapBareStringAsArray
       └─ re-parse → success: log tool_input_repaired
                    → failure: return model-readable error
```

**v0.33.0 additions**: +14 field aliases, schema-level numeric coercions, `extractRepairNotes` for round-tripping repair hints.

### 2. Design System — 17 Tools + Deslop

The `/design` skill system uses work-pattern-first composition (7 patterns: Monitor, Operate, Compare, Configure, Learn, Decide, Explore) and a 10-smell catalog to detect AI-generated design tells.

**New in v0.33.0**: `deslop` tool — requires all 3 diagnostic reports, then applies 10 antidotes with strict fix ordering (composition → color → type → depth → motion → decoration).

### 3. DeepSeek Outperforming Opus 4.7

The 21x cost reduction comes from: cheaper model ($0.95/$3.15 vs $5/$25) × fewer retry spirals (repairs eliminate failed tool calls) × lower token waste (schema coercions prevent failures entirely). DeepSeek V4 Pro beats Opus 4.7 6/10 times on internal evals.

### 4. Model Catalog (28 models)

| New Model | Key Feature |
|---|---|
| Claude Opus 4.8 | New Anthropic flagship |
| MiniMax M3 | Frontier + native multimodality + reasoning |
| Qwen 3.7 Plus | Budget reasoning with vision |
| Step 3.7 Flash | Multimodal sparse-MoE |
| Nemotron 3 Ultra | 550B open reasoning |

### 5. New Systems (v0.33.0)

- **Taste System**: `taste-1` neuro-symbolic model with 3-tier storage (project/global/remote), uses Kimi K2.5 for onboarding
- **Context Compaction**: 3-tier auto-compaction (50%/80%/90% thresholds), CompactAgent using DeepSeek V4 Pro
- **Retry System**: Two layers (5 attempts auxiliary, 10 main), error classification, per-attempt telemetry

---

## Source Structure

```
source/
├── tool-repair/
│   ├── repair-system.js    # Core validate-then-repair pipeline (5 rules, 60 aliases)
│   ├── pre-parse.js        # Pre-parse strategies (JSON repair, control char escaping)
│   └── read-file-defaults.js # Relational defaults (offset/limit)
├── models/
│   ├── catalog.js          # 28 models + provider routing + legacy aliases
│   └── pricing.js          # Per-provider pricing + subscription plans
├── agents/
│   └── builtin-agents.js   # Explore + Plan agents
└── tools/
    ├── self-knowledge.js   # Product knowledge tool
    └── skill-loader.js     # Skill resolution logic
```

---

## Dependency Upgrades

| Package | v0.28.1 → v0.33.0 |
|---|---|
| Zod | v3 → v4 (`^4.0.17`) |
| Vercel AI SDK | earlier → `^6.0.116` |
| React | 18.x → `^19.1.7` |
| OpenTelemetry | earlier → `^2.0.0` |
| Commander | earlier → `^14.0.0` |

---

## Branch History

| Branch | Version | Content |
|---|---|---|
| `main` | v0.28.1 | Original decompilation |
| `decompile-v0.33.0` | v0.33.0 | This branch — full v0.33.0 analysis |
