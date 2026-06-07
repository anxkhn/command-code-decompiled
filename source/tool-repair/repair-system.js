function formatZodErrorForModel(toolName, zodError) {
  return [
    `Invalid input for tool "${toolName}". Please correct and retry:`,
    ...zodError.issues.map((issue) =>
      0 === issue.path.length
        ? `  • (root): ${issue.message}`
        : `  • ${issue.path.join(".")}: ${issue.message}`,
    ),
  ].join("\n");
}
function logRepairDiagnostic(diagnostic) {
  if (!isDiagnosticEnabled()) return;
  const rulesStr = 0 === diagnostic.rulesFired.length ? "none" : diagnostic.rulesFired.join(","),
    lines = [
      `[cmd:repair] tool=${diagnostic.toolName} outcome=${diagnostic.outcome} rules=${rulesStr} hints=${diagnostic.hints.length}`,
    ];
  if (
    (lines.push(`  input:    ${truncate(stringifySafe(diagnostic.rawInput))}`),
    null !== diagnostic.repairedInput &&
      diagnostic.repairedInput !== diagnostic.rawInput &&
      lines.push(`  repaired: ${truncate(stringifySafe(diagnostic.repairedInput))}`),
    diagnostic.hints.forEach((hint, index) => {
      lines.push(`  hint[${index}]: ${truncate(hint)}`);
    }),
    "unrepairable" === diagnostic.outcome)
  ) {
    const firstIssue = diagnostic.validationError.issues[0];
    if (void 0 !== firstIssue) {
      const pathStr = 0 === firstIssue.path.length ? "(root)" : firstIssue.path.join(".");
      lines.push(
        `  issue:    code=${firstIssue.code} path=${pathStr} message=${truncate(firstIssue.message)}`,
      );
    }
  }
  process.stderr.write(`${lines.join("\n")}\n`);
}
function isDiagnosticEnabled() {
  try {
    const envValue = process.env.CMD_LOG_REPAIRS;
    return void 0 !== envValue && "" !== envValue && "0" !== envValue && "false" !== envValue;
  } catch {
    return !1;
  }
}
function stringifySafe(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
function truncate(str) {
  if (str.length <= 500) return str;
  const remaining = str.length - 500;
  return `${str.slice(0, 500)}…+${remaining}`;
}
function recordRepairOutcome(outcome) {
  try {
    emitRepairOutcomeTelemetry(outcome);
  } catch {}
}
function emitRepairOutcomeTelemetry({
    toolName,
    outcome,
    validationError,
    input,
    modelId,
    rulesFired,
    hintCount,
  }) {
  const eventName =
      "recovered" === outcome
        ? `tool_input_repaired:${toolName}`
        : `tool_input_invalid:${toolName}`,
    issueCodes = Array.from(new Set(validationError.issues.map((issue) => issue.code))).join(","),
    rootType = describeRootType(input),
    receivedKeys = "object" === rootType ? summarizeReceivedKeys(input) : void 0,
    fingerprint = computeShapeFingerprint(toolName, validationError),
    rulesFiredStr = void 0 !== rulesFired && rulesFired.length > 0 ? rulesFired.join(",") : void 0;
  trackError({
    error: validationError,
    context: {
      component: gs.TOOL_REPAIR,
      heading: eventName,
      code: outcome,
      "tool.name": toolName,
      "repair.outcome": outcome,
      "repair.issue_count": validationError.issues.length,
      "repair.issue_codes": issueCodes,
      "repair.received_root_type": rootType,
      ...(void 0 !== receivedKeys ? { "repair.received_keys": receivedKeys } : {}),
      ...(void 0 !== rulesFiredStr ? { "repair.rule_fired": rulesFiredStr } : {}),
      ...(void 0 !== hintCount && hintCount > 0 ? { "repair.hint_count": hintCount } : {}),
      "repair.shape_fingerprint": fingerprint,
      ...(void 0 !== modelId ? { "gen_ai.request.model": modelId } : {}),
    },
  });
}
function summarizeReceivedKeys(input) {
  const keys = Object.keys(input).sort();
  if (keys.length <= 20) return keys.join(",");
  const remaining = keys.length - 20;
  return [...keys.slice(0, 20), `…+${remaining}`].join(",");
}
function describeRootType(value) {
  return null === value ? "null" : Array.isArray(value) ? "array" : typeof value;
}
function computeShapeFingerprint(toolName, zodError) {
  return shortHash(
    `${toolName}::${zodError.issues.map(formatIssueForFingerprint).sort().join(";")}`,
  );
}
function formatIssueForFingerprint(issue) {
  const path = 0 === issue.path.length ? "(root)" : issue.path.join("."),
    expected = issue.expected ?? "",
    received = issue.received ?? "";
  return `${path}|${issue.code}|${expected}|${received}`;
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
var sv /* FNV_OFFSET_BASIS */ = 2166136261,
  iv /* FNV_PRIME */ = 16777619;
function shortHash(str) {
  return (
    str.split("").reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), iv), sv) >>> 0
  )
    .toString(16)
    .padStart(8, "0");
}
function deepCloneToolInput(input) {
  if (null === input) return input;
  if ("object" != typeof input) return input;
  if (Array.isArray(input)) return input.map(deepCloneToolInput);
  const obj = input,
    result = {};
  for (const [key, val] of Object.entries(obj)) result[key] = deepCloneToolInput(val);
  return result;
}
(__name(shortHash, "shortHash"),
  Ot(),
  Ot(),
  __name(deepCloneToolInput, "deepCloneToolInput"),
  Ot());
