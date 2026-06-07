var CONTROL_CHAR_MAP = { "\n": "\\n", "\r": "\\r", "\t": "\\t" },
  TRUNCATION_SUFFIXES = ['"}', '"}}', "}", '": ""}'];
function isPlainObject(value) {
  return "object" == typeof value && null !== value;
}
function escapeControlCharsInJsonStrings(jsonStr) {
  const result = [];
  let inString = !1,
    pos = 0;
  for (; pos < jsonStr.length; ) {
    const char = jsonStr[pos];
    if (!inString) {
      ('"' === char && (inString = !0), result.push(char), pos++);
      continue;
    }
    if ("\\" === char) {
      (result.push(char, jsonStr[pos + 1] ?? ""), (pos += 2));
      continue;
    }
    if ('"' === char) {
      ((inString = !1), result.push(char), pos++);
      continue;
    }
    const charCode = char.charCodeAt(0);
    charCode >= 32
      ? (result.push(char), pos++)
      : (result.push(CONTROL_CHAR_MAP[char] ?? `\\u${charCode.toString(16).padStart(4, "0")}`), pos++);
  }
  return result.join("");
}
function repairTruncatedJson(jsonStr) {
  if (!jsonStr.startsWith("{")) return null;
  for (const suffix of TRUNCATION_SUFFIXES)
    try {
      const parsed = JSON.parse(jsonStr + suffix);
      if (isPlainObject(parsed)) return parsed;
    } catch {}
  return null;
}
function tryParseDirectly(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    if (isPlainObject(parsed)) return parsed;
    if ("string" == typeof parsed) return parseToolArgs(parsed);
  } catch {}
  return null;
}
function tryParseAfterEscaping(jsonStr) {
  try {
    const parsed = JSON.parse(escapeControlCharsInJsonStrings(jsonStr));
    if (isPlainObject(parsed)) return parsed;
  } catch {}
  return null;
}
function parseToolArgs(rawArgs) {
  return (
    tryParseDirectly(rawArgs) ??
    tryParseAfterEscaping(rawArgs) ??
    repairTruncatedJson(rawArgs) ??
    repairTruncatedJson(escapeControlCharsInJsonStrings(rawArgs))
  );
}
function normalizeToolInput(input) {
  return "string" != typeof input ? input : (parseToolArgs(input) ?? input);
}
(__name(isPlainObject, "isPlainObject"),
  __name(escapeControlCharsInJsonStrings, "escapeControlCharsInJsonStrings"),
  __name(repairTruncatedJson, "repairTruncatedJson"),
  __name(tryParseDirectly, "tryParseDirectly"),
  __name(tryParseAfterEscaping, "tryParseAfterEscaping"),
  __name(parseToolArgs, "parseToolArgs"),
  __name(normalizeToolInput, "normalizeToolInput"));
