# Deslop Mode — Deep Analysis

> Reverse engineered from `command-code@0.33.0`
> Source: `skills/design/references/deslop.md` (210 lines) + bundle tool registry

Deslop is the 17th design tool in Command Code's design skill system, and the first tool in a new **"fix"** group. It is the surgical response to the problem the `smell` tool diagnoses: AI-generated design that looks generic, templated, and authorless.

Where `smell` detects, `deslop` removes and replaces. It is not a polish pass. It is not a redesign. It is targeted excision of generic patterns with intentional replacements.

---

## Table of Contents

- [What Deslop Is](#what-deslop-is)
- [Where It Fits in the Tool System](#where-it-fits-in-the-tool-system)
- [Prerequisites: The Three-Report Gate](#prerequisites-the-three-report-gate)
- [Priority Triage: Reports as Fix Queue](#priority-triage-reports-as-fix-queue)
- [The 10 Antidotes](#the-10-antidotes)
- [The Domain Default Trap](#the-domain-default-trap)
- [Fix Order: Ripple Discipline](#fix-order-ripple-discipline)
- [Verification: Four Checks](#verification-four-checks)
- [What Deslop Refuses](#what-deslop-refuses)
- [Architecture Significance](#architecture-significance)
- [Comparison to Existing Tools](#comparison-to-existing-tools)

---

## What Deslop Is

Deslop answers a single question: **"Would a stranger say 'AI made that' without hesitation?"**

If the answer is yes, the design has slop — generic patterns that came from a model's pretraining distribution rather than from deliberate decisions. Deslop reads all three diagnostic reports (smell, checkup, review), extracts every finding, and systematically replaces each generic tell with an authored choice.

The key constraint: **every replacement must be a real decision, not a different default.** Swapping blue-violet gradient for green gradient is not deslop. Building a palette with domain-specific justification is.

From `deslop.md`:
> "I don't repaint, I don't polish, and I don't add new effects. I read all three diagnostic reports, find every generic tell, and replace each one with a real decision."

---

## Where It Fits in the Tool System

v0.33.0's design tool registry introduces a new group structure:

```javascript
var cx = [
  // Audit group (3 tools)
  { name: "checkup",     group: "audit" },
  { name: "smell",       group: "audit" },
  { name: "review",      group: "audit" },

  // Fix group (1 tool) — NEW GROUP
  { name: "deslop",      group: "fix" },

  // Systems group (4 tools)
  { name: "typeset",     group: "systems" },
  { name: "recolor",     group: "systems" },
  { name: "motion",      group: "systems" },
  { name: "interaction", group: "systems" },

  // Compose group (2 tools)
  { name: "relayout",    group: "compose" },
  { name: "responsive",  group: "compose" },

  // Build group (3 tools)
  { name: "redesign",    group: "build" },
  { name: "tokenize",    group: "build" },
  { name: "setup",       group: "build" },

  // Ship group (4 tools)
  { name: "finish",      group: "ship" },
  { name: "refine",      group: "ship" },
  { name: "voice",       group: "ship" },
  { name: "surface",     group: "ship" },
];
```

**Key changes from v0.28.1:**
1. **New "fix" group** created for deslop — positioned between audit and systems
2. **`create` removed from programmatic registry** — demoted to internal routing target (still referenced in SKILL.md's bare `/design` logic and in `create.md`)
3. **Total tools in registry: 17** (was 16 in v0.28.1, but `create` out, `deslop` in = net +0; however `create` was position 13 in v0.28.1 and `deslop` is the new entry)

The position of the "fix" group between audit and systems encodes a workflow:
```
Audit (find problems) → Fix (remove slop) → Systems (build proper systems) → ...
```

---

## Prerequisites: The Three-Report Gate

Deslop is the only tool that **requires all three diagnostic reports** before it will touch any file:

```
Before I touch anything, I check .commandcode/design/ for:
  - smell-report.md
  - checkup-report.md
  - review-report.md

If any report is missing, I generate it before proceeding.
```

This is stricter than any other tool. Most tools check for reports opportunistically — "if any exist, read them." Deslop mandates all three. Missing reports are generated on the spot by invoking the corresponding audit mode.

**Why all three?** Each report surfaces a different failure class:

| Report | What It Catches | Priority |
|---|---|---|
| `checkup-report.md` | Structural health: readability, usability, responsiveness, speed, accessibility | **Critical vitals first** |
| `review-report.md` | Design judgment: first impression, hierarchy, color voice, type voice, interaction feel | **Failures second** |
| `smell-report.md` | AI tells: tech gradient, center stack, feature tile grid, etc. | **Smells last** |

A smell might be faint and tolerable. A critical checkup vital blocks shipping. The triage order ensures deslop doesn't optimize aesthetics while the foundation is broken.

---

## Priority Triage: Reports as Fix Queue

Deslop reads all three reports front-to-back, then extracts and ranks every finding:

1. **Critical checkup vitals** — anything scored Critical blocks shipping
2. **Review failures** — low-scoring lenses (first impression, hierarchy, color, type, interaction)
3. **Strong smells** — clustered or strong tells from the smell report
4. **Faint smells** — isolated tells that get cleaned last

For each finding:
1. **Name the reflex** — what lazy default produced this pattern
2. **Pick a deliberate replacement** — tied to the project, not a different default
3. **Apply to real files** — no mockups, no commentary-only passes
4. **Verify** — old pattern gone, new choice reads as intentional

> "I fix every finding the reports name. I do not skip faint smells. A few faint smells clustered in one section is a strong smell in waiting."

---

## The 10 Antidotes

Each of the 10 tracked smells from `smell.md` has a specific antidote strategy:

### 1. Tech Gradient
**Smell**: Blue-violet, indigo-cyan, purple-to-teal glossy energy.
**Antidote**: Build palette from domain, not industry. Logistics → slate/amber. Reading app → paper/ink. Refuse purple-to-cyan as a category reflex.

### 2. Generic Tech Hue
**Smell**: Blue-purple as primary identity for anything technical.
**Antidote**: Replace with domain-justified hue. Water data → teal (earned). Gardens → green (earned). No anchor → unexpected saturation or temperature, committed fully.

### 3. Feature Tile Grid
**Smell**: Icon + heading + sentence, repeated uniformly, nothing prioritized.
**Antidote**: Break the grid. Lead with strongest feature, vary rhythm, or kill the section if filler. Cards are not wrong; equal cards with no priority are always wrong.

### 4. Accent Rail
**Smell**: Colored stripe on card side simulating structure.
**Antidote**: Remove. Differentiate with density, type weight, or border treatment. If differentiation isn't needed, the rail was decoration.

### 5. Unearned Blur
**Smell**: Frosted glass without a committed depth system.
**Antidote**: Remove blur. If depth needed, build real elevation with shadow/border/opacity. If not, element goes opaque and flat.

### 6. Stat Monument
**Smell**: Oversized numbers filling space where product story belongs.
**Antidote**: Replace with proof. Before/after, customer outcome, specific metric with context, or capability shown in action. Numbers need sentences, not monuments.

### 7. Icon Topper
**Smell**: Rounded-square icon above section headings with no function.
**Antidote**: Remove. If icon carries meaning, inline with heading. If not, gone.

### 8. Bounce Everywhere
**Smell**: Elastic easing applied to everything because it was available.
**Antidote**: Audit every animated element. Keep state-revealing motion, strip decorative. Use sharp deceleration (quart/quint/expo out). No bounce, no elastic.

### 9. Default Type
**Smell**: Common family with no voice, no scale, no reason.
**Antidote**: Either commit to current family with real reason and tuned scale, or switch to family with project-level intention. Inter is fine — Inter with no scale, no weight contrast, and no voice is not.

### 10. Center Stack
**Smell**: Everything centered because no composition decision was made.
**Antidote**: Choose composition from dominant work pattern (monitor/operate/compare/configure/learn/decide/explore). Centered is valid when symmetry is the right answer. Centered as default is not.

---

## The Domain Default Trap

Beyond the 10 tracked smells, deslop defines a **meta-smell**:

> "If the visual direction can be guessed from the industry alone, the design hasn't found itself yet."

Examples:
- Note-taking app → cream and rounded sans
- Developer tool → dark with terminal mono
- Health product → white and calm blue
- Legal platform → navy and serif

**Antidote**: Identify the domain default, break it in at least one dimension — unexpected saturation, different temperature, unusual composition, deliberate texture, or specific art direction that only fits this product.

This is the smell that catches everything the other 10 miss. A design can pass all 10 individual smell checks and still fail the domain default test if every choice was the median answer for its industry.

---

## Fix Order: Ripple Discipline

Deslop enforces a strict ordering because each fix ripples into the next:

```
1. Composition  — center stack, feature tile grid, accent rail (structural)
2. Color        — tech gradient, generic tech hue, domain default trap (mood)
3. Type         — default type (voice)
4. Depth        — unearned blur, stat monument (spatial)
5. Motion       — bounce everywhere (reacts to settled composition)
6. Decoration   — icon topper (last things to address)
```

> "I don't jump to color before fixing composition. A new palette on a broken layout is still broken."

This ordering encodes a dependency graph: composition is the foundation everything else sits on. Color sets mood on top of composition. Type gives voice. Depth is spatial. Motion reacts to everything above. Decoration is surface-level and addressed last.

---

## Verification: Four Checks

After all fixes, deslop runs four verification checks:

| Check | Question | Failure Mode |
|---|---|---|
| **Stranger test** | Would a stranger still say "AI made that" without hesitation? | Go back to reports, look for dismissed tells |
| **Regression check** | Did fixes break anything new? | Scan for new tension, whiplash, introduced smells |
| **Reality check** | Are changes real and visible in actual files? | Commentary-only passes don't count |
| **Judgment check** | Would a working designer approve each decision? | Not just accept — actively approve |

If any check fails, deslop returns to the reports — not to polish, but to finish work the reports already defined. It does not invent new work.

---

## What Deslop Refuses

The refusal list defines the tool's character:

- Fixing a smell by swapping in a different AI default
- Removing a smell without replacing it with a real decision
- Polishing around the smell instead of removing it
- Calling a recolor pass a deslop pass
- Fixing only the hero when the smell is structural
- Treating Inter as wrong when it is clearly intentional
- Treating all centered layouts as bad when symmetry is the right lane
- Adding decoration to hide generic structure
- Creating any reports, summaries, or documentation beyond the work itself

The most important refusal: **"Fixing a smell by swapping in a different AI default."** This is the difference between deslop and a naive "make it look different" pass. Changing blue-violet to green-teal is not deslop. Building a palette with a reason tied to this specific product is.

---

## Architecture Significance

### 1. Closing the Audit-to-Action Loop

Before deslop, the workflow was:
```
/design smell  → writes smell-report.md → user reads → user runs /design redesign or /design refine
```

With deslop:
```
/design deslop → reads ALL reports → triages → fixes everything → verifies
```

Deslop is the first tool that explicitly consumes all three report types as input and produces fixes as output. It closes the loop between diagnosis and treatment.

### 2. The "Fix" Group

The new "fix" group sits between audit and systems. This creates a natural progression:

```
Audit → Fix → Systems → Compose → Build → Ship
```

The "fix" group could eventually contain more tools — deslop targets AI smells specifically, but there could be tools for fixing accessibility issues, performance problems, or responsive failures that the audit tools find.

### 3. Report-Driven Design

Deslop formalizes the pattern of **reports as structured input to design tools**. The three reports serve as a machine-readable diagnosis that the model can act on systematically. This is different from how other tools use reports (opportunistic, advisory). For deslop, reports are mandatory prerequisites.

### 4. Anti-AI-Slop as a First-Class Concern

Giving anti-slop its own tool and its own group signals that this is not a secondary concern. AI-generated design that looks AI-generated is considered a category of defect on par with accessibility failures or broken responsive behavior.

---

## Comparison to Existing Tools

| Dimension | `smell` | `refine` | `redesign` | `deslop` |
|---|---|---|---|---|
| **Input** | Interface code | Interface + optional report | Interface + optional report | **All 3 reports required** |
| **Output** | Report only | Changed files | Changed files | Changed files |
| **Scope** | Detection only | Character change | Full visual transformation | Targeted smell removal |
| **Report dependency** | Creates reports | Reads if available | Reads if available | **Requires all 3** |
| **Verification** | Score (0-10 inverted) | Truthful completion | Truthful completion | **4-point designer verification** |
| **Focus** | Identify problems | Strengthen what works | Replace everything | **Excise slop, replace with intent** |

Deslop is the scalpel. Redesign is the wrecking ball. Refine is the sandpaper. Smell is the X-ray.