var av /* dropEmptyObjectPlaceholder */ = __name(
  ({ toolName, parent, key, value, issue }) =>
    "invalid_type" === issue.code &&
    "array" === issue.expected &&
    "object" == typeof value &&
    null !== value &&
    !Array.isArray(value) &&
    0 === Object.keys(value).length &&
    (delete parent[key],
    {
      hint: `Dropped empty \`{}\` placeholder from \`${String(key)}\` for tool "${toolName}". Send an actual array (or omit the field) next time.`,
    }),
  "dropEmptyObjectPlaceholder",
);
Ot();
var lv /* dropNullOrUndefinedField */ = __name(({ toolName, parent, key, value }) => {
  if (!(key in parent)) return !1;
  if (null != value) return !1;
  delete parent[key];
  const nullType = null === value ? "null" : "undefined";
  return {
    hint: `Dropped ${nullType} \`${String(key)}\` from tool "${toolName}". Optional fields can be omitted entirely rather than sent as ${nullType}.`,
  };
}, "dropNullOrUndefinedField");
function tryParseJsonArray(str) {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
(Ot(), __name(tryParseJsonArray, "tryParseJsonArray"));
var cv /* parseJsonStringifiedArray */ = __name(({ toolName, parent, key, value, issue }) => {
  if ("invalid_type" !== issue.code) return !1;
  if ("array" !== issue.expected) return !1;
  if ("string" != typeof value) return !1;
  const trimmed = value.trim();
  if (!trimmed.startsWith("[")) return !1;
  if (!trimmed.endsWith("]")) return !1;
  const parsed = tryParseJsonArray(trimmed);
  return (
    null !== parsed &&
    ((parent[key] = parsed),
    {
      hint: `Parsed JSON-stringified array for \`${String(key)}\` in tool "${toolName}". Send the array literal directly (e.g. \`["a","b"]\`) next time, not a string.`,
    })
  );
}, "parseJsonStringifiedArray");
Ot();
// v0.33.0 — Field alias map (expanded from v0.28.1)
// +3 new aliases for read_file, +5 each for edit_file old/newValue, +1 for glob
var wv /* FIELD_ALIAS_MAP */ = {
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
  dv /* renameAliasedField */ = __name(({ toolName, parent, key, issue }) => {
    if ("string" != typeof key) return !1;
    const isMissingOrUndefined = !(key in parent) || void 0 === parent[key],
      isEmpty = key in parent && "" === parent[key];
    if ("invalid_type" === issue.code && !isMissingOrUndefined) return !1;
    if ("too_small" === issue.code && !isEmpty) return !1;
    if ("invalid_type" !== issue.code && "too_small" !== issue.code) return !1;
    const aliases = wv[toolName];
    if (void 0 === aliases) return !1;
    const aliasList = aliases[key];
    if (void 0 === aliasList) return !1;
    for (const alias of aliasList) {
      if (!(alias in parent)) continue;
      const aliasValue = parent[alias];
      if (null != aliasValue && ("string" != typeof aliasValue || "" !== aliasValue))
        return (
          (parent[key] = aliasValue),
          delete parent[alias],
          {
            hint: `Renamed \`${alias}\` to \`${key}\` for tool "${toolName}". Use \`${key}\` next time — \`${alias}\` is not a valid field for this tool.`,
          }
        );
    }
    return !1;
  }, "renameAliasedField");
Ot();
var mv /* wrapBareStringAsArray */ = __name(
  ({ toolName, parent, key, value, issue }) =>
    "invalid_type" === issue.code &&
    "array" === issue.expected &&
    "string" == typeof value &&
    ((parent[key] = [value]),
    {
      hint: `Wrapped your bare string in a single-element array for \`${String(key)}\` in tool "${toolName}". Send an array (e.g. \`["foo"]\`) next time, not a single string.`,
    }),
  "wrapBareStringAsArray",
);
Ot();
var pv /* ROOT_STRING_WRAP_SPECS */ = {
  grep: { field: "pattern", shape: "string" },
  glob: { field: "pattern", shape: "string" },
  shell_command: { field: "command", shape: "string" },
  read_file: { field: "absolutePath", shape: "string" },
  read_directory: { field: "path", shape: "string" },
  read_multiple_files: { field: "include", shape: "array" },
};
function wrapRootStringAsObject({ input, validationError, toolName }) {
  if ("string" != typeof input) return;
  const spec = pv[toolName];
  if (void 0 === spec) return;
  if (
    !validationError.issues.some(
      (issue) =>
        0 === issue.path.length &&
        "invalid_type" === issue.code &&
        "object" === issue.expected,
    )
  )
    return;
  const isArrayShape = "array" === spec.shape;
  return {
    wrapped: isArrayShape ? { [spec.field]: [input] } : { [spec.field]: input },
    hint: `Wrapped your bare string as ${isArrayShape ? `\`{${spec.field}: ["..."]}\`` : `\`{${spec.field}: "..."}\``} for tool "${toolName}". Call this tool with an object, not a bare string, next time.`,
    ruleName: "wrapRootStringAsObject",
  };
}
__name(wrapRootStringAsObject, "wrapRootStringAsObject");
var gv /* REPAIR_RULES */ = [
  ["renameAliasedField", dv],
  ["dropNullOrUndefinedField", lv],
  ["dropEmptyObjectPlaceholder", av],
  ["parseJsonStringifiedArray", cv],
  ["wrapBareStringAsArray", mv],
];
function repairToolInput(input, validationError, toolName) {
  const rootWrap = wrapRootStringAsObject({
    input: input,
    validationError: validationError,
    toolName: toolName,
  });
  if (void 0 !== rootWrap)
    return { input: rootWrap.wrapped, rulesFired: [rootWrap.ruleName], hints: [rootWrap.hint] };
  if (null === input) return { input: input, rulesFired: [], hints: [] };
  if ("object" != typeof input) return { input: input, rulesFired: [], hints: [] };
  const cloned = deepCloneToolInput(input),
    rulesFired = [],
    hints = [];
  for (const issue of validationError.issues) {
    const repairResult = applyRepairsToIssue(cloned, issue, toolName);
    null !== repairResult &&
      (rulesFired.includes(repairResult.ruleName) || rulesFired.push(repairResult.ruleName), hints.push(repairResult.hint));
  }
  return 0 === rulesFired.length
    ? { input: input, rulesFired: [], hints: [] }
    : { input: cloned, rulesFired: rulesFired, hints: hints };
}
function applyRepairsToIssue(input, issue, toolName) {
  const path = issue.path;
  if (0 === path.length) return null;
  const parent = walkToParentContainer(input, path);
  if (void 0 === parent) return null;
  const key = path[path.length - 1];
  if (void 0 === key) return null;
  const value = parent[key];
  for (const [ruleName, ruleFn] of gv) {
    const result = ruleFn({ toolName: toolName, parent: parent, key: key, value: value, issue: issue });
    if (!1 !== result) return { ruleName: ruleName, hint: result.hint };
  }
  return null;
}
function walkToParentContainer(root, path) {
  const container = path.slice(0, -1).reduce((current, segment) => {
    if (null !== current && "object" == typeof current) return current[segment];
  }, root);
  if (null !== container && "object" == typeof container) return container;
}
function parseRepairedToolInput(opts) {
  const firstParse = opts.schema.safeParse(opts.input);
  if (firstParse.success) return { ok: !0, data: firstParse.data };
  const repairResult = repairToolInput(opts.input, firstParse.error, opts.toolName);
  if (0 === repairResult.rulesFired.length)
    return (
      recordRepairOutcome({
        toolName: opts.toolName,
        outcome: "unrepairable",
        validationError: firstParse.error,
        input: opts.input,
        modelId: opts.modelId,
        rulesFired: repairResult.rulesFired,
        hintCount: repairResult.hints.length,
      }),
      logRepairDiagnostic({
        toolName: opts.toolName,
        outcome: "unrepairable",
        rawInput: opts.input,
        repairedInput: null,
        rulesFired: repairResult.rulesFired,
        hints: repairResult.hints,
        validationError: firstParse.error,
      }),
      { ok: !1, message: formatZodErrorForModel(opts.toolName, firstParse.error) }
    );
  const secondParse = opts.schema.safeParse(repairResult.input);
  return secondParse.success
    ? (recordRepairOutcome({
        toolName: opts.toolName,
        outcome: "recovered",
        validationError: firstParse.error,
        input: opts.input,
        modelId: opts.modelId,
        rulesFired: repairResult.rulesFired,
        hintCount: repairResult.hints.length,
      }),
      logRepairDiagnostic({
        toolName: opts.toolName,
        outcome: "recovered",
        rawInput: opts.input,
        repairedInput: repairResult.input,
        rulesFired: repairResult.rulesFired,
        hints: repairResult.hints,
        validationError: firstParse.error,
      }),
      {
        ok: !0,
        data: secondParse.data,
        ...(repairResult.hints.length > 0 ? { repairNotes: repairResult.hints } : {}),
      })
    : (recordRepairOutcome({
        toolName: opts.toolName,
        outcome: "unrepairable",
        validationError: secondParse.error,
        input: opts.input,
        modelId: opts.modelId,
        rulesFired: repairResult.rulesFired,
        hintCount: repairResult.hints.length,
      }),
      logRepairDiagnostic({
        toolName: opts.toolName,
        outcome: "unrepairable",
        rawInput: opts.input,
        repairedInput: repairResult.input,
        rulesFired: repairResult.rulesFired,
        hints: repairResult.hints,
        validationError: secondParse.error,
      }),
      { ok: !1, message: formatZodErrorForModel(opts.toolName, secondParse.error) });
}
(__name(repairToolInput, "repairToolInput"),
  __name(applyRepairsToIssue, "applyRepairsToIssue"),
  __name(walkToParentContainer, "walkToParentContainer"),
  __name(parseRepairedToolInput, "parseRepairedToolInput"),
  Ot());
var hv /* MARKDOWN_LINK_REGEX */ = /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g,
  fv /* PROTOCOL_PREFIX_REGEX */ = /^https?:\/\//;
function unwrapMarkdownAutoLinks(str) {
  return str.replace(hv, (match, linkText, url) => (url.replace(fv, "") !== linkText ? match : linkText));
}
function pathString() {
  return f.preprocess(
    (value) => ("string" != typeof value ? value : unwrapMarkdownAutoLinks(value)),
    f.string(),
  );
}
function withRepairNotes({ notes, toolOutput }) {
  return void 0 === notes || 0 === notes.length
    ? toolOutput
    : [...notes.map((note) => `<repair_note>${note}</repair_note>`), toolOutput].join("\n");
}

// NEW in v0.33.0 — Round-trip: parse repair notes back out of tool output
var Tv /* REPAIR_NOTE_REGEX */ = /^<repair_note>([\s\S]*?)<\/repair_note>$/;
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
