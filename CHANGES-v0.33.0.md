# Changes: command-code v0.28.1 → v0.33.0

> High-level diff covering model catalog, tool repair, design system, dependencies, architecture, and pricing.

---

## Summary

| Area | v0.28.1 | v0.33.0 | Net Change |
|---|---|---|---|
| Bundle size | ~1.2MB | 1.46MB | +20% |
| Current models | 23 | 28 | +5 new models |
| Legacy aliases | 5 | 5 | Unchanged |
| Repair mechanisms | 13 | 16 | +3 (all schema-level) |
| Field aliases | 46 | 60 | +14 new aliases |
| Design tools (registry) | 16 | 17 | +1 (deslop), -1 (create demoted) |
| Design groups | 5 | 6 | +1 (fix group) |
| Reference docs | 24 | 25 | +1 (deslop.md) |
| Zod version | v3 | v4 (`^4.0.17`) | Major upgrade |
| AI SDK | Earlier | `ai@^6.0.116` | Major upgrade |
| OpenTelemetry SDK | Earlier | `^2.0.0` | Major upgrade |
| React | 18.x | `^19.1.7` | Major upgrade |

---

## 1. Model Catalog

### New Models (5)

| Model | ID | Type | Key Feature |
|---|---|---|---|
| **Claude Opus 4.8** | `claude-opus-4-8` | Premium | New flagship; inherits Opus 4.7's crown |
| **MiniMax M3** | `MiniMaxAI/MiniMax-M3` | Open Source | Frontier + native multimodality + reasoning |
| **Qwen 3.7 Plus** | `Qwen/Qwen3.7-Plus` | Open Source | Budget reasoning with vision |
| **Step 3.7 Flash** | `stepfun/Step-3.7-Flash` | Open Source | Multimodal sparse-MoE reasoning |
| **Nemotron 3 Ultra** | `nvidia/nemotron-3-ultra-550b-a55b` | Open Source | 550B open reasoning model |

### Model Metadata Changes

- **`inputModalities` field added** to all models — tracks `["text"]` or `["text", "image"]` support
- **Opus 4.7 demoted**: description changed from "most intelligent for agents and coding" → "prev flagship, still strong for agents and coding"
- **MiMo V2.5**: gained vision support (`["text", "image"]`)
- **Qwen 3.6 Plus**: gained vision support (`["text", "image"]`)
- **Free tier model**: `Qwen/Qwen3.7-Max-Free` added as a reference default

### API Spec Architecture

Models now carry an explicit `spec` field:
- `"chatComplete"` — Anthropic + all Open Source models (via gateway)
- `"responses"` — OpenAI models only

This suggests different API request formats per provider group.

### Pricing

Claude Opus 4.8 pricing: identical to Opus 4.7 ($5 prompt / $25 completion per 1M tokens). Opus 4.8 is now blocked on Pro plan alongside Opus 4.7/4.6.

### Gateway Provider Routing

New provider routing entries for all 5 new models:
- MiniMax M3 → `minimax/minimax-m3` (Vercel AI Gateway)
- Qwen 3.7 Plus → `alibaba/qwen3.7-plus` (Vercel AI Gateway)
- Step 3.7 Flash → `stepfun/step-3.7-flash` (Vercel AI Gateway)
- Nemotron 3 Ultra → `nvidia/nemotron-3-ultra-550b-a55b` (Vercel AI Gateway)

### Legacy Aliases (Unchanged)

```javascript
{
  "claude-sonnet-4-20250514":    "claude-sonnet-4-6",
  "claude-sonnet-4-5-20250929":  "claude-sonnet-4-6",
  "claude-opus-4-5-20251101":    "claude-opus-4-7",
  "claude-opus-4-6":             "claude-opus-4-7",
  "claude-haiku-4-5":            "claude-haiku-4-5-20251001",
}
```

Same 5 legacy aliases. No new aliases added for v0.33.0 model IDs.

---

## 2. Tool Input Repair System

### Architecture: Unchanged

The validate-then-repair pipeline is identical. Same `parseRepairedToolInput` orchestrator, same three-stage flow (parse → repair → re-parse), same telemetry events.

