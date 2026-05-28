# How We Made DeepSeek Outperform Opus 4.7

> "We just shipped 36K+ tool repairs in `command-code@0.28.0`"
> -- Command Code founder

This document covers the tool-input repair layer inside Command Code: why it exists, how it works, and the decompiled code that implements it. The trigger was watching DeepSeek Flash fail on the simplest `/review` run -- every `shell_command` and `read_file` call bouncing back with a raw Zod issues blob the model couldn't recover from. By the end, DeepSeek V4 Pro was beating Claude Opus 4.7 **6/10 times** on internal evals.

---

## 6 Rules vs 36K+ Repairs -- What the Numbers Mean

The founder's "36K+" is the **invocation count** -- how many times the repair rules successfully fired across production users, tracked via telemetry (`tool_input_repaired:{toolName}` events sent to Axiom). The rules themselves are just **6 post-validation repair rules** + **4 pre-parse repair strategies** + **2 schema-level fixes** + **1 relational default** -- roughly 13 distinct repair mechanisms total, applying to **10 tools** across **23 current models** (28 model IDs including legacy aliases).

### The full repair surface:

| Layer | Mechanism | Count | What It Does |
|---|---|---|---|
| **Pre-parse** (line 35332) | `tryParseDirectly` | 1 | Parse raw string tool args into objects |
| **Pre-parse** (line 35325) | `tryParseAfterEscaping` | 1 | Escape control chars (`\n`, `\r`, `\t`) in JSON strings, then parse |
| **Pre-parse** (line 35308) | `repairTruncatedJson` | 1 | Append `"}`, `"}}`, `}`, `": ""}` to truncated JSON and try parsing |
| **Pre-parse** (line 35340) | `normalizeToolInput` | 1 | Orchestrator: chains all 3 above, unwraps double-stringified input |
| **Post-validation** (line 30688) | `renameAliasedField` | 1 | Maps wrong field names to correct ones via per-tool alias tables |
| **Post-validation** (line 30604) | `dropNullOrUndefinedField` | 1 | Removes `null`/`undefined` from optional fields |
| **Post-validation** (line 30589) | `dropEmptyObjectPlaceholder` | 1 | Removes `{}` where array expected |
| **Post-validation** (line 30622) | `parseJsonStringifiedArray` | 1 | Parses `'["a","b"]'` string into actual array |
| **Post-validation** (line 30714) | `wrapBareStringAsArray` | 1 | Wraps `"foo"` into `["foo"]` where array expected |
| **Post-validation** (line 30734) | `wrapRootStringAsObject` | 1 | Wraps bare string into `{ primaryField: "..." }` |
| **Schema-level** (line 30883) | `unwrapMarkdownAutoLinks` | 1 | Strips DeepSeek's markdown auto-link leakage from paths |
| **Schema-level** (line 30886) | `pathString()` | 1 | Custom Zod type that auto-applies link unwrap to every path field |
| **Semantic** (line 31494) | `read_file` relational defaults | 1 | Infers `offset=0` or `limit=2000` when only one is provided |

That's **13 distinct repair mechanisms**. Each fires on **every tool call from every model**. With 23 current models (+ 5 legacy aliases + custom models via OpenRouter/Cloudflare), 10 tools, and thousands of users, 36K+ cumulative repairs is the production total.

### The 23 current models + 5 legacy aliases (28 model IDs total):

The bundle at v0.28.1 contains exactly **23 model entries** in the catalog (`an` object, lines 897–1125) plus **5 legacy aliases** (`cn` map, lines 1213–1219) that redirect to current models. The founder's "29" is approximate — likely from v0.28.0 which may have had one additional entry, or counts the taste-1 system's internal model.

**Anthropic (3 current):**
1. Claude Sonnet 4.6 — `claude-sonnet-4-6`
2. Claude Opus 4.7 — `claude-opus-4-7`
3. Claude Haiku 4.5 — `claude-haiku-4-5-20251001`

**OpenAI (4 current):**
4. GPT-5.5 — `gpt-5.5`
5. GPT-5.4 — `gpt-5.4`
6. GPT-5.3 Codex — `gpt-5.3-codex`
7. GPT-5.4 Mini — `gpt-5.4-mini`

