# Command Code Design Skill System — Deep Dive

> Decompiled from `command-code@0.28.1` — bundled skill files at  
> `/skills/design/SKILL.md` + 24 reference docs in `/skills/design/references/`

Command Code ships a complete **AI design partner** as a bundled skill. It is not a Figma plugin or a component library. It is a 389-line orchestrator (`SKILL.md`) backed by 24 specialized reference documents — each one a self-contained discipline brief that teaches the model how to think about color, type, layout, motion, interaction, copy, and more.

When a user types `/design`, the model reads `SKILL.md`, identifies the right tool from the prompt, loads only the reference docs it needs, and edits real files. No markdown mockups. No confirmation loops. The output is working HTML/CSS/JS.

---

## Table of Contents

- [Architecture](#architecture)
- [The Orchestrator: SKILL.md](#the-orchestrator-skillmd)
- [The 16 Tools](#the-16-tools)
- [The 24 Reference Documents](#the-24-reference-documents)
- [Design Philosophy](#design-philosophy)
- [The 7 Work Patterns](#the-7-work-patterns)
- [The Smell System](#the-smell-system)
- [Report System](#report-system)
- [Prompt Invariants](#prompt-invariants)
- [Two Registers: Brand vs Product](#two-registers-brand-vs-product)
- [The Truthful Completion Rule](#the-truthful-completion-rule)
- [Agent Browser Skill](#agent-browser-skill)
- [Bundled Skill Loading](#bundled-skill-loading)
- [File Inventory](#file-inventory)

---

## Architecture

```
User types /design [tool] [target]
       |
       v
[SKILL.md] — reads prompt, picks tool, loads references
       |
       v
[Reference docs] — discipline-specific rules (only loaded as needed)
       |
       v
[Real file edits] — HTML, CSS, JS, Tailwind — not mockups
       |
       v
[Verification] — squint test, 5-minute test, truthful completion check
```

The skill system lives at two levels:

1. **`SKILL.md`** (389 lines) — the orchestrator. Contains routing logic, design philosophy, composition rules, quality control principles, and the tool table.
2. **`references/*.md`** (24 files, ~3,800 lines total) — discipline-specific reference documents. Each one governs a single visual discipline or tool mode.

The model loads references **lazily** — only what the current task needs. A `/design recolor` loads `color.md`. A `/design finish` loads `border.md`, `shadow.md`, `motion.md`, `button.md`, and `writing.md`. This keeps context windows lean.

---

## The Orchestrator: SKILL.md

The main `SKILL.md` is the entry point for every `/design` command. It defines:

### Routing Logic

```
1. Pick a tool — verb in prompt picks itself (checkup, finish, recolor, typeset)
2. Pull context — read brief.md if it exists, never block if absent
3. Ship — apply rules + reference, edit real files, no mockups
```

### Bare `/design` Routing (No Arguments)

When the user runs `/design` with no tool and no prompt, the skill follows a decision tree:

1. **Check for interface code** — `.html`, `.css`, `.js`, `.tsx`, `.vue`, `.svelte`, or a `package.json` listing a UI framework
2. **If no code found** → read `create.md`, build interface from scratch
3. **If code exists** → check `.commandcode/design/` for existing reports (`checkup-report.md`, `review-report.md`, `smell-report.md`)
4. **If report exists** → read it, pick `redesign`, `relayout`, or `refine` based on findings, apply changes
5. **If no report** → run an audit (`smell`, `checkup`, or `review`), write the report, then immediately apply fixes

The skill never stops after writing a report — the report is the diagnostic, the design change is the treatment.

---

## The 16 Tools

The skill exposes 16 tools organized into 5 groups:

| Group | Tool | What It Does | Reference File |
|---|---|---|---|
| **Audit** | `checkup` | Rapid health scan with 6 vitals, traffic-light scoring, `/60` scale | `checkup.md` |
| **Audit** | `smell` | AI-tells catalog — detect generic/generated design patterns, `/10` inverted scale | `smell.md` |
| **Audit** | `review` | Honest design review with 5 lenses, scoring, walkthrough, `/50` scale | `review.md` |
| **Systems** | `typeset` | Build type system: scale, measure, hierarchy, font behavior | `typeset.md` |
| **Systems** | `recolor` | Build color system: OKLCH palette, roles, contrast, state color | `color.md` |
| **Systems** | `motion` | Add page-wide motion system, then tune existing motion | `motion.md` |
| **Systems** | `interaction` | Add missing behavior, states, affordances, feedback, targets | `interaction.md` |
| **Compose** | `relayout` | Change structural composition, not just spacing | `relayout.md` |
| **Compose** | `responsive` | Recompose across screens, devices, input modes, contexts | `responsive.md` |
| **Build** | `redesign` | Complete visual transformation of existing interface | `redesign.md` |
| **Build** | `tokenize` | Pull repeated patterns into reusable tokens and components | `tokenize.md` |
| **Build** | `setup` | Create or update project `brief.md` design context | `setup.md` |
| **Build** | `create` | Build new interface from scratch | `create.md` |
| **Ship** | `finish` | Final pre-ship pass; systematic friction removal | `finish.md` |
| **Ship** | `refine` | Change character: push, settle, strip, proof, activate, texture | `refine.md` |
| **Ship** | `voice` | Sharpen brand identity, art direction, visual lane | `voice.md` |
| **Ship** | `surface` | Harden real product surface: states, data, density, access | `surface.md` |

Each tool has a **"bar"** — a minimum scope requirement. For example, `/design recolor` must define and apply roles for canvas, surface, text, muted text, border, primary action, secondary action, focus, selection, success, warning, error, and disabled. Changing one button color is not enough.

---

## The 24 Reference Documents

Each reference doc is a self-contained discipline brief. They're not suggestions — they're the rules the model works inside.

### Discipline References (available to any tool)

| File | Lines | Discipline | Key Concept |
|---|---|---|---|
| `color.md` | 167 | Color system | OKLCH palettes, 4 commitment levels (whisper/statement/conversation/flood), 60-30-10 rule, domain default trap |
| `typeset.md` | 171 | Typography | Physical-object font method, reading distance equation, content character counter, hierarchy rule of 3 |
| `layout.md` | 159 | Spatial composition | 1-4-9 rhythm system, 3-plane depth model, composition mass, cliffhanger principle |
| `motion.md` | 203 | Animation & timing | Physics engine (mass/damping/spring/velocity), 3-beat entrance, stagger cascade, timing reference table |
| `interaction.md` | 169 | Behavior & states | 9 states of being, focus architecture, touch physicality, undo beats confirm |
| `responsive.md` | 180 | Cross-device | Viewport gauntlet (320–2560px), thumb zone, input mode detection, container queries |
| `border.md` | 156 | Edge system | Edges follow composition, weight/color/radius/focus/dividers/tables/cards/inputs |
| `shadow.md` | 138 | Depth & elevation | Light source from above, semantic elevation, dark theme surface lightness over shadow |
| `writing.md` | 153 | UX copy | Buttons name actions, errors are recovery paths, empty states teach the space |
| `button.md` | 193 | Button library | Hierarchy (one primary per screen), 7 states, motion (scale 0.97–0.98 on press), text names action |

### Tool-Specific References

| File | Lines | Tool | Key Concept |
|---|---|---|---|
| `checkup.md` | 161 | `checkup` | 6 vitals (intentionality, readability, usability, responsiveness, speed, accessibility), `/60` score |
| `smell.md` | 198 | `smell` | 10 tracked odors (tech gradient, feature tile grid, accent rail, unearned blur, stat monument, etc.) |
| `review.md` | 163 | `review` | 5 design lenses, `/50` score, experience walkthrough, smell lens cross-check |
| `create.md` | 288 | `create` | Build bar, divergence check, 6-layer build process (structure→space→surface→states→response→motion) |
| `redesign.md` | 187 | `redesign` | Composition reset, full-surface bar, 8 possible directions (minimal Swiss, editorial, brutalist, etc.) |
| `refine.md` | 194 | `refine` | 7 moves: push, settle, strip, proof, activate, texture, push past limits |
| `relayout.md` | 198 | `relayout` | Structural change bar, 6 composition lanes, section order by user need |
| `finish.md` | 154 | `finish` | Applied-only rule, subtraction, edge states (empty/error/loading/focus/mobile/performance/copy) |
| `voice.md` | 184 | `voice` | Proof object requirement, 5 brand lanes, first 1.5 seconds, imagery physicality |
| `surface.md` | 164 | `surface` | Product register, operator familiarity, density over air, functional motion only |
| `setup.md` | 120 | `setup` | Creates `brief.md` design constitution, reads repo before asking, one file one source |
| `tokenize.md` | 125 | `tokenize` | Extraction bar (must change implementation), naming by meaning not value, component smallest API |

### Template Files (not for product UI)

| File | Lines | Purpose |
|---|---|---|
| `design-html.md` | 225 | Design system documentation template — dark industrial CMD aesthetic, corner boxes, monospaced labels |
| `report-html.md` | 236 | Smell/checkup/review report template — Tailwind CDN, dark canvas, structured tables, score blocks |

Both templates carry a `MODEL-ONLY BOUNDARY` comment:
> *"Do not use this layout, color, border treatment, corner-box style, grid, or CMD report aesthetic as inspiration for product UI, landing pages, dashboards, app screens, components, or generated interfaces."*

---

## Design Philosophy

The `SKILL.md` distills a complete design philosophy into 7 sections. These aren't guidelines — they're the rules the model uses to make every decision.

### Color is Mood, Not Decoration

- Build palettes in **OKLCH** (calibrated to human vision, not arithmetic)
- Four commitment levels: **whisper** (near-neutral), **statement** (one hue owns surface), **conversation** (several named roles), **flood** (surface IS the color)
- **60-30-10 rule**: 60% narrator, 30% supporting, 10% protagonist
- Tint neutrals toward brand hue (under 0.02 chroma)
- **Refuse the generic tech hue** — blue-violet CTAs signal nothing
- Run colorblind simulation (deuteranopia, protanopia, tritanopia)

### Type is the Shape of Thought

- Body measure: **60–76ch** (wider loses the line, narrower feels breathless)
- **Reading Distance Equation**: `optimal_size = (distance_in_inches × 0.035) × 16`
- **Hierarchy Rule of 3**: hook (heading), bridge (subtitle), detail (body)
- Light on dark needs compensation (more line-height, heavier weight)
- System fonts are legitimate for product UI

### Layout is Directing a Movie

- **1-4-9 Rhythm System**: 1 unit (4px micro), 4 units (16px component), 9 units (36px section)
- **3-Plane Depth Model**: background (-1/0), content (default), attention (highest)
- **Composition Mass Calculator**: `Mass = size × contrast × distance-from-center`
- **Cliffhanger Principle**: leave 40–80px of next section visible
- Cards signal an unchosen layout

### Motion is Character

- **Physics Engine**: mass (modals=2, tooltips=0.5), damping (0.8 cards, 0.95 dropdowns), spring tension (170 crisp, 120 relaxed)
- **3-Beat Entrance**: 0ms (scale 0.95, opacity 0) → 150ms (scale 1.02, opacity 0.8) → 250ms (scale 1, opacity 1)
- **Stagger Cascade**: `delay = index × 20ms + random_jitter(±5ms)`
- Animate `transform` and `opacity` only
- `prefers-reduced-motion` is not optional

### Interaction is Architecture

- **9 States of Being**: idle, hover, active, focused, loading, empty, error, disabled, overflow
- Focus rings: 2–3px width, offset, 3:1 contrast — never `outline: none` without replacement
- Touch targets: minimum 44×44px (48×48px comfortable)
- **Undo beats confirm** for recoverable actions

### Responsive is Orchestration

- **Viewport Gauntlet**: 320px, 375px, 768px, 1024px, 1440px, 2560px — every one, no exceptions
- **Thumb Zone**: bottom 25% reachable, primary actions there
- Detect input mode (`pointer: coarse`, `hover: hover`), not just screen size
- Container queries over page breakpoints for components

### Copy is Voice

- One verb per button — "Archive report", not "OK"
- Errors are recovery paths — tell what broke, why, what next
- Empty states teach the space — what belongs, why, what action fills it
- No exclamation points. Sentence case everywhere. Strip filler.

---

## The 7 Work Patterns

Every tool in the system starts by identifying the **dominant work pattern** of the surface. This is the most distinctive architectural choice in the skill:

| Pattern | What It Means | Composition Follows |
|---|---|---|
| **Monitor** | Status, alerts, metrics, recency, change | Status boards, feeds, alert columns, metric clusters |
| **Operate** | Commands, tools, canvas, direct manipulation | Command bars, inspectors, side panels, direct controls |
| **Compare** | Many items judged against criteria | Tables, matrices, split views, ranked lists |
| **Configure** | Choices, defaults, dependencies, preview | Grouped settings, forms, summaries, commit areas |
| **Learn** | Reading, orientation, reveal, progress | Article flow, walkthrough rhythm, progressive sections |
| **Decide** | Confidence, proof, risk, one next action | Focused pitch, proof, risk reduction, dominant action |
| **Explore** | Search, filtering, browsing, reversible movement | Search, filters, maps, galleries, clusters |

> "A centered hero, repeated cards, and pill buttons are allowed only when that pattern is the right answer to the work. They are not the house style."

Every reference doc repeats this framework. `color.md` describes what color does in each pattern. `motion.md` describes what movement is useful in each. `border.md` describes where edges matter. This creates a consistent decision framework across all 24 documents.

---

## The Smell System

The `smell` tool maintains a catalog of **10 tracked "odors"** — patterns that signal generic or AI-generated design:

| Odor | Detection |
|---|---|
| **Tech gradient** | Blue-violet, indigo-cyan, purple-to-teal on heroes/CTAs/cards |
| **Generic tech hue** | Blue-purple as primary identity for anything software-adjacent |
| **Feature tile grid** | Icon + heading + sentence, repeated uniformly, nothing prioritized |
| **Accent rail** | Colored stripe on card side pretending to be organization |
| **Unearned blur** | Frosted glass panels without a committed depth system |
| **Stat monument** | Oversized number cluster filling space where a product story belongs |
| **Icon topper** | Rounded-square icon above every section heading with no function |
| **Bounce everywhere** | Elastic easing applied because it was available |
| **Default type** | Common family used with no voice, no scale, no reason |
| **Center stack** | Everything centered because no composition decision was made |

Scoring is **inverted** — 10/10 means zero smells found (CLEAN), 0–2/10 means identity failure. Each odor scores 1 if absent, 0 if detected.

> "If a stranger can look at the design for two seconds and say 'AI made that' without hesitation, it has failed."

---

## Report System

Three audit tools produce structured reports:

| Tool | Markdown Report | HTML Report | Scoring |
|---|---|---|---|
| `checkup` | `.commandcode/design/checkup-report.md` | `.commandcode/design/checkup-report.html` | `/60` (6 vitals × 10pts) |
| `review` | `.commandcode/design/review-report.md` | `.commandcode/design/review-report.html` | `/50` (5 lenses × 10pts) |
| `smell` | `.commandcode/design/smell-report.md` | `.commandcode/design/smell-report.html` | `/10` inverted (0 = identity failure) |

HTML reports use a **dark industrial CMD aesthetic** defined in `report-html.md`: black background (#000), dashed borders (#222226), corner boxes, monospaced labels, Tailwind CDN. A `MODEL-ONLY BOUNDARY` comment prevents the model from using this aesthetic as inspiration for user-facing design.

**Report Continuity**: Reports are not archival. Every non-report tool checks `.commandcode/design/` for existing reports before making changes. Findings become implementation priorities. The model must explain which report findings were addressed and which were intentionally skipped.

---

## Prompt Invariants

Before designing anything, the model extracts invariants from the brief:

- **Name** — exact product/brand/project name (used as given, never renamed)
- **Category** — what kind of thing this is (first viewport makes category visible)
- **User** — who is arriving and under what pressure
- **Job** — what the user is trying to monitor/operate/compare/configure/learn/decide/explore
- **Artifact** — the real domain object (schedule, file, map, receipt, chart, queue, invoice, canvas...)
- **Evidence** — what would make the user trust the product works
- **Drift to refuse** — any visual/name/proof/layout inherited from a previous run

> "Before shipping, I check that the visible name, category, artifact, evidence, and composition all come from the current prompt. If the hero proof object could be moved into an unrelated product without becoming wrong, it is too generic."

---

## Two Registers: Brand vs Product

The skill operates in two distinct registers with different rules:

### Brand Register
Marketing, landing, campaign, portfolio, long-form editorial. Every visual decision is a creative choice. Color, type, motion, and art direction per section are fair game. The emotional reaction at arrival is the deliverable.

Five brand lanes: editorial/cultural/luxury, technical/developer/systems, consumer/lifestyle/tactile, studio/portfolio/experimental, campaign/launch/moment-driven.

### Product Register
App UI, admin panels, dashboards, internal tools. Trust through consistency and speed. Operators who open this screen daily should move without thinking. System fonts are legitimate. Familiarity can be a feature.

> "If the user pauses because the UI is clever, I made the wrong trade."

---

## The Truthful Completion Rule

The skill enforces a strict **applied-only rule** across all tools:

- "I only use 'added', 'fixed', 'changed', 'improved' when I can point to a real implementation change and see the effect"
- If animation is claimed, motion must be visible in the rendered UI — an unused keyframe doesn't count
- If layout change is claimed, the page must show different composition, not just spacing
- If states are claimed, there must be a way to see each state
- Before the final message, every claim is checked against actual file diffs

> "The final response must be a checked account of applied work, not a hopeful description of intended work."

---

## Agent Browser Skill

Alongside the design skill, Command Code bundles an **agent-browser** skill:

- **What it is**: Fast browser automation CLI for AI agents, built in Rust
- **Protocol**: Chrome/Chromium via CDP with accessibility-tree snapshots and compact `@eN` element refs
- **Core workflow**: `open <url>` → `snapshot -i` → `click @e1` / `fill @e2 "text"` → re-snapshot → `close`
- **Specialized skills**: Electron desktop apps (VS Code, Slack, Discord, Figma), Slack workspace automation, exploratory testing/QA/bug hunts
- **Self-updating docs**: `agent-browser skills get core` serves skill content matching the installed version

The SKILL.md is a discovery stub — the real workflow docs come from the CLI itself via `agent-browser skills get core`.

---

## Bundled Skill Loading

Skills are loaded from multiple directories in priority order (from `loadAllSkillSummaries`, line 25932):

| Priority | Location | Path |
|---|---|---|
| 1 | Global user skills | `~/.commandcode/skills/` |
| 2 | Global compat skills | `~/.agents/skills/` |
| 3 | Bundled skills | `<package-root>/skills/` |
| 4 | Project skills (CWD) | `.commandcode/skills/` |
| 5 | Project compat skills | `.agents/skills/` |
| 6 | Project skills (git root) | `<git-root>/.commandcode/skills/` |
| 7 | Project compat (git root) | `<git-root>/.agents/skills/` |

Each skill directory must contain a `SKILL.md` (or `skill.md`). The file's YAML frontmatter provides `name` and `description`. The bundled `resolveBundledSkillsDir()` (line 25816) walks up from the bundle's `import.meta.url` to find `package.json`, then returns the adjacent `skills/` directory.

Skills are deduplicated by name — project skills override bundled, global overrides project.

---

## File Inventory

All files shipped in `command-code@0.28.1` under `/skills/`:

```
skills/
├── agent-browser/
│   └── SKILL.md                    # Browser automation (74 lines)
└── design/
    ├── SKILL.md                    # Main orchestrator (389 lines)
    └── references/
        ├── border.md               # Edge system (156 lines)
        ├── button.md               # Button library (193 lines)
        ├── checkup.md              # Health scan audit (161 lines)
        ├── color.md                # Color system (167 lines)
        ├── create.md               # Build from scratch (288 lines)
        ├── design-html.md          # Design system doc template (225 lines)
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

**Total: 2 skills, 26 files, ~4,300 lines of design instruction.**

---

## What Makes This Unusual

This is not a component library, design token set, or Figma plugin. It is a **design operating system for language models** — a structured set of instructions that teaches an LLM how to think about visual design.

The key architectural choices:

1. **Work-pattern-first composition** — every tool starts by identifying what the surface does (monitor, operate, compare, etc.) before making any visual decision
2. **Lazy reference loading** — only the docs needed for the current task enter the context window
3. **Validate-then-repair applied to design** — audit tools produce reports, action tools consume them, the model must address findings
4. **Anti-AI-slop system** — the smell catalog explicitly detects and refuses generic patterns (tech gradients, feature tile grids, center stacks)
5. **Truthful completion enforcement** — the model cannot claim work it didn't do

The skill effectively encodes a senior designer's judgment into a structured format a language model can execute against real codebases.