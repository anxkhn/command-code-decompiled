function formatZodErrorForModel(e, t) {
  return [
    `Invalid input for tool "${e}". Please correct and retry:`,
    ...t.issues.map((e) =>
      0 === e.path.length
        ? `  • (root): ${e.message}`
        : `  • ${e.path.join(".")}: ${e.message}`,
    ),
  ].join("\n");
}
function logRepairDiagnostic(e) {
  if (!isDiagnosticEnabled()) return;
  const t = 0 === e.rulesFired.length ? "none" : e.rulesFired.join(","),
    n = [
      `[cmd:repair] tool=${e.toolName} outcome=${e.outcome} rules=${t} hints=${e.hints.length}`,
    ];
  if (
    (n.push(`  input:    ${truncate(stringifySafe(e.rawInput))}`),
    null !== e.repairedInput &&
      e.repairedInput !== e.rawInput &&
      n.push(`  repaired: ${truncate(stringifySafe(e.repairedInput))}`),
    e.hints.forEach((e, t) => {
      n.push(`  hint[${t}]: ${truncate(e)}`);
    }),
    "unrepairable" === e.outcome)
  ) {
    const t = e.validationError.issues[0];
    if (void 0 !== t) {
      const e = 0 === t.path.length ? "(root)" : t.path.join(".");
      n.push(
        `  issue:    code=${t.code} path=${e} message=${truncate(t.message)}`,
      );
    }
  }
  process.stderr.write(`${n.join("\n")}\n`);
}
function isDiagnosticEnabled() {
  try {
    const e = process.env.CMD_LOG_REPAIRS;
    return void 0 !== e && "" !== e && "0" !== e && "false" !== e;
  } catch {
    return !1;
  }
}
function stringifySafe(e) {
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
function truncate(e) {
  if (e.length <= 500) return e;
  const t = e.length - 500;
  return `${e.slice(0, 500)}…+${t}`;
}
function recordRepairOutcome(e) {
  try {
    emitRepairOutcomeTelemetry(e);
  } catch {}
}
function emitRepairOutcomeTelemetry(e) {
  const {
      toolName: t,
      outcome: n,
      validationError: r,
      input: o,
      modelId: s,
      rulesFired: i,
      hintCount: a,
    } = e,
    l =
      "recovered" === n
        ? `tool_input_repaired:${t}`
        : `tool_input_invalid:${t}`,
    u = Array.from(new Set(r.issues.map((e) => e.code))).join(","),
    d = describeRootType(o),
    m = "object" === d ? summarizeReceivedKeys(o) : void 0,
    g = computeShapeFingerprint(t, r),
    h = void 0 !== i && i.length > 0 ? i.join(",") : void 0;
  trackError({
    error: r,
    context: {
      component: gs.TOOL_REPAIR,
      heading: l,
      code: n,
      "tool.name": t,
      "repair.outcome": n,
      "repair.issue_count": r.issues.length,
      "repair.issue_codes": u,
      "repair.received_root_type": d,
      ...(void 0 !== m ? { "repair.received_keys": m } : {}),
      ...(void 0 !== h ? { "repair.rule_fired": h } : {}),
      ...(void 0 !== a && a > 0 ? { "repair.hint_count": a } : {}),
      "repair.shape_fingerprint": g,
      ...(void 0 !== s ? { "gen_ai.request.model": s } : {}),
    },
  });
}
function summarizeReceivedKeys(e) {
  const t = Object.keys(e).sort();
  if (t.length <= 20) return t.join(",");
  const n = t.length - 20;
  return [...t.slice(0, 20), `…+${n}`].join(",");
}
function describeRootType(e) {
  return null === e ? "null" : Array.isArray(e) ? "array" : typeof e;
}
function computeShapeFingerprint(e, t) {
  return shortHash(
    `${e}::${t.issues.map(formatIssueForFingerprint).sort().join(";")}`,
  );
}
function formatIssueForFingerprint(e) {
  const t = 0 === e.path.length ? "(root)" : e.path.join("."),
    n = e.expected ?? "",
    r = e.received ?? "";
  return `${t}|${e.code}|${n}|${r}`;
}
(CS(),
  Ot(),
  Ot(),
  Ot(),
  Ot(),
  __name(formatZodErrorForModel, "formatZodErrorForModel"),
  Ot(),
  __name(logRepairDiagnostic, "logRepairDiagnostic"),
  __name(isDiagnosticEnabled, "isDiagnosticEnabled"),
  __name(stringifySafe, "stringifySafe"),
  __name(truncate, "truncate"),
  Ot(),
  ws(),
  Ss(),
  __name(recordRepairOutcome, "recordRepairOutcome"),
  __name(emitRepairOutcomeTelemetry, "emitRepairOutcomeTelemetry"),
  __name(summarizeReceivedKeys, "summarizeReceivedKeys"),
  __name(describeRootType, "describeRootType"),
  __name(computeShapeFingerprint, "computeShapeFingerprint"),
  __name(formatIssueForFingerprint, "formatIssueForFingerprint"));
var sv = 2166136261,
  iv = 16777619;
function shortHash(e) {
  return (
    e.split("").reduce((e, t) => Math.imul(e ^ t.charCodeAt(0), iv), sv) >>> 0
  )
    .toString(16)
    .padStart(8, "0");
}
function deepCloneToolInput(e) {
  if (null === e) return e;
  if ("object" != typeof e) return e;
  if (Array.isArray(e)) return e.map(deepCloneToolInput);
  const t = e,
    n = {};
  for (const [e, r] of Object.entries(t)) n[e] = deepCloneToolInput(r);
  return n;
}
(__name(shortHash, "shortHash"),
  Ot(),
  Ot(),
  __name(deepCloneToolInput, "deepCloneToolInput"),
  Ot());
var av = __name(
  ({ toolName: e, parent: t, key: n, value: r, issue: o }) =>
    "invalid_type" === o.code &&
    "array" === o.expected &&
    "object" == typeof r &&
    null !== r &&
    !Array.isArray(r) &&
    0 === Object.keys(r).length &&
    (delete t[n],
    {
      hint: `Dropped empty \`{}\` placeholder from \`${String(n)}\` for tool "${e}". Send an actual array (or omit the field) next time.`,
    }),
  "dropEmptyObjectPlaceholder",
);
Ot();
var lv = __name(({ toolName: e, parent: t, key: n, value: r }) => {
  if (!(n in t)) return !1;
  if (null != r) return !1;
  delete t[n];
  const o = null === r ? "null" : "undefined";
  return {
    hint: `Dropped ${o} \`${String(n)}\` from tool "${e}". Optional fields can be omitted entirely rather than sent as ${o}.`,
  };
}, "dropNullOrUndefinedField");
function tryParseJsonArray(e) {
  try {
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : null;
  } catch {
    return null;
  }
}
(Ot(), __name(tryParseJsonArray, "tryParseJsonArray"));
var cv = __name(({ toolName: e, parent: t, key: n, value: r, issue: o }) => {
  if ("invalid_type" !== o.code) return !1;
  if ("array" !== o.expected) return !1;
  if ("string" != typeof r) return !1;
  const s = r.trim();
  if (!s.startsWith("[")) return !1;
  if (!s.endsWith("]")) return !1;
  const i = tryParseJsonArray(s);
  return (
    null !== i &&
    ((t[n] = i),
    {
      hint: `Parsed JSON-stringified array for \`${String(n)}\` in tool "${e}". Send the array literal directly (e.g. \`["a","b"]\`) next time, not a string.`,
    })
  );
}, "parseJsonStringifiedArray");
Ot();
// v0.33.0 — Field alias map (expanded from v0.28.1)
// +3 new aliases for read_file, +5 each for edit_file old/newValue, +1 for glob
var wv = {
    read_file: {
      absolutePath: [
        "path",
        "file_path",
        "filePath",
        "filepath",
        "pathname",
        "target_file",
        "targetFile",
        "file",                    // NEW in v0.33.0
        "absolute_path",           // NEW in v0.33.0
        "fileAbsolutePath",        // NEW in v0.33.0
      ],
    },
    grep: { pattern: ["query", "regex", "search", "q", "expression", "text"] },
    write_file: {
      filePath: [
        "path",
        "absolutePath",
        "file_path",
        "filepath",
        "pathname",
        "target_file",
        "targetFile",
      ],
      content: ["text", "body", "data", "contents", "fileContent"],
    },
    edit_file: {
      filePath: [
        "path",
        "absolutePath",
        "file_path",
        "filepath",
        "pathname",
        "target_file",
        "targetFile",
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
    },
    read_multiple_files: {
      include: ["paths", "files", "file_paths", "filePaths", "patterns"],
    },
    shell_command: {
      command: ["cmd", "bash", "shell", "script", "commandLine"],
    },
    glob: { pattern: ["query", "glob", "expression", "search", "include"] },  // +1 NEW
  },
  dv = __name(({ toolName: e, parent: t, key: n, issue: r }) => {
    if ("string" != typeof n) return !1;
    const o = !(n in t) || void 0 === t[n],
      s = n in t && "" === t[n];
    if ("invalid_type" === r.code && !o) return !1;
    if ("too_small" === r.code && !s) return !1;
    if ("invalid_type" !== r.code && "too_small" !== r.code) return !1;
    const i = uv[e];
    if (void 0 === i) return !1;
    const a = i[n];
    if (void 0 === a) return !1;
    for (const r of a) {
      if (!(r in t)) continue;
      const o = t[r];
      if (null != o && ("string" != typeof o || "" !== o))
        return (
          (t[n] = o),
          delete t[r],
          {
            hint: `Renamed \`${r}\` to \`${n}\` for tool "${e}". Use \`${n}\` next time — \`${r}\` is not a valid field for this tool.`,
          }
        );
    }
    return !1;
  }, "renameAliasedField");
Ot();
var mv = __name(
  ({ toolName: e, parent: t, key: n, value: r, issue: o }) =>
    "invalid_type" === o.code &&
    "array" === o.expected &&
    "string" == typeof r &&
    ((t[n] = [r]),
    {
      hint: `Wrapped your bare string in a single-element array for \`${String(n)}\` in tool "${e}". Send an array (e.g. \`["foo"]\`) next time, not a single string.`,
    }),
  "wrapBareStringAsArray",
);
Ot();
var pv = {
  grep: { field: "pattern", shape: "string" },
  glob: { field: "pattern", shape: "string" },
  shell_command: { field: "command", shape: "string" },
  read_file: { field: "absolutePath", shape: "string" },
  read_directory: { field: "path", shape: "string" },
  read_multiple_files: { field: "include", shape: "array" },
};
function wrapRootStringAsObject(e) {
  const { input: t, validationError: n, toolName: r } = e;
  if ("string" != typeof t) return;
  const o = pv[r];
  if (void 0 === o) return;
  if (
    !n.issues.some(
      (e) =>
        0 === e.path.length &&
        "invalid_type" === e.code &&
        "object" === e.expected,
    )
  )
    return;
  const s = "array" === o.shape;
  return {
    wrapped: s ? { [o.field]: [t] } : { [o.field]: t },
    hint: `Wrapped your bare string as ${s ? `\`{${o.field}: ["..."]}\`` : `\`{${o.field}: "..."}\``} for tool "${r}". Call this tool with an object, not a bare string, next time.`,
    ruleName: "wrapRootStringAsObject",
  };
}
__name(wrapRootStringAsObject, "wrapRootStringAsObject");
var gv = [
  ["renameAliasedField", dv],
  ["dropNullOrUndefinedField", lv],
  ["dropEmptyObjectPlaceholder", av],
  ["parseJsonStringifiedArray", cv],
  ["wrapBareStringAsArray", mv],
];
function repairToolInput(e, t, n) {
  const r = wrapRootStringAsObject({
    input: e,
    validationError: t,
    toolName: n,
  });
  if (void 0 !== r)
    return { input: r.wrapped, rulesFired: [r.ruleName], hints: [r.hint] };
  if (null === e) return { input: e, rulesFired: [], hints: [] };
  if ("object" != typeof e) return { input: e, rulesFired: [], hints: [] };
  const o = deepCloneToolInput(e),
    s = [],
    i = [];
  for (const e of t.issues) {
    const t = applyRepairsToIssue(o, e, n);
    null !== t &&
      (s.includes(t.ruleName) || s.push(t.ruleName), i.push(t.hint));
  }
  return 0 === s.length
    ? { input: e, rulesFired: [], hints: [] }
    : { input: o, rulesFired: s, hints: i };
}
function applyRepairsToIssue(e, t, n) {
  const r = t.path;
  if (0 === r.length) return null;
  const o = walkToParentContainer(e, r);
  if (void 0 === o) return null;
  const s = r[r.length - 1];
  if (void 0 === s) return null;
  const i = o[s];
  for (const [e, r] of gv) {
    const a = r({ toolName: n, parent: o, key: s, value: i, issue: t });
    if (!1 !== a) return { ruleName: e, hint: a.hint };
  }
  return null;
}
function walkToParentContainer(e, t) {
  const n = t.slice(0, -1).reduce((e, t) => {
    if (null !== e && "object" == typeof e) return e[t];
  }, e);
  if (null !== n && "object" == typeof n) return n;
}
function parseRepairedToolInput(e) {
  const t = e.schema.safeParse(e.input);
  if (t.success) return { ok: !0, data: t.data };
  const n = repairToolInput(e.input, t.error, e.toolName);
  if (0 === n.rulesFired.length)
    return (
      recordRepairOutcome({
        toolName: e.toolName,
        outcome: "unrepairable",
        validationError: t.error,
        input: e.input,
        modelId: e.modelId,
        rulesFired: n.rulesFired,
        hintCount: n.hints.length,
      }),
      logRepairDiagnostic({
        toolName: e.toolName,
        outcome: "unrepairable",
        rawInput: e.input,
        repairedInput: null,
        rulesFired: n.rulesFired,
        hints: n.hints,
        validationError: t.error,
      }),
      { ok: !1, message: formatZodErrorForModel(e.toolName, t.error) }
    );
  const r = e.schema.safeParse(n.input);
  return r.success
    ? (recordRepairOutcome({
        toolName: e.toolName,
        outcome: "recovered",
        validationError: t.error,
        input: e.input,
        modelId: e.modelId,
        rulesFired: n.rulesFired,
        hintCount: n.hints.length,
      }),
      logRepairDiagnostic({
        toolName: e.toolName,
        outcome: "recovered",
        rawInput: e.input,
        repairedInput: n.input,
        rulesFired: n.rulesFired,
        hints: n.hints,
        validationError: t.error,
      }),
      {
        ok: !0,
        data: r.data,
        ...(n.hints.length > 0 ? { repairNotes: n.hints } : {}),
      })
    : (recordRepairOutcome({
        toolName: e.toolName,
        outcome: "unrepairable",
        validationError: r.error,
        input: e.input,
        modelId: e.modelId,
        rulesFired: n.rulesFired,
        hintCount: n.hints.length,
      }),
      logRepairDiagnostic({
        toolName: e.toolName,
        outcome: "unrepairable",
        rawInput: e.input,
        repairedInput: n.input,
        rulesFired: n.rulesFired,
        hints: n.hints,
        validationError: r.error,
      }),
      { ok: !1, message: formatZodErrorForModel(e.toolName, r.error) });
}
(__name(repairToolInput, "repairToolInput"),
  __name(applyRepairsToIssue, "applyRepairsToIssue"),
  __name(walkToParentContainer, "walkToParentContainer"),
  __name(parseRepairedToolInput, "parseRepairedToolInput"),
  Ot());
var hv = /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g,
  fv = /^https?:\/\//;
function unwrapMarkdownAutoLinks(e) {
  return e.replace(hv, (e, t, n) => (n.replace(fv, "") !== t ? e : t));
}
function pathString() {
  return f.preprocess(
    (e) => ("string" != typeof e ? e : unwrapMarkdownAutoLinks(e)),
    f.string(),
  );
}
function withRepairNotes({ notes: e, toolOutput: t }) {
  return void 0 === e || 0 === e.length
    ? t
    : [...e.map((e) => `<repair_note>${e}</repair_note>`), t].join("\n");
}

// NEW in v0.33.0 — Round-trip: parse repair notes back out of tool output
var Tv = /^<repair_note>([\s\S]*?)<\/repair_note>$/;
function extractRepairNotes(toolOutput) {
  const lines = toolOutput.split("\n");
  const notes = [];
  let noteCount = 0;
  for (const line of lines) {
    const match = line.match(Tv);
    if (null === match) break;
    notes.push(match[1] ?? "");
    noteCount += 1;
  }
  return noteCount === 0
    ? { notes: [], body: toolOutput }
    : { notes, body: lines.slice(noteCount).join("\n") };
}
