# Command Code Design Skill System — v0.33.0

> Decompiled from `command-code@0.33.0` — bundled skill files at
> `/skills/design/SKILL.md` + 25 reference docs in `/skills/design/references/`
> Previous analysis: `DESIGN-SKILLS.md` (v0.28.1)

The design skill system in v0.33.0 is evolutionary, not revolutionary. The orchestrator (`SKILL.md`) is structurally the same. The design philosophy, work patterns, truthful completion, and smell catalog are unchanged. What's new is **deslop** — a 17th tool that closes the loop between diagnosis and treatment — and a **programmatic tool registry** that formalizes tool grouping and routing.

---

## Table of Contents

- [What Changed From v0.28.1](#what-changed-from-v0281)
- [Architecture](#architecture)
- [The 17 Tools](#the-17-tools)
- [The New "Fix" Group](#the-new-fix-group)
- [The 25 Reference Documents](#the-25-reference-documents)
- [Design Philosophy: Unchanged](#design-philosophy-unchanged)
- [The 7 Work Patterns: Unchanged](#the-7-work-patterns-unchanged)
- [The Smell System: Unchanged + Deslop Integration](#the-smell-system-unchanged--deslop-integration)
- [Report System: Now with Full Loop](#report-system-now-with-full-loop)
- [Programmatic Tool Registry](#programmatic-tool-registry)
- [The `create` Demotion](#the-create-demotion)
- [Prompt Invariants: Unchanged](#prompt-invariants-unchanged)
- [Two Registers: Unchanged](#two-registers-unchanged)
- [Truthful Completion: Unchanged](#truthful-completion-unchanged)
- [File Inventory](#file-inventory)

---

## What Changed From v0.28.1

| Area | v0.28.1 | v0.33.0 | Change |
|---|---|---|---|
| Tools in registry | 16 | 17 | +deslop, -create (demoted) |
| Tool groups | 5 (audit, systems, compose, build, ship) | 6 (+fix) | New "fix" group |
| Reference docs | 24 | 25 | +deslop.md (210 lines) |
| SKILL.md | ~389 lines | ~389 lines | Minor wording updates |
| Design philosophy | 7 sections | 7 sections | Unchanged |
| Work patterns | 7 patterns | 7 patterns | Unchanged |
| Smell catalog | 10 odors | 10 odors | Unchanged |
| Report types | 3 | 3 | Unchanged |
| Scoring systems | /60, /50, /10 | /60, /50, /10 | Unchanged |
| Truthful completion | Applied-only rule | Applied-only rule | Unchanged |

---

## Architecture

```
User types /design [tool] [target]
       |
       v
[SKILL.md] — reads prompt, picks tool, loads references
       |
       v
[Programmatic registry] — validates tool name, determines group
       |
       v
[Reference docs] — discipline-specific rules (only loaded as needed)
       |
       v
[Report check] — reads existing reports from .commandcode/design/
       |
       v
[Real file edits] — HTML, CSS, JS, Tailwind — not mockups
       |
       v
[Verification] — squint test, 5-minute test, truthful completion
```

The v0.33.0 architecture adds a **programmatic registry layer** (`cx` array + `ux`/`dx` lookup maps) between the SKILL.md orchestrator and the reference docs. This provides:
- Structured tool lookup by name
- Group classification for each tool
- Reference file mapping
- Description lookup

---

## The 17 Tools

| Group | Tool | What It Does | Reference File |
|---|---|---|---|
| **Audit** | `checkup` | Rapid health scan: 6 vitals, traffic lights, `/60` score | `checkup.md` |
| **Audit** | `smell` | AI-tells catalog: detect generic patterns, `/10` inverted | `smell.md` |
| **Audit** | `review` | Design review: 5 lenses, scoring, walkthrough, `/50` | `review.md` |
| **Fix** | `deslop` | Remove AI slop from design surface | `deslop.md` **NEW** |
| **Systems** | `typeset` | Type system: scale, measure, hierarchy, font behavior | `typeset.md` |
| **Systems** | `recolor` | Color system: OKLCH palette, roles, contrast, state | `color.md` |
| **Systems** | `motion` | Page-wide motion system, tune existing animations | `motion.md` |
| **Systems** | `interaction` | States, affordances, feedback, touch targets | `interaction.md` |
| **Compose** | `relayout` | Structural composition change, not spacing | `relayout.md` |
| **Compose** | `responsive` | Recompose across screens, devices, input modes | `responsive.md` |
| **Build** | `redesign` | Complete visual transformation of existing UI | `redesign.md` |
| **Build** | `tokenize` | Extract repeated patterns into reusable components | `tokenize.md` |
| **Build** | `setup` | Create/update project `brief.md` design context | `setup.md` |
| **Ship** | `finish` | Final pre-ship pass: systematic friction removal | `finish.md` |
| **Ship** | `refine` | Character change: push, settle, strip, proof | `refine.md` |
| **Ship** | `voice` | Brand identity, art direction, visual lane | `voice.md` |
| **Ship** | `surface` | Harden product surface: states, data, density, access | `surface.md` |

---

## The New "Fix" Group

v0.33.0 introduces the **fix** group, positioned between audit and systems. Currently contains only `deslop`, but the group is designed to hold tools that act on diagnostic findings.

The workflow progression is now:

```
1. AUDIT   → Diagnose (checkup, smell, review)
2. FIX     → Remove identified problems (deslop)
3. SYSTEMS → Build proper foundations (typeset, recolor, motion, interaction)
4. COMPOSE → Structural layout (relayout, responsive)
5. BUILD   → Major changes (redesign, tokenize, setup)
6. SHIP    → Polish and harden (finish, refine, voice, surface)
```

The fix group formalizes a step that was previously implicit — after diagnosis, there should be a targeted fix pass before building new systems.

---

## The 25 Reference Documents

### New in v0.33.0

| File | Lines | Tool | Key Concept |
|---|---|---|---|
| `deslop.md` | 210 | `deslop` | 3-report prerequisite, 10 antidotes, fix order, 4-point verification, domain default trap |

### Unchanged from v0.28.1

All 24 previous reference documents are present and unchanged:

**Discipline References (10):**
`color.md` (167), `typeset.md` (171), `layout.md` (159), `motion.md` (203), `interaction.md` (169), `responsive.md` (180), `border.md` (156), `shadow.md` (138), `writing.md` (153), `button.md` (193)

**Tool-Specific References (12):**
`checkup.md` (161), `smell.md` (198), `review.md` (163), `create.md` (288), `redesign.md` (187), `refine.md` (194), `relayout.md` (198), `finish.md` (154), `voice.md` (184), `surface.md` (164), `setup.md` (120), `tokenize.md` (125)

**Templates (2):**
`design-html.md` (225), `report-html.md` (236)

**Total: 25 files, ~4,500 lines of design instruction** (up from ~4,300 in v0.28.1).

---

## Design Philosophy: Unchanged

All 7 sections of the design philosophy in SKILL.md are unchanged:

1. **Color is Mood, Not Decoration** — OKLCH, 4 commitment levels, 60-30-10, refuse generic tech hue
2. **Type is the Shape of Thought** — 60-76ch measure, reading distance equation, hierarchy rule of 3
3. **Layout is Directing a Movie** — 1-4-9 rhythm, 3-plane depth, composition mass, cliffhanger
4. **Motion is Character** — Physics engine, 3-beat entrance, stagger cascade, prefers-reduced-motion
5. **Interaction is Architecture** — 9 states of being, focus rings, touch targets, undo beats confirm
6. **Responsive is Orchestration** — Viewport gauntlet, thumb zone, input mode detection, container queries
7. **Copy is Voice** — One verb per button, errors as recovery paths, empty states teach

---

## The 7 Work Patterns: Unchanged

| Pattern | Composition Follows |
|---|---|
| **Monitor** | Status boards, feeds, alert columns, metric clusters |
| **Operate** | Command bars, inspectors, side panels, direct controls |
| **Compare** | Tables, matrices, split views, ranked lists |
| **Configure** | Grouped settings, forms, summaries, commit areas |
| **Learn** | Article flow, walkthrough rhythm, progressive sections |
| **Decide** | Focused pitch, proof, risk reduction, dominant action |
| **Explore** | Search, filters, maps, galleries, clusters |

---

## The Smell System: Unchanged + Deslop Integration

The 10 tracked odors are identical to v0.28.1:

1. Tech gradient
2. Generic tech hue
3. Feature tile grid
4. Accent rail
5. Unearned blur
6. Stat monument
7. Icon topper
8. Bounce everywhere
9. Default type
10. Center stack

**What's new**: Deslop provides a **specific antidote** for each odor plus the **domain default trap** meta-smell. The smell tool detects; deslop excises and replaces. This completes the diagnosis → treatment pipeline that was previously left to the user or to the general-purpose `refine`/`redesign` tools.

---

## Report System: Now with Full Loop

v0.28.1 had reports as diagnostic outputs. v0.33.0 closes the loop:

```
v0.28.1:  /design smell → smell-report.md → (user decides what to do)
v0.33.0:  /design deslop → reads ALL reports → triages → fixes → verifies
```

The three reports are unchanged:

| Report | Source Tool | Score | Location |
|---|---|---|---|
| `checkup-report.md` | `checkup` | `/60` (6 vitals × 10) | `.commandcode/design/` |
| `review-report.md` | `review` | `/50` (5 lenses × 10) | `.commandcode/design/` |
| `smell-report.md` | `smell` | `/10` inverted | `.commandcode/design/` |

What changes is how they're consumed. Deslop is the first tool to require all three and to apply a systematic triage across them.

---

## Programmatic Tool Registry

v0.33.0 introduces structured data for the tool list:

```javascript
// Tool registry with name, description, reference, and group
var cx = [
  { name: "checkup",     description: "Fast health scan with clear prescriptions",
    reference: "checkup",     group: "audit" },
  { name: "deslop",      description: "Remove AI slop from the design surface",
    reference: "deslop",      group: "fix" },
  // ... all 17 tools
];

// Lookup maps
var ux = Object.fromEntries(cx.map(e => [e.name, e.reference]));
var dx = Object.fromEntries(cx.map(e => [e.name, e.description]));

// Validation
function isDesignMode(e) { return e in ux; }
```

This replaces a more ad-hoc routing approach. The registry enables:
- `isDesignMode()` validation for tool names
- Command menu generation from structured data
- Group-based tool organization in the UI
- Reference file resolution from tool name

---

## The `create` Demotion

In v0.28.1, `create` was the 13th tool in the skill table. In v0.33.0, it is:

- **Not in the programmatic registry** (`cx` array)
- **Not in SKILL.md's tool table**
- **Still referenced** in SKILL.md's bare `/design` routing logic
- **Still has its reference file** (`create.md`, 288 lines)

The demotion means:
1. `/design create` no longer appears in the command menu
2. Users cannot directly invoke create as a named tool
3. The system still uses it internally when bare `/design` is run on an empty project

This makes sense architecturally — `create` is a bootstrap operation, not a regular design tool. It fires once when there's nothing to work on, then the other 17 tools take over.

---

## Prompt Invariants: Unchanged

The same 7 invariants extracted before designing:
- **Name** — exact product/brand/project name
- **Category** — what kind of thing this is
- **User** — who is arriving and under what pressure
- **Job** — what the user is trying to do (mapped to work pattern)
- **Artifact** — the real domain object
- **Evidence** — what builds trust
- **Drift to refuse** — inherited visuals/layouts from previous runs

---

## Two Registers: Unchanged

- **Brand** — marketing, landing, campaign, portfolio. Emotional reaction is the deliverable.
- **Product** — app UI, admin, dashboards, tools. Trust through consistency and speed.

---

## Truthful Completion: Unchanged

The applied-only rule is identical:
- Only claim work you can point to in changed files
- Animations must be visible, not just declared
- Layout changes must show different composition, not just spacing
- State claims require a way to see the state
- Final response is a checked account, not a hopeful description

---

## File Inventory

```
skills/
├── agent-browser/
│   └── SKILL.md                    # Browser automation
└── design/
    ├── SKILL.md                    # Main orchestrator (~389 lines)
    └── references/
        ├── border.md               # Edge system (156 lines)
        ├── button.md               # Button library (193 lines)
        ├── checkup.md              # Health scan audit (161 lines)
        ├── color.md                # Color system (167 lines)
        ├── create.md               # Build from scratch (288 lines) — demoted from tool table
        ├── design-html.md          # Design system doc template (225 lines)
        ├── deslop.md               # AI slop removal (210 lines) — NEW in v0.33.0
        ├── finish.md               # Pre-ship pass (154 lines)
        ├── interaction.md          # Behavior & states (169 lines)
        ├── layout.md               # Spatial composition (159 lines)
        ├── motion.md               # Animation & timing (203 lines)
        ├── redesign.md             # Visual transformation (187 lines)
        ├── refine.md               # Character change (194 lines)
        ├── relayout.md             # Structural recomposition (198 lines)
        ├── report-html.md          # Audit report template (236 lines)
        ├── responsive.md           # Cross-device adaptation (180 lines)
        ├── review.md               # Design review (163 lines)
        ├── setup.md                # Brief creation (120 lines)
        ├── shadow.md               # Depth & elevation (138 lines)
        ├── smell.md                # AI-tells detection (198 lines)
        ├── surface.md              # Product UI hardening (164 lines)
        ├── tokenize.md             # Token extraction (125 lines)
        ├── typeset.md              # Typography system (171 lines)
        ├── voice.md                # Brand identity (184 lines)
        └── writing.md              # UX copy (153 lines)
```

**Total: 2 skills, 27 files, ~4,500 lines of design instruction.**
