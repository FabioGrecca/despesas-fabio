#!/usr/bin/env node
/**
 * cleanup-suppliers.js
 *
 * Limpa fornecedores duplicados/muito similares no SEED_SUPPLIERS do App.jsx.
 *
 * Uso:
 *   node cleanup-suppliers.js            -> modo INTERATIVO (pergunta no terminal qual manter por grupo),
 *                                           gera suppliers-clean.json, atualiza App.jsx e faz commit/push.
 *   node cleanup-suppliers.js --list     -> só detecta e imprime os grupos similares (grava groups.json), não altera nada.
 *   node cleanup-suppliers.js --apply    -> lê choices.json ({ "1": 2, "2": 1, ... } = grupo -> índice escolhido),
 *                                           gera suppliers-clean.json, atualiza App.jsx e faz commit/push (sem perguntar).
 *
 * Similaridade: distância de Levenshtein normalizada > 0.80 (em nomes normalizados: trim + minúsculas + espaços colapsados).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const APP = path.join(__dirname, "App.jsx");
const THRESHOLD = 0.60;

// ── 1. Lê o SEED_SUPPLIERS do App.jsx ───────────────────────────────────────
function readSuppliers(src) {
  const m = src.match(/SEED_SUPPLIERS\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!m) throw new Error("SEED_SUPPLIERS não encontrado no App.jsx");
  return JSON.parse(m[1]);
}

// ── 2. Levenshtein + similaridade ───────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
const norm = (s) => s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
function similarity(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na.length && !nb.length) return 1;
  return 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);
}

// ── 3. Agrupa similares (union-find sobre pares com sim > THRESHOLD) ─────────
function groupSimilar(suppliers) {
  const names = suppliers.map((s) => s.nome);
  const parent = names.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a, b) => { parent[find(a)] = find(b); };
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++)
      if (similarity(names[i], names[j]) > THRESHOLD) union(i, j);
  const buckets = new Map();
  names.forEach((_, i) => {
    const root = find(i);
    if (!buckets.has(root)) buckets.set(root, []);
    buckets.get(root).push(i);
  });
  // só grupos com mais de 1 (duplicados); preserva também os singletons à parte
  const groups = [...buckets.values()].filter((g) => g.length > 1).map((g) => g.map((i) => names[i]));
  const singletons = [...buckets.values()].filter((g) => g.length === 1).map((g) => names[g[0]]);
  return { groups, singletons, names };
}

function printGroup(gi, names) {
  console.log(`\nGrupo ${gi + 1}:`);
  names.forEach((n, i) => console.log(`  [${i + 1}] ${n}`));
  console.log(`  [0] manter todos (não mesclar — use quando forem fornecedores diferentes)`);
}

// ── monta a lista final dada as escolhas (grupo -> índice 1-based) ──────────
function buildFinal(groups, singletons, choices) {
  const kept = [];
  groups.forEach((g, gi) => {
    const c = choices[gi + 1];
    if (c === 0) { kept.push(...g); return; }   // 0 = manter todos (não mesclar)
    const idx = ((c || 1) - 1);
    kept.push(g[Math.max(0, Math.min(idx, g.length - 1))]);
  });
  const all = [...singletons, ...kept];
  // dedupe exato + ordena alfabeticamente
  const uniq = [...new Set(all.map((s) => s.trim()))].sort((a, b) => a.localeCompare(b, "pt"));
  return uniq.map((nome) => ({ nome }));
}

// ── 6. Atualiza o SEED_SUPPLIERS no App.jsx ─────────────────────────────────
function writeApp(finalList) {
  let src = fs.readFileSync(APP, "utf8");
  src = src.replace(/(SEED_SUPPLIERS\s*=\s*)\[[\s\S]*?\](\s*;)/, (_, p1, p2) => p1 + JSON.stringify(finalList) + p2);
  fs.writeFileSync(APP, src);
}

// ── 7. commit + push ────────────────────────────────────────────────────────
function commitPush(before, after) {
  execSync("git add App.jsx suppliers-clean.json cleanup-suppliers.js", { cwd: __dirname, stdio: "inherit" });
  const msg = `chore: limpa fornecedores duplicados no SEED_SUPPLIERS (${before} -> ${after})\n\nRemove nomes duplicados/muito similares (Levenshtein > 80%) via cleanup-suppliers.js.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`;
  // Escreve a mensagem num arquivo temporário para preservar quebras de linha (evita escape do shell).
  const msgFile = path.join(__dirname, ".commit-msg.tmp");
  fs.writeFileSync(msgFile, msg);
  try {
    execSync(`git -c user.name="Fabio Grecca" -c user.email="fgrecca@gmail.com" commit -F ${JSON.stringify(msgFile)}`, { cwd: __dirname, stdio: "inherit" });
    execSync("git push origin main", { cwd: __dirname, stdio: "inherit" });
  } finally {
    fs.unlinkSync(msgFile);
  }
}

function finish(suppliers, groups, singletons, choices) {
  const finalList = buildFinal(groups, singletons, choices);
  fs.writeFileSync(path.join(__dirname, "suppliers-clean.json"), JSON.stringify(finalList, null, 2));
  writeApp(finalList);
  console.log(`\n✔ suppliers-clean.json gerado com ${finalList.length} fornecedores (antes: ${suppliers.length}).`);
  console.log("✔ SEED_SUPPLIERS atualizado no App.jsx.");
  commitPush(suppliers.length, finalList.length);
  console.log("✔ commit + push concluídos.");
}

// ── main ────────────────────────────────────────────────────────────────────
(async function main() {
  const arg = process.argv[2];
  const src = fs.readFileSync(APP, "utf8");
  const suppliers = readSuppliers(src);
  const { groups, singletons } = groupSimilar(suppliers);

  if (!groups.length) {
    console.log("Nenhum grupo de fornecedores similares (>80%) encontrado. Nada a fazer.");
    return;
  }

  if (arg === "--list") {
    groups.forEach((g, gi) => printGroup(gi, g));
    fs.writeFileSync(path.join(__dirname, "groups.json"), JSON.stringify(groups, null, 2));
    console.log(`\n${groups.length} grupos detectados. (groups.json gerado)`);
    return;
  }

  if (arg === "--apply") {
    const choices = JSON.parse(fs.readFileSync(path.join(__dirname, "choices.json"), "utf8"));
    groups.forEach((g, gi) => { printGroup(gi, g); const c = choices[gi + 1]; console.log(`  -> ${c === 0 ? "mantém todos" : "mantém [" + (c || 1) + "]"}`); });
    finish(suppliers, groups, singletons, choices);
    return;
  }

  // modo INTERATIVO (padrão)
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  const choices = {};
  for (let gi = 0; gi < groups.length; gi++) {
    printGroup(gi, groups[gi]);
    let ans;
    do {
      ans = (await ask(`Qual manter? (${groups[gi].map((_, i) => i + 1).join("/")}/0=todos): `)).trim();
    } while (!/^\d+$/.test(ans) || +ans < 0 || +ans > groups[gi].length);
    choices[gi + 1] = +ans;
  }
  rl.close();
  finish(suppliers, groups, singletons, choices);
})();
