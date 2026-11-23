/* L'ADRESSE PUBLIQUE, À UN SEUL ENDROIT (23/11/2026, préparation du nom de domaine).
 *
 * Le jour où le domaine change, on ne doit toucher qu'une clé : app.json, expo.extra.adressePublique. Cette garde
 * refuse qu'une adresse publique de Repère (domaine retenu, *.pages.dev, *.netlify.app, *.vercel.app) soit écrite en
 * dur ailleurs dans src/, hors des exceptions ci-dessous, chacune justifiée. */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP = new URL("..", import.meta.url).pathname;
const app = JSON.parse(readFileSync(join(APP, "app.json"), "utf8"));
const adresse = app.expo.extra && app.expo.extra.adressePublique;
const hote = adresse ? new URL(adresse).host : "";

/* Fichier -> pourquoi il a le droit d'écrire une adresse. */
const PERMIS = {
  "src/lib/adresse-publique.ts": "valeur de secours si app.json n'est pas lu (doit rester égale à app.json)",
  "src/lib/donnees.ts": "le téléphone lit ses données sur Netlify (la version web lit /data sur son propre hôte)",
  "src/app/confidentialite.tsx": "la politique de confidentialité nomme le serveur qui reçoit les demandes",
};

function fichiers(d) {
  return readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? fichiers(p) : /\.(tsx?|jsx?)$/.test(n) ? [p] : []; });
}

test("app.json donne une adresse publique en https", () => {
  assert.match(adresse || "", /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/?$/);
});

test("aucune adresse publique de Repère n'est écrite en dur hors des exceptions", () => {
  const motif = new RegExp(`${hote.replace(/\./g, "\\.")}|[a-z0-9-]+\\.pages\\.dev|repereapp\\.netlify\\.app|[a-z0-9-]+\\.vercel\\.app`);
  const fautifs = fichiers(join(APP, "src")).map(p => relative(APP, p).split("\\").join("/"))
    .filter(r => !(r in PERMIS) && motif.test(readFileSync(join(APP, r), "utf8")));
  assert.deepEqual(fautifs, []);
});

test("la valeur de secours est la même que app.json", () => {
  const s = readFileSync(join(APP, "src/lib/adresse-publique.ts"), "utf8");
  assert.ok(s.includes(`"${adresse.replace(/\/$/, "")}"`), "adresse-publique.ts : la valeur de secours a divergé d'app.json");
});

test("la garde voit une adresse en dur", () => {
  const motif = new RegExp(`${hote.replace(/\./g, "\\.")}|[a-z0-9-]+\\.pages\\.dev`);
  assert.ok(motif.test(`const x = "https://${hote}/argent";`));
  assert.ok(motif.test(`const y = "https://repere.pages.dev/";`));
});
