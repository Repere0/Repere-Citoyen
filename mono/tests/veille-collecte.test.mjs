// Veille de la collecte (« Heartbeat », 27/11/2026) : voir une collecte qui NE DEMARRE PAS.
// Regle pure de outils/veille_collecte.mjs ; l'issue (gh) n'est pas jouee ici.
// Spec : claude/Repere_Spec_Plan_Heartbeat_Collecte_27_11_2026.md (projet), seuil 40 h valide par le porteur.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { diagnostic, corpsVeille, SEUIL_H, TITRE_VEILLE } from "../../outils/veille_collecte.mjs";

const MAINTENANT = new Date("2026-11-27T17:00:00Z");
const ilYa = h => new Date(MAINTENANT.getTime() - h * 36e5).toISOString();
const sain = { dernierSucces: ilYa(20), etatWorkflow: "active", construitLe: ilYa(20), maintenant: MAINTENANT };

test("le seuil validé par le porteur est de 40 heures", () => {
  assert.equal(SEUIL_H, 40);
});

test("une collecte réussie il y a 20 h, en ligne : aucune alerte", () => {
  const d = diagnostic(sain);
  assert.equal(d.alerte, false);
  assert.deepEqual(d.raisons, []);
});

test("39 h : pas d'alerte (le retard normal de GitHub va jusqu'à ~35 h) ; 41 h : alerte « silence »", () => {
  assert.equal(diagnostic({ ...sain, dernierSucces: ilYa(39), construitLe: ilYa(39) }).alerte, false);
  const d = diagnostic({ ...sain, dernierSucces: ilYa(41), construitLe: ilYa(41) });
  assert.equal(d.alerte, true);
  assert.deepEqual(d.raisons.map(r => r.code), ["silence"]);
  assert.match(d.raisons[0].phrase, /41 h/);
});

test("aucune collecte réussie trouvée : alerte « silence »", () => {
  const d = diagnostic({ ...sain, dernierSucces: null });
  assert.equal(d.alerte, true);
  assert.deepEqual(d.raisons.map(r => r.code), ["silence"]);
});

test("workflow désactivé (inactivité de 60 jours, ou à la main) : alerte immédiate, même si la dernière collecte est récente", () => {
  for (const etat of ["disabled_inactivity", "disabled_manually"]) {
    const d = diagnostic({ ...sain, etatWorkflow: etat });
    assert.equal(d.alerte, true, etat);
    assert.deepEqual(d.raisons.map(r => r.code), ["workflow"]);
    assert.match(d.raisons[0].phrase, new RegExp(etat));
  }
});

test("collecte réussie mais production vieille : alerte « hors ligne », distincte du silence", () => {
  const d = diagnostic({ ...sain, construitLe: ilYa(50) });
  assert.equal(d.alerte, true);
  assert.deepEqual(d.raisons.map(r => r.code), ["hors-ligne"]);
});

test("silence ET production vieille : une seule raison (le silence explique la production)", () => {
  const d = diagnostic({ ...sain, dernierSucces: ilYa(60), construitLe: ilYa(60) });
  assert.deepEqual(d.raisons.map(r => r.code), ["silence"]);
});

test("production injoignable : « impossible à vérifier », écrit, jamais une alerte à lui seul, jamais « à jour »", () => {
  const d = diagnostic({ ...sain, construitLe: null });
  assert.equal(d.alerte, false);
  assert.ok(d.constats.some(c => /impossible à vérifier/.test(c)));
  assert.ok(!d.constats.some(c => /à jour/.test(c)));
});

test("état du workflow illisible : écrit comme impossible à vérifier, sans alerte", () => {
  const d = diagnostic({ ...sain, etatWorkflow: null });
  assert.equal(d.alerte, false);
  assert.ok(d.constats.some(c => /impossible à vérifier/.test(c)));
});

test("le seuil se règle (preuve réelle à 1 h) ; un seuil illisible retombe sur 40 h", () => {
  assert.equal(diagnostic({ ...sain, seuilH: 1 }).alerte, true);
  assert.equal(diagnostic({ ...sain, seuilH: "abc" }).alerte, false);
  assert.equal(diagnostic({ ...sain, seuilH: 0 }).alerte, false);
});

test("le corps date à l'heure de Paris, en toutes lettres, sans apostrophe typographique", () => {
  const d = diagnostic({ ...sain, dernierSucces: "2026-11-26T15:49:00Z", construitLe: null });
  const t = corpsVeille(d, { urlRun: "https://exemple/run/1" });
  assert.match(t, /jeudi 26 novembre 2026 à 16 h 49/);   /* 15:49 UTC = 16:49 a Paris en hiver */
  assert.match(t, /https:\/\/exemple\/run\/1/);
  assert.ok(!t.includes("’"));
  assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(t), "pas de date de machine");
});

test("le titre est fixe : une seule issue, jamais de doublon d'un jour à l'autre", () => {
  assert.equal(typeof TITRE_VEILLE, "string");
  assert.ok(TITRE_VEILLE.startsWith("[ALERTE]"));
  assert.ok(!/\d/.test(TITRE_VEILLE), "aucun nombre qui changerait le titre");
});

test("le workflow de veille : deux crons distincts de la collecte, permissions minimales, seuil réglable", () => {
  const w = fs.readFileSync(new URL("../../.github/workflows/veille-collecte.yml", import.meta.url), "utf8");
  const c = fs.readFileSync(new URL("../../.github/workflows/collecte.yml", import.meta.url), "utf8");
  const crons = s => [...s.matchAll(/cron:\s*"([^"]+)"/g)].map(m => m[1]);
  const veille = crons(w);
  assert.equal(veille.length, 2);
  for (const x of veille) assert.ok(!crons(c).includes(x), `cron ${x} identique à la collecte`);
  for (const x of veille) assert.notEqual(x.split(" ")[0], "0", "minute ronde : runners saturés à :00");
  assert.match(w, /actions:\s*read/);
  assert.match(w, /issues:\s*write/);
  assert.doesNotMatch(w, /contents:\s*write/);
  assert.match(w, /seuil_heures/);
  assert.match(w, /node outils\/veille_collecte\.mjs/);
});