### What Changed

**Field alias map expanded (+14 aliases)**:
- `read_file.absolutePath`: +3 (`file`, `absolute_path`, `fileAbsolutePath`)
- `edit_file.oldValue`: +5 (`old_value`, `oldText`, `old_text`, `oldContent`, `old_content`)
- `edit_file.newValue`: +5 (`new_value`, `newText`, `new_text`, `newContent`, `new_content`)
- `glob.pattern`: +1 (`include`)

**New schema-level coercions**:
- Numeric string → number via `f.preprocess` on `offset`, `limit`, `timeout`, `replacementCount`
- Shell `args` stringified array/bare string coercion via `f.preprocess`

**New utility function**:
- `extractRepairNotes` — parses `<repair_note>` tags back out of tool output for round-tripping

See `TOOL-REPAIR-v0.33.0.md` for full analysis.

---

## 3. Design Skill System

### New Tool: Deslop

`/design deslop` — "Remove AI slop from the design surface." A report-driven treatment mode that:
1. Requires all 3 diagnostic reports before touching files
2. Triages findings by severity (critical vitals → review failures → smells)
3. Replaces each generic tell with an intentional design choice
4. Runs 4-point designer verification after fixes

### New Group: "Fix"

The tool registry now has 6 groups (was 5):
```
audit → fix → systems → compose → build → ship
```

### `create` Tool Demoted

`create` is no longer in the programmatic tool registry (`cx` array). It still functions as an internal routing destination — bare `/design` on an empty project still invokes `create.md`. But users can no longer run `/design create` as a direct command through the registry.

### SKILL.md Changes

The SKILL.md is largely the same ~389 lines. Key differences:
- Deslop is not yet in SKILL.md's tool table (but is in the programmatic registry)
- `create` is not in the tool table (but is still referenced in routing logic)
- The design philosophy, work patterns, smell test, and truthful completion sections are unchanged

### New Reference Document

`deslop.md` — 210 lines. The 25th reference document. See `DESLOP-ANALYSIS.md` for full analysis.

---

## 4. Dependency Upgrades

### Major Upgrades

| Package | v0.28.1 | v0.33.0 | Significance |
|---|---|---|---|
| `zod` | v3 | `^4.0.17` | Major version; new API surface (though bundle still uses `z.preprocess` not `z.coerce`) |
| `ai` (Vercel AI SDK) | Earlier | `^6.0.116` | New streaming/model primitives |
| `@ai-sdk/anthropic` | Earlier | `^3.0.77` | Anthropic provider update |
| `@ai-sdk/openai` | Earlier | `^3.0.41` | OpenAI provider update |
| `react` | 18.x | `^19.1.7` | React 19 for Ink TUI |
| `commander` | Earlier | `^14.0.0` | CLI framework |
| `@opentelemetry/sdk-trace-node` | Earlier | `^2.0.0` | OTel major version |
| `@opentelemetry/sdk-node` | Earlier | `^0.218.0` | OTel SDK |

### Zod v4 Usage

Despite upgrading to Zod v4, the bundle still uses `z.preprocess()` (called 9 times) rather than Zod v4's `z.coerce()`. This suggests either:
1. The codebase was written with Zod v3 patterns and the v4 upgrade was non-breaking
2. `z.preprocess()` offers more control than `z.coerce()` (which is likely — preprocess allows custom logic, coerce is a fixed set of type conversions)

---

## 5. Architecture Changes

### inputModalities Tracking

Every model now declares what input types it can process:
```javascript
inputModalities: ["text", "image"]  // or ["text"]
```

This enables the system to make decisions about which models can handle image-based tool inputs (screenshots, diagrams) vs text-only. 30 occurrences of `inputModalities` in the bundle suggests it's used in model selection, capability checking, and UI display.

### Provider Architecture

Providers are now more clearly structured:
- `Gt.ANTHROPIC` — direct Anthropic API
- `Gt.OPENAI` — direct OpenAI API
- `Gt.VERCEL_AI_GATEWAY` — primary gateway for open source models
- `Gt.BASETEN` — alternative gateway for select open source models
- `Gt.CLOUDFLARE_AI_GATEWAY` — Cloudflare Workers AI gateway
- `Gt.OPENROUTER` — OpenRouter fallback