**Open Source via gateway (16 current):**
8. Kimi K2.6 — `moonshotai/Kimi-K2.6`
9. Kimi K2.5 — `moonshotai/Kimi-K2.5`
10. GLM-5.1 — `zai-org/GLM-5.1`
11. GLM-5 — `zai-org/GLM-5`
12. MiniMax M2.7 — `MiniMaxAI/MiniMax-M2.7`
13. MiniMax M2.5 — `MiniMaxAI/MiniMax-M2.5`
14. DeepSeek V4 Pro — `deepseek/deepseek-v4-pro`
15. DeepSeek V4 Flash — `deepseek/deepseek-v4-flash`
16. Qwen 3.6 Max Preview — `Qwen/Qwen3.6-Max-Preview`
17. Qwen 3.6 Plus — `Qwen/Qwen3.6-Plus`
18. Qwen 3.7 Max — `Qwen/Qwen3.7-Max`
19. Step 3.5 Flash — `stepfun/Step-3.5-Flash`
20. MiMo V2.5 Pro — `xiaomi/mimo-v2.5-pro`
21. MiMo V2.5 — `xiaomi/mimo-v2.5`
22. Gemini 3.5 Flash — `google/gemini-3.5-flash`
23. Gemini 3.1 Flash Lite — `google/gemini-3.1-flash-lite`

**Legacy aliases (5 — redirect to current models, lines 1213–1219):**
- `claude-sonnet-4-20250514` → Claude Sonnet 4.6
- `claude-sonnet-4-5-20250929` → Claude Sonnet 4.6
- `claude-opus-4-5-20251101` → Claude Opus 4.7
- `claude-opus-4-6` → Claude Opus 4.7
- `claude-haiku-4-5` → Claude Haiku 4.5

**Plus any model routed through OpenRouter or Cloudflare AI Gateway** (open-ended — users can configure custom models via these providers).

Even the premium models (Claude, GPT) occasionally trigger repairs — they're just rarer. The open-source models (DeepSeek, Qwen, GLM, Kimi, MiniMax, Step, MiMo) trigger repairs on a significant percentage of their tool calls. The system is model-agnostic; it fires based on what the validator sees, not which model produced the input.

---

## Table of Contents

