# Tool Input Repair System — v0.33.0 Deep Analysis

> Decompiled from `command-code@0.33.0` — `dist/index.mjs` (1.46MB minified bundle, 323 lines)
> Previous analysis: `TOOL-REPAIR.md` (v0.28.1)

The tool-input repair layer in v0.33.0 is architecturally identical to v0.28.1 — the same validate-then-repair pipeline, the same 5 post-validation rules in the same order, the same 4 pre-parse strategies, the same schema-level fixes. What changed is the **surface area**: more aliases, more coercion at the schema level, and a new round-trip function for repair notes. The system is quietly becoming more comprehensive without changing its core design.

---

## Table of Contents

- [What Changed From v0.28.1](#what-changed-from-v0281)
- [The Core Architecture: Still Validate-Then-Repair](#the-core-architecture-still-validate-then-repair)
- [Post-Validation Rules: Same 5, Same Order](#post-validation-rules-same-5-same-order)
- [Field Alias Map: Expanded Coverage](#field-alias-map-expanded-coverage)
- [Pre-Parse Layer: Unchanged](#pre-parse-layer-unchanged)
- [Schema-Level Fixes: Unchanged + New Coercion](#schema-level-fixes-unchanged--new-coercion)
- [New: extractRepairNotes Round-Trip](#new-extractrepairnotes-round-trip)
- [New: Numeric String Coercion](#new-numeric-string-coercion)
- [Relational Defaults: Unchanged](#relational-defaults-unchanged)
- [Telemetry: Unchanged](#telemetry-unchanged)
- [The Full Repair Surface at v0.33.0](#the-full-repair-surface-at-v0330)
- [Model Coverage: 28 Current Models](#model-coverage-28-current-models)
- [Harness Engineering Insights](#harness-engineering-insights)
- [Decompiled Code: Key Changes](#decompiled-code-key-changes)

---

## What Changed From v0.28.1

| Area | v0.28.1 | v0.33.0 | Change Type |
|---|---|---|---|
| Post-validation rules | 5 rules, 5 order | 5 rules, same order | **Unchanged** |
| Pre-parse strategies | 4 strategies | 4 strategies | **Unchanged** |
| Field alias map | 46 total aliases | 60 total aliases | **+14 new aliases** |
| `read_file.absolutePath` aliases | 7 | 10 (+`file`, `absolute_path`, `fileAbsolutePath`) | **Expanded** |
| `edit_file.oldValue` aliases | 6 | 11 (+`old_value`, `oldText`, `old_text`, `oldContent`, `old_content`) | **Expanded** |
| `edit_file.newValue` aliases | 6 | 11 (+`new_value`, `newText`, `new_text`, `newContent`, `new_content`) | **Expanded** |
| `glob.pattern` aliases | 4 | 5 (+`include`) | **Expanded** |
| `unwrapMarkdownAutoLinks` | Identical regex | Identical regex | **Unchanged** |
| `pathString()` | Identical | Identical | **Unchanged** |
| `withRepairNotes` | Identical | Identical | **Unchanged** |
| `extractRepairNotes` | Did not exist | New function | **New** |
| Numeric coercion | None | `f.preprocess` on `timeout`, `offset`, `limit` | **New schema-level** |
| Shell `args` coercion | None | `f.preprocess` with JSON parse fallback | **New schema-level** |
| `parseRepairedToolInput` | Identical | Identical | **Unchanged** |
| Telemetry | Same events + fingerprint | Same events + fingerprint | **Unchanged** |
| Zod version | v3 | v4 (`^4.0.17`) | **Upgraded** |
| Current models | 23 | 28 (+5 new) | **Expanded** |
| Legacy aliases | 5 | 5 (same set) | **Unchanged** |

**Summary**: The architecture is frozen. The growth is at the edges — more alias coverage for more models making more creative field-name mistakes, and schema-level coercion for numeric fields that models sometimes emit as strings.

---

## The Core Architecture: Still Validate-Then-Repair

The fundamental insight from v0.28.1 carries through unchanged:

```
Input arrives
    |
    v
[Zod safeParse] --- success? ---> Ship it. Valid inputs NEVER touched.
    |
    | failure
    v
[Walk issue list] -- for each issue path, try repairs in order
    |
    v
[Zod safeParse again] --- success? ---> Log "tool_input_repaired:{tool}", ship it
    |
    | failure
    v
[Format model-readable error] ---> Log "tool_input_invalid:{tool}", return retry message
```

The `parseRepairedToolInput` function is byte-for-byte identical to v0.28.1 (modulo variable renaming from the minifier). The same three-stage flow: parse → repair → re-parse. The same telemetry events. The same diagnostic logging. The same model-readable error format.

This is the right call. When the architecture is correct, you don't touch it. You widen its reach.

---

## Post-Validation Rules: Same 5, Same Order

```javascript
// v0.33.0 — Rule registry (variable names differ from v0.28.1 due to minification)
var vv = [
  ["renameAliasedField",          Sv],
  ["dropNullOrUndefinedField",    fv],
  ["dropEmptyObjectPlaceholder",  hv],
  ["parseJsonStringifiedArray",   yv],
  ["wrapBareStringAsArray",       bv],
];
```

Compare to v0.28.1:
```javascript
var gv = [
  ["renameAliasedField",          dv],
  ["dropNullOrUndefinedField",    lv],
  ["dropEmptyObjectPlaceholder",  av],
  ["parseJsonStringifiedArray",   cv],
  ["wrapBareStringAsArray",       mv],
];
```

Same names, same order, same logic. The individual rule functions are functionally identical — only the minified variable names differ. Order still matters: `parseJsonStringifiedArray` before `wrapBareStringAsArray`.

`wrapRootStringAsObject` still runs as a pre-loop check before the per-issue walk, with the same per-tool primary field map:

```javascript
var Ev = {
  grep:                { field: "pattern",      shape: "string" },
  glob:                { field: "pattern",      shape: "string" },
  shell_command:       { field: "command",      shape: "string" },
  read_file:           { field: "absolutePath",  shape: "string" },
  read_directory:      { field: "path",          shape: "string" },
  read_multiple_files: { field: "include",       shape: "array"  },
};
```

Identical to v0.28.1.

---

## Field Alias Map: Expanded Coverage

This is the most significant change in v0.33.0's repair system. The alias map grew from **46 to 60 total aliases** across 8 tools. The new aliases target patterns observed from the 5 new models added in v0.33.0 (Opus 4.8, MiniMax M3, Qwen 3.7 Plus, Step 3.7 Flash, Nemotron 3 Ultra).

### v0.33.0 alias map (with changes highlighted):

```javascript
var wv = {
  read_file: {
    absolutePath: [
      "path", "file_path", "filePath", "filepath",
      "pathname", "target_file", "targetFile",
      "file",                    // NEW in v0.33.0
      "absolute_path",           // NEW in v0.33.0
      "fileAbsolutePath",        // NEW in v0.33.0
    ],
  },
  grep: {
    pattern: ["query", "regex", "search", "q", "expression", "text"],
    // unchanged
  },
  write_file: {
    filePath: [
      "path", "absolutePath", "file_path", "filepath",
      "pathname", "target_file", "targetFile",
    ],
    content: ["text", "body", "data", "contents", "fileContent"],
    // unchanged
  },
  edit_file: {
    filePath: [
      "path", "absolutePath", "file_path", "filepath",
      "pathname", "target_file", "targetFile",
    ],
    oldValue: [
      "old_string", "oldString", "old", "old_str", "oldStr", "from",
      "old_value",               // NEW in v0.33.0
      "oldText",                 // NEW in v0.33.0
      "old_text",                // NEW in v0.33.0
      "oldContent",              // NEW in v0.33.0
      "old_content",             // NEW in v0.33.0
    ],
    newValue: [
      "new_string", "newString", "new", "new_str", "newStr", "to",
      "new_value",               // NEW in v0.33.0
      "newText",                 // NEW in v0.33.0
      "new_text",                // NEW in v0.33.0
      "newContent",              // NEW in v0.33.0
      "new_content",             // NEW in v0.33.0
    ],
  },
  read_directory: {
    path: ["absolutePath", "directory", "dir", "folder", "directoryPath"],
    // unchanged
  },
  read_multiple_files: {
    include: ["paths", "files", "file_paths", "filePaths", "patterns"],
    // unchanged
  },
  shell_command: {
    command: ["cmd", "bash", "shell", "script", "commandLine"],
    // unchanged
  },
  glob: {
    pattern: [
      "query", "glob", "expression", "search",
      "include",                 // NEW in v0.33.0
    ],
  },
};
```

### Why These Specific Aliases?

The new aliases reveal the models that triggered them:

| New Alias | Tool | Likely Source Model | Reasoning |
|---|---|---|---|
| `file` | read_file | Nemotron 3 Ultra | NVIDIA models use terse field names from their training distribution |
| `absolute_path` | read_file | Step 3.7 Flash | Snake_case variant of the camelCase canonical |
| `fileAbsolutePath` | read_file | MiniMax M3 | Verbose compound name from models that over-specify |
| `old_value`/`new_value` | edit_file | Qwen 3.7 Plus | Snake_case of what they think the field should be |
| `oldText`/`newText` | edit_file | MiniMax M3 | "Text" instead of "Value" — content-oriented naming |
| `old_text`/`new_text` | edit_file | Nemotron 3 Ultra | Snake_case variant |
| `oldContent`/`newContent` | edit_file | Step 3.7 Flash | "Content" instead of "Value" |
| `old_content`/`new_content` | edit_file | Qwen 3.7 Plus | Snake_case variant |
| `include` | glob | Multiple models | Confuse `glob` with `read_multiple_files` which uses `include` |

The pattern is clear: **every new model brings its own naming conventions from pretraining**, and the alias map grows to absorb them. The `edit_file` tool is the worst offender because `oldValue`/`newValue` is an unusual naming choice — most models expect something more standard like `old_string`/`new_string` or `old_text`/`new_text`.

---

## Pre-Parse Layer: Unchanged

The pre-parse layer is functionally identical to v0.28.1:

```javascript
var Pk = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
var Ik = ['"}', '"}}', "}", '": ""}'];

function normalizeToolInput(e) {
  return "string" != typeof e ? e : (parseToolArgs(e) ?? e);
}

function parseToolArgs(e) {
  return (
    tryParseDirectly(e) ??
    tryParseAfterEscaping(e) ??
    repairTruncatedJson(e) ??
    repairTruncatedJson(escapeControlCharsInJsonStrings(e))
  );
}
```

Same 4 strategies, same order, same truncation suffixes, same control-char escape map. The variable names changed (`Ek` → `Pk`, `vk` → `Ik`) due to different minification passes, but the logic is identical.

---

## Schema-Level Fixes: Unchanged + New Coercion

### Unchanged: `unwrapMarkdownAutoLinks` and `pathString()`

```javascript
var Cv = /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g;
var kv = /^https?:\/\//;

function unwrapMarkdownAutoLinks(e) {
  return e.replace(Cv, (e, t, n) => n.replace(kv, "") !== t ? e : t);
}

function pathString() {
  return f.preprocess(
    e => ("string" != typeof e ? e : unwrapMarkdownAutoLinks(e)),
    f.string()
  );
}
```

Byte-for-byte identical logic. The DeepSeek markdown auto-link bug (`[notes.md](http://notes.md)`) is still being fixed the same way.

### New: Numeric String Coercion at Schema Level

v0.33.0 adds `f.preprocess` wrappers to numeric fields across tool schemas. These handle models that emit numbers as strings (e.g., `"30"` instead of `30`):

```javascript
// v0.33.0 — read_file schema
var Av = f.object({
  absolutePath: pathString().describe("The absolute path to the file to read"),
  offset: f.preprocess(
    e => "string" == typeof e ? parseInt(e, 10) : e,
    f.number()
  ).optional().describe("Optional line number to start reading from (0-based index)"),
  limit: f.preprocess(
    e => "string" == typeof e ? parseInt(e, 10) : e,
    f.number()
  ).optional().describe("Optional number of lines to read"),
});
```

This is also applied to:
- `shell_command.timeout`
- `edit_file.replacementCount`

In v0.28.1, these were bare `z.number()` — a model sending `"30"` instead of `30` would fail validation and require the full repair loop. Now the schema itself handles it. **This is a form of repair pushed earlier in the pipeline** — before validation even sees the field.

### New: Shell Command `args` Array Coercion

```javascript
var _v = f.object({
  command: f.string().min(1, "Command cannot be empty"),
  args: f.preprocess(e => {
    if ("string" == typeof e) {
      try {
        const t = JSON.parse(e);
        if (Array.isArray(t)) return t;
      } catch {}
      return [e];
    }
    return e;
  }, f.array(pathString())).optional(),
  directory: pathString().optional(),
  timeout: f.preprocess(
    e => "string" == typeof e ? parseInt(e, 10) : e,
    f.number()
  ).optional(),
});
```

The `args` field now:
1. Accepts stringified JSON arrays (`"[\"--flag\", \"value\"]"` → `["--flag", "value"]`)
2. Wraps bare strings as single-element arrays (`"--flag"` → `["--flag"]`)
3. Applies `pathString()` to each element (auto-strips markdown auto-links)

This combines **three repair patterns** (parseJsonStringifiedArray, wrapBareStringAsArray, unwrapMarkdownAutoLinks) into a single `preprocess` call at the schema level. It's the same logic that existed as post-validation rules, now also available as schema-level prevention.

**Key insight**: v0.33.0 is moving toward **defense in depth** — the same repair logic exists at both the schema level (preprocess) and the post-validation level (repair rules). The schema catches the easy cases before validation; the repair rules catch anything that slips through.

---

## New: extractRepairNotes Round-Trip

v0.33.0 adds a function to parse repair notes back out of tool output:

```javascript
var Tv = /^<repair_note>([\s\S]*?)<\/repair_note>$/;

function extractRepairNotes(e) {
  const t = e.split("\n"), n = [];
  let r = 0;
  for (const e of t) {
    const t = e.match(Tv);
    if (null === t) break;
    n.push(t[1] ?? ""), r += 1;
  }
  return 0 === n.length
    ? { notes: [], body: e }
    : { notes: n, body: t.slice(r).join("\n") };
}
```

**What this enables**: The system can now inject repair notes into tool output (`withRepairNotes`), pass the output through the model, and if the model includes those notes in subsequent context, strip them back out to get clean content. This is a **round-trip mechanism** — notes go in as `<repair_note>` tags, and can be extracted back out later.

**Why this matters**: When repair notes are prepended to tool output, and that output gets included in later context (e.g., in a conversation turn that references previous tool results), the notes can be separated from the actual content. This prevents repair notes from contaminating downstream processing or being mistaken for actual tool output content.

**This did not exist in v0.28.1.** It's a small but meaningful improvement to the repair system's composability.

---

## Relational Defaults: Unchanged

The `read_file` relational defaults (infer `offset=0` when only `limit` is provided, infer `limit=2000` when only `offset` is provided) are functionally identical to v0.28.1:

```javascript
if (void 0 === u && void 0 !== d) {
  u = 0;
  l = {
    defaulted: "offset", offset: 0, limit: d,
    reason: "offset was not provided; defaulted to 0 (read from start of file). ..."
  };
} else if (void 0 !== u && void 0 === d) {
  d = 2e3;
  l = {
    defaulted: "limit", offset: u, limit: 2e3,
    reason: "limit was not provided; defaulted to 2000 lines. ..."
  };
}
```

Same logic, same default values (0 and 2000), same reason strings.

---

## Telemetry: Unchanged

The telemetry pipeline is identical:
- `recordRepairOutcome` → `emitRepairOutcomeTelemetry` → `trackError`
- Same event names: `tool_input_repaired:{toolName}`, `tool_input_invalid:{toolName}`
- Same context fields: `tool.name`, `repair.outcome`, `repair.issue_count`, `repair.issue_codes`, `repair.received_root_type`, `repair.received_keys`, `repair.rule_fired`, `repair.hint_count`, `repair.shape_fingerprint`, `gen_ai.request.model`
- Same FNV-1a hash for shape fingerprinting
- Same `CMD_LOG_REPAIRS` env var for diagnostic logging

---

## The Full Repair Surface at v0.33.0

| # | Layer | Mechanism | What It Fixes | Changed? |
|---|---|---|---|---|
| 1 | Pre-parse | `tryParseDirectly` | Double-stringified JSON tool args | Unchanged |
| 2 | Pre-parse | `escapeControlCharsInJsonStrings` | Raw `\n`, `\r`, `\t` inside JSON strings | Unchanged |
| 3 | Pre-parse | `repairTruncatedJson` | Truncated JSON (appends `"}`, `"}}`, `}`, `": ""}`) | Unchanged |
| 4 | Pre-parse | `normalizeToolInput` | Orchestrates all pre-parse strategies | Unchanged |
| 5 | Post-validation | `renameAliasedField` | Wrong field names (now with 14 more aliases) | **Expanded** |
| 6 | Post-validation | `dropNullOrUndefinedField` | `null`/`undefined` for optional fields | Unchanged |
| 7 | Post-validation | `dropEmptyObjectPlaceholder` | `{}` where array expected | Unchanged |
| 8 | Post-validation | `parseJsonStringifiedArray` | `'["a","b"]'` string → actual array | Unchanged |
| 9 | Post-validation | `wrapBareStringAsArray` | `"foo"` → `["foo"]` | Unchanged |
| 10 | Post-validation | `wrapRootStringAsObject` | Bare string → `{ field: "..." }` | Unchanged |
| 11 | Schema-level | `unwrapMarkdownAutoLinks` | DeepSeek's `[file.md](http://file.md)` in paths | Unchanged |
| 12 | Schema-level | `pathString()` | Auto-applies link unwrap to every path field | Unchanged |
| 13 | Schema-level | Numeric string coercion | `"30"` → `30` for offset/limit/timeout | **New** |
| 14 | Schema-level | Shell args coercion | Stringified arrays + bare strings for args | **New** |
| 15 | Semantic | `read_file` relational defaults | Infers `offset=0` or `limit=2000` | Unchanged |
| 16 | Utility | `extractRepairNotes` | Round-trips repair notes in/out of tool output | **New** |

**Total: 16 distinct mechanisms** (up from 13 in v0.28.1). Three new mechanisms, all at the schema level or utility layer. The post-validation core is frozen.

---

## Model Coverage: 28 Current Models

v0.33.0 supports **28 current models** (up from 23 in v0.28.1) plus the same **5 legacy aliases**:

### New Models in v0.33.0 (5):

| Model | ID | Provider | Key Feature |
|---|---|---|---|
| Claude Opus 4.8 | `claude-opus-4-8` | Anthropic | New flagship; Opus 4.7 demoted to "prev flagship" |
| MiniMax M3 | `MiniMaxAI/MiniMax-M3` | Open Source | Frontier coding with native multimodality + reasoning |
| Qwen 3.7 Plus | `Qwen/Qwen3.7-Plus` | Open Source | Lower-cost reasoning alternative to Qwen 3.7 Max |
| Step 3.7 Flash | `stepfun/Step-3.7-Flash` | Open Source | Multimodal sparse-MoE, supplements Step 3.5 Flash |
| Nemotron 3 Ultra | `nvidia/nemotron-3-ultra-550b-a55b` | Open Source | 550B params, open reasoning for long-horizon agents |

### New Model Metadata: `inputModalities`

Every model now declares its supported input modalities:

```javascript
inputModalities: ["text", "image"]  // or ["text"] for text-only
```

Models with vision (`["text", "image"]`): Claude Sonnet/Opus/Haiku, GPT-5.x series, Kimi K2.x, MiniMax M3, Qwen 3.6 Plus, Qwen 3.7 Plus, Step 3.7 Flash, MiMo V2.5, Gemini 3.x.

Text-only (`["text"]`): GLM-5/5.1, MiniMax M2.x, DeepSeek V4 Pro/Flash, Qwen 3.6 Max Preview, Qwen 3.7 Max, Step 3.5 Flash, MiMo V2.5 Pro, Nemotron 3 Ultra.

### Also New: Free Tier Model

```javascript
cn = "Qwen/Qwen3.7-Max-Free"
```

A free-tier reference model, likely used as the default for the `individual-go` plan.

---

## Harness Engineering Insights

### Why the Architecture Is Frozen

The validate-then-repair architecture was correct from v0.28.1. It has three properties that make it hard to improve upon:

1. **The schema is the specification.** Repairs are guided by Zod validation errors, not by guesses about what might be wrong. Adding a new tool or changing a schema automatically changes what gets repaired — no repair code needs updating.

2. **Valid inputs are never touched.** This is the most important property. A premium model that always sends correct JSON never hits the repair path. There is zero cost for correct behavior.

3. **The repair budget is finite.** Each issue in the Zod error gets exactly one repair attempt from each rule in order. There is no retry loop, no exponential search, no risk of mutation compounding. One pass, one chance.

### Why the Growth Is at the Edges

The 14 new aliases and 3 new schema-level coercions represent the **long tail of model behavior**. The core 5 repairs handle the structural failures (wrong type, missing key, wrong container). The aliases handle the naming failures (wrong field name). The schema coercions handle the format failures (number-as-string).

Each new model added to the catalog brings its own pretraining distribution — its own priors about what field names should be. The alias map is the harness's memory of those priors. It grows monotonically: once a model has been observed using `old_text` for `oldValue`, that alias is permanent.

### The Defense-in-Depth Pattern

v0.33.0 introduces a clear pattern of **redundant repair at multiple layers**:

```
Layer 1: Schema-level f.preprocess  → catches "30" → 30, "[\"a\"]" → ["a"]
Layer 2: Zod validation             → catches structural errors
Layer 3: Post-validation repair     → catches remaining issues
Layer 4: Relational defaults        → catches semantic relationships
```

This is not redundancy for safety — it's redundancy for **performance**. A numeric coercion caught at the schema level never becomes a Zod error, never triggers the repair loop, never emits a telemetry event. The repair rules still exist as a safety net, but the schema catches the common case first.

### What This Teaches About Harness Design

1. **Freeze the architecture, widen the reach.** Once the core pipeline is correct, improvement comes from expanding coverage (more aliases, more coercions) not from changing the flow.

2. **Let production data drive alias growth.** Every new alias was likely observed in production telemetry (the `repair.received_keys` field captures exactly which wrong field names models use).

3. **Push coercion earlier when safe.** Schema-level `preprocess` is cheaper than post-validation repair. If a coercion is safe (number-as-string → number is always correct), push it to the schema. If it's ambiguous (is `{}` a placeholder or valid data?), keep it in post-validation where context is available.

4. **Round-trip your instrumentation.** The new `extractRepairNotes` function means repair notes can survive context boundaries. This is important for multi-turn conversations where previous tool output is included in later context.

---

## Decompiled Code: Key Changes

### Expanded Alias Map (v0.33.0)

```javascript
var wv = {
  read_file: {
    absolutePath: [
      "path", "file_path", "filePath", "filepath",
      "pathname", "target_file", "targetFile",
      "file", "absolute_path", "fileAbsolutePath",     // +3 new
    ],
  },
  grep: {
    pattern: ["query", "regex", "search", "q", "expression", "text"],
  },
  write_file: {
    filePath: [
      "path", "absolutePath", "file_path", "filepath",
      "pathname", "target_file", "targetFile",
    ],
    content: ["text", "body", "data", "contents", "fileContent"],
  },
  edit_file: {
    filePath: [
      "path", "absolutePath", "file_path", "filepath",
      "pathname", "target_file", "targetFile",
    ],
    oldValue: [
      "old_string", "oldString", "old", "old_str", "oldStr", "from",
      "old_value", "oldText", "old_text",                // +5 new
      "oldContent", "old_content",
    ],
    newValue: [
      "new_string", "newString", "new", "new_str", "newStr", "to",
      "new_value", "newText", "new_text",                // +5 new
      "newContent", "new_content",
    ],
  },
  read_directory: {
    path: ["absolutePath", "directory", "dir", "folder", "directoryPath"],
  },
  read_multiple_files: {
    include: ["paths", "files", "file_paths", "filePaths", "patterns"],
  },
  shell_command: {
    command: ["cmd", "bash", "shell", "script", "commandLine"],
  },
  glob: {
    pattern: ["query", "glob", "expression", "search", "include"],  // +1 new
  },
};
```

### New: extractRepairNotes

```javascript
var Tv = /^<repair_note>([\s\S]*?)<\/repair_note>$/;

function extractRepairNotes(toolOutput) {
  const lines = toolOutput.split("\n");
  const notes = [];
  let noteCount = 0;

  for (const line of lines) {
    const match = line.match(Tv);
    if (match === null) break;
    notes.push(match[1] ?? "");
    noteCount += 1;
  }

  return noteCount === 0
    ? { notes: [], body: toolOutput }
    : { notes, body: lines.slice(noteCount).join("\n") };
}
```

### Schema-Level Numeric Coercion Pattern

```javascript
// Applied to: offset, limit, timeout, replacementCount
f.preprocess(
  inputValue => "string" == typeof inputValue
    ? parseInt(inputValue, 10)
    : inputValue,
  f.number()
)
```

### Shell Command Args Coercion Pattern

```javascript
// Shell command args field
args: f.preprocess(inputValue => {
  if ("string" == typeof inputValue) {
    try {
      const parsed = JSON.parse(inputValue);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [inputValue];  // wrap bare string as single-element array
  }
  return inputValue;
}, f.array(pathString())).optional()
```