Each model has a provider routing table mapping `canonicalId` to per-provider model IDs.

### Telemetry Keys

46 `cmd.*` telemetry keys found in the bundle (up from fewer in v0.28.1), including:
- `cmd.api.attempt.is_retryable`
- `cmd.api.attempt.error_type`
- `cmd.api.attempt.error_message`
- `cmd.sanitize.unmatched_count`
- `cmd.sanitize.tool_names`
- `cmd.sanitize.next_message_role`
- `cmd.error.fingerprint`
- `cmd.error.component`
- `cmd.error.heading`
- `cmd.error.code`

This suggests richer observability around API errors, message sanitization, and error categorization.

### Gemini Special-Casing

```javascript
Yt = new Set(["google/gemini-3.5-flash", "google/gemini-3.1-flash-lite"])
```

Gemini models are tracked in a special set, used in `getModelCategory` to categorize them as "premium" when accessed via Vercel AI Gateway (all other gateway models are "opensource"). This reflects Google's pricing model — Gemini is available through the gateway but isn't free/open.

---

## 6. Subscription Plans

Plans are unchanged in structure:

| Plan | Premium Budget | Open Source Budget | Total |
|---|---|---|---|
| Go | $0 | $10 | $10 |
| Pro | $15 | $15 | $30 |
| Max | $100 | $50 | $150 |
| Ultra | $200 | $100 | $300 |
| Teams Pro | $40 | $0 | $40 |

Pro plan blocked models updated: `claude-opus-4-8` added to the blocked list alongside `claude-opus-4-7`, `claude-opus-4-6`, and `claude-opus-4-5-20251101`.

---

## 7. Slash Commands

New slash commands observed:
- `/pr-comments` — PR comment integration
- `/context` — context management
- `/extra` — additional features
- `/courses` — learning content
- `/update` — update checking
- `/compact-mode` — context compaction mode
- `/add-dir` — workspace directory management

These were either added in v0.33.0 or between v0.28.1 and v0.33.0.

---

## 8. Taste System — The Neuro-Symbolic Learning Layer

The taste system is powered by a model called **taste-1** — described as a "meta neuro-symbolic AI model with continuous reinforcement learning."

### Architecture

Three storage layers:

| Type | Path | Purpose |
|---|---|---|
| Project | `.commandcode/taste/taste.md` | Codebase-specific learnings |
| Global | `~/.commandcode/taste/` | Personal taste across all projects |
| Remote | `commandcode.ai/username/taste` | Team sharing, cross-machine sync |

### Database Schema

```javascript
taste_packages = {
  id: uuid().primaryKey(),
  name: text().notNull(),
  description: text(),
  type: taste_package_type.default("category"),  // "project" | "category"
  ownerUserId: uuid().references(users.id),
  ownerOrgId: uuid().references(orgs.id),
  license: text(),
  isPublic: boolean().default(false),
  downloadCount: integer().default(0),
  starCount: integer().default(0),
};
```

### Demo Animation (onboarding)

```javascript
var oA = [
  { type: "user",    text: "I always prefer pnpm", duration: 2000 },
  { type: "learned", text: "LEARNED: pnpm (95% preference)",
    details: ".commandcode/taste/taste.md", duration: 2000 },
  { type: "user",    text: "I prefer commander over meow", duration: 2000 },
  { type: "updated", text: "Updated: commander boosted (60%→95%), meow adjusted (90%→35%)",
    details: ".commandcode/taste/cli/taste.md", duration: 2000 },
];
```

### Dedicated Model

Taste onboarding uses **Kimi K2.5** (`moonshotai/Kimi-K2.5`) — a cost-effective open model, consistent with the repair system's philosophy of using cheaper models where harness engineering compensates for capability gaps.

---

## 9. Context/Compaction System — Three-Tier Auto-Compaction

### Tier Thresholds

