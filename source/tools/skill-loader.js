function getGlobalSkillsDir() {
  return t.join(S.homedir(), ".commandcode", "skills");
}
function getGlobalAgentsCompatSkillsDir() {
  return t.join(S.homedir(), ".agents", "skills");
}
function getBundledSkillsDir() {
  if (bS) return bS.value;
  const e = resolveBundledSkillsDir();
  return ((bS = { value: e }), e);
}
function resolveBundledSkillsDir() {
  let e;
  try {
    e = t.dirname(d(import.meta.url));
  } catch {
    return;
  }
  for (let n = 0; n < SS; n++) {
    if (D(t.join(e, "package.json"))) return t.join(e, "skills");
    const n = t.dirname(e);
    if (n === e) break;
    e = n;
  }
}
function isBundledSkillPath(e) {
  const { filePath: n, bundledDir: r } = e;
  if (!r) return !1;
  const o = t.relative(t.resolve(r), t.resolve(n));
  return "" === o || (!o.startsWith("..") && !t.isAbsolute(o));
}
function findGitRoot() {
  return walkUpToFindDir({ dirName: ".git" });
}
function walkUpToFindDir(e) {
  const { dirName: n } = e,
    r = S.homedir();
  let o = process.cwd();
  for (let e = 0; e < SS && o !== r; e++) {
    if (D(t.join(o, n))) return o;
    const e = t.dirname(o);
    if (e === o) break;
    o = e;
  }
}
function getProjectSkillsDir(e) {
  const n = e?.gitRoot ?? findGitRoot();
  if (n) return t.join(n, ".commandcode", "skills");
  const r = walkUpToFindDir({ dirName: ".commandcode" });
  return r
    ? t.join(r, ".commandcode", "skills")
    : t.join(process.cwd(), ".commandcode", "skills");
}
function getProjectAgentsCompatSkillsDir(e) {
  const n = e?.gitRoot ?? findGitRoot();
  if (n) return t.join(n, ".agents", "skills");
  const r = walkUpToFindDir({ dirName: ".agents" });
  return r
    ? t.join(r, ".agents", "skills")
    : t.join(process.cwd(), ".agents", "skills");
}
function isSkillManifestFile(e) {
  const t = e.toLowerCase();
  return ES.some((e) => e.toLowerCase() === t);
}
async function resolveSkillFilePath(e) {