- [The Core Insight](#the-core-insight)
- [The Failure Catalog](#the-failure-catalog)
- [The Architecture: Validate-Then-Repair](#the-architecture-validate-then-repair)
- [Decompiled Code: All 6 Post-Validation Repair Rules](#decompiled-code-all-6-post-validation-repair-rules)
- [Pre-Parse Repair Layer](#pre-parse-repair-layer)
- [The Markdown Auto-Link Bug](#the-markdown-auto-link-bug)
- [Relational Invariants: The read_file Fix](#relational-invariants-the-read_file-fix)
- [The Orchestrator: parseRepairedToolInput](#the-orchestrator-parserepairedtoolinput)
- [Telemetry and Observability](#telemetry-and-observability)
- [Model-Readable Error Messages](#model-readable-error-messages)
- [The Bigger Picture](#the-bigger-picture)
- [Line References](#line-references)

---

## The Core Insight

"Open model bad at tool calling" is almost always a **harness problem**, not a model problem.

A strict schema is a choice with a cost -- it filters out noise, but it also filters out **recoverable noise** from any model that hasn't memorized the exact JSON contract you happened to pick. The largest commercial models eat that cost invisibly because they've seen enough of every contract during pretraining; open models pay it loudly and get dismissed for it.

The harness is where you mediate between distributions. Four small repairs, two regex lines for auto-links, one relational default, one prefix change. The model didn't change. The contract got more forgiving in exactly the places it needed to be.

**"Skill issue" applies to the harness more often than the model.**

---

## The Failure Catalog

Across DeepSeek Flash, DeepSeek V4 Pro, GLM, Qwen -- the same mistakes repeat almost exactly. They are a **small, finite, compositional set**:

### 1. Null for Optional Field
The model sends `null` for an optional field instead of omitting it entirely.

```json
// What the model sends:
{ "absolutePath": "/src/main.ts", "offset": null }

// What the schema expects:
{ "absolutePath": "/src/main.ts" }
// (offset should be omitted, not null)
```

### 2. JSON-Stringified Array
The model emits `["a","b"]` as a JSON **string** instead of an actual array.

```json
// What the model sends:
{ "include": "[\"src/**/*.ts\", \"lib/**/*.js\"]" }

// What the schema expects:
{ "include": ["src/**/*.ts", "lib/**/*.js"] }
```

### 3. Empty Object Placeholder
The model wraps a single arg in `{}` where the schema expected an array.

```json
// What the model sends:
{ "include": {} }

// What the schema expects:
{ "include": ["src/**/*.ts"] }
```

### 4. Bare String Instead of Array
The model passes a single string where an array was expected.

```json
// What the model sends:
{ "include": "src/**/*.ts" }

// What the schema expects:
{ "include": ["src/**/*.ts"] }
```

### 5. Wrong Field Name (Aliasing)
The model uses a plausible but incorrect field name (`path` instead of `absolutePath`, `old_string` instead of `oldValue`).

```json
// What the model sends:
{ "path": "/src/main.ts" }

// What the schema expects:
{ "absolutePath": "/src/main.ts" }
```

### 6. Bare String as Root Input
The model sends a bare string instead of an object with the primary field.

```json
// What the model sends:
"/src/main.ts"

// What the schema expects:
{ "absolutePath": "/src/main.ts" }
```

**When someone says "this open-source model can't do tool calls," it's one of these six ~90% of the time.**

---

## The Architecture: Validate-Then-Repair

The first attempt was the obvious one: a preprocessing pass that normalized inputs before Zod ever saw them. It broke immediately -- `write_file` content that *happened* to be JSON-shaped got rewritten before it hit disk. Silent corruption.

The fix was **inverting the order**: validate-then-repair, not preprocess-then-validate.

```
Input arrives
    |
    v
[Zod safeParse] --- success? ---> Ship it. Valid inputs never touched.
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

**The structural insight:** when you preprocess, you encode a prior about what's broken. When you let the validator complain first, **the schema is the prior**, and you only spend repair budget at the exact paths the schema actually disagreed at. The validator localizes the bug for you.

This also gives you per-tool telemetry for free. You can watch repair rates per `(model, tool)` and notice when a model regresses on a specific contract before users do.

---

## Decompiled Code: All 6 Post-Validation Repair Rules

The post-validation repair rules are registered in order at **line 30756** of the beautified bundle:

```javascript
// Line 30756 -- Rule registry (ORDER MATTERS)
var gv = [
  ["renameAliasedField",          dv],
  ["dropNullOrUndefinedField",    lv],
  ["dropEmptyObjectPlaceholder",  av],
  ["parseJsonStringifiedArray",   cv],
  ["wrapBareStringAsArray",       mv],
];
```

**Order is critical:** `parseJsonStringifiedArray` must run before `wrapBareStringAsArray`, or `'["a","b"]'` becomes `['["a","b"]']` instead of `["a","b"]`.

### Rule 1: `renameAliasedField` (line 30688)

Maps common wrong field names to correct ones. Per-tool alias tables:

```javascript
// Line 30639 -- Per-tool field alias map
var uv = {
  read_file: {
    absolutePath: [
      "path", "file_path", "filePath", "filepath",
      "pathname", "target_file", "targetFile",
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
    oldValue: ["old_string", "oldString", "old", "old_str", "oldStr", "from"],
    newValue: ["new_string", "newString", "new", "new_str", "newStr", "to"],
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
    pattern: ["query", "glob", "expression", "search"],
  },
};
```

The repair function (line 30688):

```javascript
var dv = function({ toolName, parent, key, issue }) {
  if (typeof key !== "string") return false;

  // Only fire if the expected key is missing/empty
  const isMissing = !(key in parent) || parent[key] === undefined;
  const isEmpty = key in parent && parent[key] === "";
  if (issue.code === "invalid_type" && !isMissing) return false;
  if (issue.code === "too_small" && !isEmpty) return false;
  if (issue.code !== "invalid_type" && issue.code !== "too_small") return false;

  const toolAliases = uv[toolName];
  if (!toolAliases) return false;
  const aliases = toolAliases[key];
  if (!aliases) return false;

  // Check each alias -- if found, rename
  for (const alias of aliases) {
    if (!(alias in parent)) continue;
    const val = parent[alias];
    if (val != null && (typeof val !== "string" || val !== "")) {
      parent[key] = val;
      delete parent[alias];
      return {
        hint: `Renamed \`${alias}\` to \`${key}\` for tool "${toolName}". `
            + `Use \`${key}\` next time.`,
      };
    }
  }
  return false;
};
```

### Rule 2: `dropNullOrUndefinedField` (line 30604)

```javascript
var lv = function({ toolName, parent, key, value }) {
  if (!(key in parent)) return false;
  if (value != null) return false;  // only fire on null/undefined
  delete parent[key];
  const was = value === null ? "null" : "undefined";
  return {
    hint: `Dropped ${was} \`${String(key)}\` from tool "${toolName}". `
        + `Optional fields can be omitted entirely rather than sent as ${was}.`,
  };
};
```

### Rule 3: `dropEmptyObjectPlaceholder` (line 30589)

```javascript
var av = function({ toolName, parent, key, value, issue }) {
  if (issue.code !== "invalid_type") return false;
  if (issue.expected !== "array") return false;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  if (Object.keys(value).length !== 0) return false;  // only empty {}

  delete parent[key];
  return {
    hint: `Dropped empty \`{}\` placeholder from \`${String(key)}\` for tool "${toolName}". `
        + `Send an actual array (or omit the field) next time.`,
  };
};
```

### Rule 4: `parseJsonStringifiedArray` (line 30622)

```javascript
var cv = function({ toolName, parent, key, value, issue }) {
  if (issue.code !== "invalid_type") return false;
  if (issue.expected !== "array") return false;
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return false;

  const parsed = tryParseJsonArray(trimmed);
  if (parsed === null) return false;

  parent[key] = parsed;
  return {
    hint: `Parsed JSON-stringified array for \`${String(key)}\` in tool "${toolName}". `
        + `Send the array literal directly next time, not a string.`,
  };
};
```

### Rule 5: `wrapBareStringAsArray` (line 30714)

```javascript
var mv = function({ toolName, parent, key, value, issue }) {
  if (issue.code !== "invalid_type") return false;
  if (issue.expected !== "array") return false;
  if (typeof value !== "string") return false;

  parent[key] = [value];
  return {
    hint: `Wrapped your bare string in a single-element array for \`${String(key)}\` `
        + `in tool "${toolName}". Send an array next time, not a single string.`,
  };
};
```

### Rule 6: `wrapRootStringAsObject` (line 30734)

This one runs **before** the per-issue loop -- it handles the case where the entire input is a bare string:

```javascript
// Per-tool mapping of primary field + expected shape
var pv = {
  grep:                { field: "pattern",      shape: "string" },
  glob:                { field: "pattern",      shape: "string" },
  shell_command:       { field: "command",      shape: "string" },
  read_file:           { field: "absolutePath", shape: "string" },
  read_directory:      { field: "path",         shape: "string" },
  read_multiple_files: { field: "include",      shape: "array"  },
};

function wrapRootStringAsObject({ input, validationError, toolName }) {
  if (typeof input !== "string") return;
  const spec = pv[toolName];
  if (!spec) return;

  // Check that the root-level issue is "expected object, got string"
  const hasRootObjectIssue = validationError.issues.some(
    i => i.path.length === 0 && i.code === "invalid_type" && i.expected === "object"
  );
  if (!hasRootObjectIssue) return;

  const isArray = spec.shape === "array";
  return {
    wrapped: isArray ? { [spec.field]: [input] } : { [spec.field]: input },
    hint: `Wrapped your bare string as { ${spec.field}: "..." } for tool "${toolName}".`,
    ruleName: "wrapRootStringAsObject",
  };
}
```

---

## Pre-Parse Repair Layer (Line 35278-35349)

Before `parseRepairedToolInput` even runs, there's an **earlier repair layer** that handles broken JSON from the SSE stream. This catches models that emit tool arguments as malformed strings rather than parsed objects.

The entry point is `normalizeToolInput()` (line 35340), called at the SSE stream consumer (line 35470):

```javascript
// Line 35340 -- Called on every tool-call event from the SSE stream
function normalizeToolInput(input) {
  return typeof input !== "string" ? input : (parseToolArgs(input) ?? input);
}
```

It chains four strategies in order:

```javascript
// Line 35332
function parseToolArgs(str) {
  return (
    tryParseDirectly(str) ??          // 1. Plain JSON.parse
    tryParseAfterEscaping(str) ??     // 2. Escape control chars, then parse
    repairTruncatedJson(str) ??       // 3. Append missing closing tokens
    repairTruncatedJson(              // 4. Escape + repair truncation
      escapeControlCharsInJsonStrings(str)
    )
  );
}
```

### Strategy: `escapeControlCharsInJsonStrings` (line 35283)

Some models emit raw newlines, carriage returns, or tabs inside JSON string values. This function walks the string character-by-character, tracks whether it's inside a quoted string, and escapes control chars (`\n` -> `\\n`, `\r` -> `\\r`, `\t` -> `\\t`, others -> `\\uXXXX`):

```javascript
var Ek = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };

function escapeControlCharsInJsonStrings(str) {
  const out = [];
  let inString = false, i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (!inString) { if (ch === '"') inString = true; out.push(ch); i++; continue; }
    if (ch === '\\') { out.push(ch, str[i + 1] ?? ''); i += 2; continue; }
    if (ch === '"') { inString = false; out.push(ch); i++; continue; }
    const code = ch.charCodeAt(0);
    if (code >= 32) { out.push(ch); i++; }
    else { out.push(Ek[ch] ?? `\\u${code.toString(16).padStart(4, "0")}`); i++; }
  }
  return out.join("");
}
```

### Strategy: `repairTruncatedJson` (line 35308)

When a model's output gets cut off mid-JSON (context window limit, network interruption), this tries appending common closing sequences:

```javascript
var vk = ['"}', '"}}', "}", '": ""}'];

function repairTruncatedJson(str) {
  if (!str.startsWith("{")) return null;
  for (const suffix of vk) {
    try {
      const parsed = JSON.parse(str + suffix);
      if (isPlainObject(parsed)) return parsed;
    } catch {}
  }
  return null;
}
```

This handles cases like:
- `{"command": "ls -la` -> append `"}` -> `{"command": "ls -la"}`
- `{"filePath": "/src/main.ts", "content": "hello` -> append `"}` -> valid
- `{"absolutePath": "/src` -> append `": ""}` -> `{"absolutePath": "/src": ""}` (fallback)

### How It Fits Together

```
SSE stream delivers tool-call event
    |
    v
[normalizeToolInput] -- is input a string? -- no --> pass through as-is
    |                                                      |
    | yes (raw string from model)                          |
    v                                                      |
[parseToolArgs] -- try 4 strategies in order               |
    |                                                      |
    v                                                      v
Parsed object (or original string if all fail) -----> [parseRepairedToolInput]
                                                          |
                                                          v
                                                     (6 post-validation rules)
```

The pre-parse layer runs on **every** tool call from the SSE stream. The post-validation layer runs on every tool execution. Together they form a two-stage pipeline: fix the JSON envelope first, then fix the schema contents.

---

## The Markdown Auto-Link Bug

The funniest failure mode is also the most revealing.

DeepSeek Flash, when asked to edit or write a file, sometimes emits the path as a **markdown auto-link**:

```
filePath: "/Users/x/proj/[notes.md](http://notes.md)"
```

The `write_file` tool obediently tried creating files literally named `[notes.md](http://notes.md)` until they caught it. This is **not a hallucination**. It's the post-training chat distribution leaking through the tool boundary -- the model has been rewarded for auto-linking in conversational output, and is applying that prior in a context where it makes no sense.

### The Fix (line 30881)

Two regex lines that unwrap only the degenerate case where link text equals URL-without-protocol. Real markdown like `[click](https://x.com)` passes through untouched:

```javascript
// Line 30881
var hv = /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g;
var fv = /^https?:\/\//;

function unwrapMarkdownAutoLinks(input) {
  return input.replace(hv, (match, linkText, url) => {
    // Only unwrap if the link text equals the URL without protocol
    // e.g. [notes.md](http://notes.md) -> notes.md
    // but [click here](https://example.com) is kept as-is
    return url.replace(fv, "") !== linkText ? match : linkText;
  });
}
```

### The Schema-Level Fix: `pathString()` (line 30886)

Instead of patching individual fields, they created a custom Zod type that auto-strips the leak for every path field at once:

```javascript
function pathString() {
  return z.preprocess(
    (val) => (typeof val !== "string" ? val : unwrapMarkdownAutoLinks(val)),
    z.string()
  );
}
```

**"Tool confusion" is a more useful frame than "capability gap."** The model knows how to format a path. It just hasn't been told clearly enough that this path is going to `fopen()`, not into a chat bubble. Encoding that hint at the schema level plugs the leak everywhere.

---

## Relational Invariants: The read_file Fix

The four shape repairs handle type problems (wrong type, missing key, wrong container). But `read_file` had a **relational invariant**: "if you provide `offset`, you must also provide `limit`, and vice versa."

DeepSeek kept calling `readFile({ absolutePath, limit: 30 })` and getting an `ERROR:` back. You can't fix this with input repair, because each field is independently valid -- the bug is in the **relationship** between them.

### The Fix: Teach the Function the Model's Intent (line 31494)

```javascript
// Line 31494 -- Inside readFileContent()
if (offset === undefined && limit !== undefined) {
  // limit alone -> offset defaults to 0
  offset = 0;
  appliedDefaults = {
    defaulted: "offset",
    offset: 0,
    limit: limit,
    reason: "offset was not provided; defaulted to 0 (read from start of file). "
          + "To read a different range, retry with both offset and limit.",
  };
} else if (offset !== undefined && limit === undefined) {
  // offset alone -> limit defaults to 2000
  limit = 2000;
  appliedDefaults = {
    defaulted: "limit",
    offset: offset,
    limit: 2000,
    reason: "limit was not provided; defaulted to 2000 lines. "
          + "To read more or fewer lines, retry with both offset and limit.",
  };
}
```

Key design choice: **no `Error:` prefix**, so the TUI doesn't paint it red. The model sees what was picked and can self-correct on the next turn if the guess was wrong. **Transparency over silent magic.**

The applied defaults are surfaced back in the tool result:

```
Note: limit was not provided; defaulted to 2000 lines.
To read more or fewer lines, retry with both offset and limit.
```

**Repair where you can. Extend semantics where you can't. Surface the choice either way.**

---

## The Orchestrator: parseRepairedToolInput

This is the main function that every tool calls. It implements the validate-then-repair loop (line 30805):

```javascript
function parseRepairedToolInput({ schema, input, toolName, modelId }) {
  // Step 1: Try parsing as-is. Valid inputs are NEVER touched.
  const firstParse = schema.safeParse(input);
  if (firstParse.success) return { ok: true, data: firstParse.data };

  // Step 2: Attempt repairs guided by the validation error
  const repairResult = repairToolInput(input, firstParse.error, toolName);

  // No rules fired -> unrepairable
  if (repairResult.rulesFired.length === 0) {
    recordRepairOutcome({ toolName, outcome: "unrepairable", ... });
    logRepairDiagnostic({ toolName, outcome: "unrepairable", ... });
    return { ok: false, message: formatZodErrorForModel(toolName, firstParse.error) };
  }

  // Step 3: Re-validate the repaired input
  const secondParse = schema.safeParse(repairResult.input);

  if (secondParse.success) {
    // SUCCESS: repaired input is valid
    recordRepairOutcome({ toolName, outcome: "recovered", ... });
    logRepairDiagnostic({ toolName, outcome: "recovered", ... });
    return {
      ok: true,
      data: secondParse.data,
      // Attach hints so the model learns for next time
      ...(repairResult.hints.length > 0 ? { repairNotes: repairResult.hints } : {}),
    };
  } else {
    // Repairs applied but still invalid
    recordRepairOutcome({ toolName, outcome: "unrepairable", ... });
    logRepairDiagnostic({ toolName, outcome: "unrepairable", ... });
    return { ok: false, message: formatZodErrorForModel(toolName, secondParse.error) };
  }
}
```

### How Every Tool Uses It

Every single tool in the system follows the same pattern:

```javascript
// Example: read_file tool (line 31730)
execute: async (input) => {
  const t = parseRepairedToolInput({
    toolName: "read_file",
    schema: readFileSchema,
    input: input,
  });

  if (!t.ok) return t.message;  // model-readable error

  // Wrap output with repair notes so model sees what was fixed
  const noteWrap = (output) =>
    withRepairNotes({ notes: t.repairNotes, toolOutput: output });

  try {
    return noteWrap(formatOutput(await readFileContent(t.data)));
  } catch (e) {
    return noteWrap(`ERROR: ${e.message}`);
  }
};
```

### Repair Notes Format

When repairs are applied, hints are prepended to the tool output as XML tags:

```javascript
// Line 30892
function withRepairNotes({ notes, toolOutput }) {
  if (!notes || notes.length === 0) return toolOutput;
  return [
    ...notes.map(n => `<repair_note>${n}</repair_note>`),
    toolOutput,
  ].join("\n");
}
```

Example output the model sees:

```
<repair_note>Renamed `path` to `absolutePath` for tool "read_file". Use `absolutePath` next time.</repair_note>
<repair_note>Dropped null `offset` from tool "read_file". Optional fields can be omitted entirely.</repair_note>
File contents of /src/main.ts:
...
```

---

## Telemetry and Observability

Every repair outcome is tracked with rich telemetry (line 30488):

```javascript
function emitRepairOutcomeTelemetry({
  toolName, outcome, validationError, input, modelId, rulesFired, hintCount
}) {
  const eventName = outcome === "recovered"
    ? `tool_input_repaired:${toolName}`
    : `tool_input_invalid:${toolName}`;

  trackError({
    error: validationError,
    context: {
      component: "tool-repair",
      heading: eventName,
      code: outcome,
      "tool.name": toolName,
      "repair.outcome": outcome,                    // "recovered" or "unrepairable"
      "repair.issue_count": validationError.issues.length,
      "repair.issue_codes": uniqueIssueCodes,        // e.g. "invalid_type,too_small"
      "repair.received_root_type": rootType,         // "object", "string", "null", "array"
      "repair.received_keys": receivedKeys,          // "absolutePath,content,offset"
      "repair.rule_fired": rulesFired.join(","),      // "dropNullOrUndefinedField,renameAliasedField"
      "repair.hint_count": hintCount,
      "repair.shape_fingerprint": fingerprint,        // FNV-1a hash for dedup
      "gen_ai.request.model": modelId,
    },
  });
}
```

### Shape Fingerprint (line 30535)

A FNV-1a hash of `toolName::path|code|expected|received` for each issue, sorted and joined. This lets you track unique failure shapes across the fleet:

```javascript
function computeShapeFingerprint(toolName, error) {
  return shortHash(
    `${toolName}::${error.issues.map(formatIssueForFingerprint).sort().join(";")}`
  );
}

function shortHash(str) {
  return str.split("").reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619),
    2166136261  // FNV offset basis
  ) >>> 0).toString(16).padStart(8, "0");
}
```

### Diagnostic Logging (line 30437)

Enabled via `CMD_LOG_REPAIRS` env var:

```
[cmd:repair] tool=read_file outcome=recovered rules=renameAliasedField,dropNullOrUndefinedField hints=2
  input:    {"path":"/src/main.ts","offset":null}
  repaired: {"absolutePath":"/src/main.ts"}
  hint[0]: Renamed `path` to `absolutePath` for tool "read_file". Use `absolutePath` next time.
  hint[1]: Dropped null `offset` from tool "read_file". Optional fields can be omitted entirely.
```

---

## Model-Readable Error Messages

When repair fails, the error message is formatted for the model to understand and retry (line 30427):

```javascript
function formatZodErrorForModel(toolName, error) {
  return [
    `Invalid input for tool "${toolName}". Please correct and retry:`,
    ...error.issues.map(issue =>
      issue.path.length === 0
        ? `  * (root): ${issue.message}`
        : `  * ${issue.path.join(".")}: ${issue.message}`
    ),
  ].join("\n");
}
```

Example output:

```
Invalid input for tool "edit_file". Please correct and retry:
  * filePath: Required
  * oldValue: Required
  * newValue: Required
```

Note: this does **not** start with `ERROR:` -- the TUI uses `ERROR:` prefix to paint red. This is a correctable situation, not a fatal error.

---

## The Bigger Picture

A lot of what looks like model capability is actually **contract design**.

### All 13 Repair Mechanisms at a Glance

| # | Layer | Mechanism | Lines of Code | What It Fixes |
|---|---|---|---|---|
| 1 | Pre-parse | `tryParseDirectly` | ~8 | Double-stringified JSON tool args |
| 2 | Pre-parse | `escapeControlCharsInJsonStrings` | ~25 | Raw `\n`, `\r`, `\t` inside JSON strings |
| 3 | Pre-parse | `repairTruncatedJson` | ~10 | Truncated JSON (appends `"}`, `"}}`, `}`, `": ""}`) |
| 4 | Pre-parse | `normalizeToolInput` | ~3 | Orchestrates all pre-parse strategies |
| 5 | Post-validation | `renameAliasedField` | ~25 | Wrong field names (`path` -> `absolutePath`, `old_string` -> `oldValue`) |
| 6 | Post-validation | `dropNullOrUndefinedField` | ~10 | `null`/`undefined` sent for optional fields |
| 7 | Post-validation | `dropEmptyObjectPlaceholder` | ~12 | `{}` sent where array expected |
| 8 | Post-validation | `parseJsonStringifiedArray` | ~16 | `'["a","b"]'` string instead of actual array |
| 9 | Post-validation | `wrapBareStringAsArray` | ~10 | `"foo"` instead of `["foo"]` |
| 10 | Post-validation | `wrapRootStringAsObject` | ~22 | Bare string instead of `{ field: "..." }` |
| 11 | Schema-level | `unwrapMarkdownAutoLinks` | ~4 | DeepSeek's `[file.md](http://file.md)` in paths |
| 12 | Schema-level | `pathString()` | ~4 | Auto-applies link unwrap to every path field |
| 13 | Semantic | `read_file` relational defaults | ~20 | Infers `offset=0` or `limit=2000` when one is missing |

**Total: ~170 lines of repair infrastructure across 10 tools and 23 current models (28 model IDs with legacy aliases).**

### How 13 Rules Become 36K+ Repairs

Each of the 13 mechanisms fires independently per tool call. With:
- **23 current models** + 5 legacy aliases (+ custom models via OpenRouter/Cloudflare)
- **10 repaired tools** (read_file, edit_file, write_file, read_directory, read_multiple_files, grep, glob, shell_command, diagnostics, + MCP tools)
- **Thousands of users** making dozens of tool calls per session

The math adds up fast. The telemetry event `tool_input_repaired:{toolName}` fires every time a post-validation rule succeeds, and `normalizeToolInput` silently fixes pre-parse issues on every SSE stream. The 36K+ is the production count of **successful repairs that would have been hard errors without the layer** — tool calls that would have bounced back to the model as Zod validation failures, often triggering a retry spiral.

**Result: DeepSeek V4 Pro beats Claude Opus 4.7 six out of ten times on internal evals.**

The model didn't change. The contract got more forgiving in exactly the places it needed to be.

---

## Line References

All line numbers reference the beautified bundle at `index.mjs` (70,494 lines).

| Component | Lines |
|---|---|
| Repair rule registry (`gv`) | 30756-30761 |
| `renameAliasedField` | 30688-30712 |
| Field alias map (`uv`) | 30639-30687 |
| `dropNullOrUndefinedField` | 30604-30612 |
| `dropEmptyObjectPlaceholder` | 30589-30601 |
| `parseJsonStringifiedArray` | 30622-30637 |
| `wrapBareStringAsArray` | 30714-30724 |
| `wrapRootStringAsObject` | 30726-30755 |
| `repairToolInput` orchestrator | 30763-30784 |
| `applyRepairsToIssue` | 30785-30798 |
| `parseRepairedToolInput` (main entry) | 30805-30875 |
| `unwrapMarkdownAutoLinks` | 30881-30884 |
| `pathString()` custom Zod type | 30886-30891 |
| `withRepairNotes` | 30892-30896 |
| `formatZodErrorForModel` | 30427-30436 |
| `logRepairDiagnostic` | 30437-30462 |
| `emitRepairOutcomeTelemetry` | 30488-30525 |
| `computeShapeFingerprint` (FNV-1a) | 30535-30545 |
| `read_file` relational defaults | 31494-31513 |
| `read_file` tool execution | 31730-31752 |
| `edit_file` tool execution | 30584-32600 |
| `write_file` tool execution | 32856-32870 |
| `grep` tool execution | 33374-33395 |
| `glob` tool execution | 33484-33500 |
| `shell_command` tool execution | 33671-33703 |
| `read_directory` tool execution | 32780-32800 |
| `read_multiple_files` tool execution | 33118-33135 |
| `diagnostics` tool execution | 34959-34965 |
| Telemetry component constant | 5472 |