```javascript
{
  TIER_1_THRESHOLD: 0.5,    // 50% of context window
  TIER_2_THRESHOLD: 0.8,    // 80%
  TIER_3_THRESHOLD: 0.9,    // 90%
  TIER_1_KEEP_COUNT: 20,    // keep last 20 tool calls
  TIER_2_KEEP_COUNT: 10,    // keep last 10 tool calls
  KEEP_RECENT_TOKENS: 30000,
}
```

| Tier | Trigger | Action | Mode |
|---|---|---|---|
| Tier 1 | >50% context used | Remove old tool calls, keep last 20 | `"fast"` only |
| Tier 2 | >80% context used | Remove old tool calls, keep last 10 | `"fast"` only |
| Tier 3 | >90% context used | Full conversation summarization | Both modes |

### CompactAgent

Uses **DeepSeek V4 Pro** as the compaction model — sends the full conversation transcript and gets back a handoff brief covering: goal, user turns, in-flight work, pending tasks, files touched, decisions and constraints.

Key compaction prompt rule: *"Be precise. Prefer concrete artifacts (paths, function names, exact strings) over paraphrase. When code is mid-edit, include the snippet verbatim — losing it loses the work."*

---

## 10. Retry/Fallback System

### Two Retry Layers

**Auxiliary API calls** (learning, compaction): 5 max attempts, `200ms × 2^attempt` backoff.

**Main conversation loop**: 10 max attempts, `100ms × 2^attempt` clamped to `[1000, 10000]ms`, UI notification after attempt 3+.

### Error Classification

**Non-retryable**: User interrupt, insufficient credits, AbortError, 403 status.

**Retryable**: SSE event ordering, fetch failures, ECONNRESET, ECONNREFUSED, ETIMEDOUT, ENOTFOUND, network errors, socket hang up, 5xx status codes.

### Per-Attempt Telemetry

```javascript
"cmd.api.attempt.number",
"cmd.api.attempt.delay_ms_before",
"cmd.api.attempt.status",
"cmd.api.attempt.http_status",
"cmd.api.attempt.is_retryable",
"cmd.api.attempt.error_type",
"cmd.api.attempt.error_message",
```

### Stop Hook Retry

When a "Stop" hook requests retry, capped at 3 retries with feedback injected as a user message.

---

## 11. New Slash Commands

| Command | Function |
|---|---|
| `/pr-comments` | Fetches PR issue comments + review comments via `gh` CLI with diff hunks |
| `/context` | Opens context usage view with tier thresholds and actionable tips |
| `/extra` | Opens billing page for on-demand credit purchases |
| `/courses` | Opens `commandcode.ai/courses` |
| `/update` | Checks for and installs latest CLI version |
| `/compact-mode` | Switches between `"default"` (Tier 3 only) and `"fast"` (all tiers) |
| `/add-dir` | Registers additional workspace directories |

---

## 12. What Didn't Change

- **Repair architecture** — Validate-then-repair pipeline is frozen
- **Pre-parse layer** — Same 4 strategies, same order
- **Markdown auto-link fix** — Same regex, same pathString()
- **read_file relational defaults** — Same logic, same values
- **Telemetry events** — Same event names and context fields
- **Shape fingerprinting** — Same FNV-1a hash
- **Diagnostic logging** — Same `CMD_LOG_REPAIRS` env var
- **Design philosophy** — Same 7 sections in SKILL.md
- **Work patterns** — Same 7 patterns (monitor, operate, compare, configure, learn, decide, explore)
- **Smell catalog** — Same 10 odors
- **Report system** — Same 3 reports, same scoring
- **Truthful completion rule** — Same enforcement
- **Builtin agents** — Same explore + plan agents

---

## 9. Harness Engineering Insights: The Deeper "Why"

### Why 170 Lines of Repair Beat Post-Training

The repair system works because it operates on a fundamental insight: **model errors at tool boundaries are a small, finite, compositional set.** Models don't produce random garbage in tool calls — they produce structured output that's *almost* right. The errors cluster into 6 patterns: wrong type, wrong name, wrong container, null for omitted, string for number, bare value for object.

