var Ek = { "\n": "\\n", "\r": "\\r", "\t": "\\t" },
  vk = ['"}', '"}}', "}", '": ""}'];
function isPlainObject(e) {
  return "object" == typeof e && null !== e;
}
function escapeControlCharsInJsonStrings(e) {
  const t = [];
  let n = !1,
    r = 0;
  for (; r < e.length; ) {
    const o = e[r];
    if (!n) {
      ('"' === o && (n = !0), t.push(o), r++);
      continue;
    }
    if ("\\" === o) {
      (t.push(o, e[r + 1] ?? ""), (r += 2));
      continue;
    }
    if ('"' === o) {
      ((n = !1), t.push(o), r++);
      continue;
    }
    const s = o.charCodeAt(0);
    s >= 32
      ? (t.push(o), r++)
      : (t.push(Ek[o] ?? `\\u${s.toString(16).padStart(4, "0")}`), r++);
  }
  return t.join("");
}
function repairTruncatedJson(e) {
  if (!e.startsWith("{")) return null;
  for (const t of vk)
    try {
      const n = JSON.parse(e + t);
      if (isPlainObject(n)) return n;
    } catch {}
  return null;
}
function tryParseDirectly(e) {
  try {
    const t = JSON.parse(e);
    if (isPlainObject(t)) return t;
    if ("string" == typeof t) return parseToolArgs(t);
  } catch {}
  return null;
}
function tryParseAfterEscaping(e) {
  try {
    const t = JSON.parse(escapeControlCharsInJsonStrings(e));
    if (isPlainObject(t)) return t;
  } catch {}
  return null;
}
function parseToolArgs(e) {
  return (
    tryParseDirectly(e) ??
    tryParseAfterEscaping(e) ??
    repairTruncatedJson(e) ??
    repairTruncatedJson(escapeControlCharsInJsonStrings(e))
  );
}
function normalizeToolInput(e) {
  return "string" != typeof e ? e : (parseToolArgs(e) ?? e);
}
(__name(isPlainObject, "isPlainObject"),
  __name(escapeControlCharsInJsonStrings, "escapeControlCharsInJsonStrings"),
  __name(repairTruncatedJson, "repairTruncatedJson"),
  __name(tryParseDirectly, "tryParseDirectly"),
  __name(tryParseAfterEscaping, "tryParseAfterEscaping"),
  __name(parseToolArgs, "parseToolArgs"),
  __name(normalizeToolInput, "normalizeToolInput"),