The repair layer exploits this by positioning itself exactly at the boundary where model output meets schema validation. It doesn't try to fix arbitrary errors — it fixes the specific errors that models actually make. This is why ~170 lines of code handle 36K+ production repairs: the error space is small.

### Why the Architecture Froze at v0.28.1

The validate-then-repair pattern has three properties that make it convergent:

1. **The schema defines the repair surface.** New tools automatically get repair coverage because repairs fire on Zod validation errors, not on tool-specific logic. No repair code needs updating when tools change.

2. **Valid inputs are free.** The first `safeParse` short-circuits the entire repair path. Premium models that always produce correct tool calls pay zero overhead.

3. **Repairs are bounded.** Each validation issue gets one pass through the rule list. No retry loops, no mutation compounding. The cost is O(issues × rules), and both are small.

When an architecture has these properties, you don't improve it — you widen its reach. v0.33.0 proves this: 5 new models, 14 new aliases, 3 new schema coercions, zero changes to the core pipeline.

### Why Defense-in-Depth Works Here

v0.33.0 introduces redundant repair at multiple layers — schema-level `preprocess` catches common type coercions before Zod validation even runs, while post-validation rules catch anything that slips through. This is not redundant for safety. It's redundant for **performance and observability**:

- A `"30"` → `30` conversion caught at the schema level never becomes a Zod error, never triggers the repair loop, never emits a telemetry event. It's silent and free.
- The same conversion caught by the post-validation layer generates a `tool_input_repaired` event. This is expensive (telemetry, logging, hint generation).

Pushing safe coercions to the schema reduces telemetry noise and repair loop overhead without removing the safety net.

### What the Alias Growth Tells Us About Models

The 14 new aliases in v0.33.0 are a direct readout of how 5 new models think about field naming:

| Model Naming Style | Examples | Aliases Added |
|---|---|---|
| **Terse** (Nemotron) | `file` instead of `absolutePath` | `file` |
| **Snake_case variant** (Step, Qwen) | `absolute_path`, `old_text` | `absolute_path`, `old_text`, etc. |
| **Verbose compound** (MiniMax) | `fileAbsolutePath`, `oldContent` | `fileAbsolutePath`, `oldContent`, etc. |
| **Content-oriented** (various) | `oldText` instead of `oldValue` | `oldText`, `newText`, etc. |

Each model brings its own pretraining distribution — its own assumptions about what field names should be. The alias map is the system's accumulated memory of these distributions. It grows monotonically because removing an alias risks breaking a model that relied on it.

### The 21x Cost Reduction, Revisited

The original claim from v0.28.1: DeepSeek V4 Pro beats Claude Opus 4.7 on internal evals. The cost difference between DeepSeek ($0.95 prompt / $3.15 completion via Baseten) and Opus 4.7 ($5 / $25) is roughly **5-8x** on raw price. But the effective cost reduction is larger because:

1. **Repair eliminates retry spirals.** Without repair, a failed tool call bounces back as a Zod error, the model retries, often fails again differently, and eventually uses 3-5x the tokens.
2. **Hints teach within-session.** Repair notes like "Use `absolutePath` next time" reduce the repair rate on subsequent calls in the same session.
3. **Schema coercions prevent the failure entirely.** A `"30"` that becomes `30` at the schema level never even enters the retry path.

The 21x+ figure comes from compounding: cheaper model × fewer retries × lower token waste per retry.

### Patterns for Other Tool-Use Harnesses

If you're building a tool-use harness for any LLM:

1. **Start with validate-then-repair, not preprocess-then-validate.** Let the schema complain first, then fix only what it complained about.
2. **Track your alias table.** Every model has a naming prior. Log the wrong field names and add them to an alias map.
3. **Push safe coercions to the schema level.** Number-as-string, stringified-array-as-string — these are always safe to fix at preprocess time.
4. **Instrument every repair.** The `(model, tool, rule)` triple is your fleet-wide regression detector.
5. **Format errors for the model, not the developer.** "Use `absolutePath` next time" teaches; a raw Zod issues blob does not.
6. **Never touch valid inputs.** This is the most important rule. If you preprocess everything, you will corrupt tool inputs that happened to look broken but weren't.
