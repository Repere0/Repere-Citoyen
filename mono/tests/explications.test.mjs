/* EXPLICATIONS « EN CLAIR » AU-DELÀ DES LOIS (27/11/2026) : budgets et votes, sources, consignes, contrôles, pannes.
   Aucun réseau : un faux Mistral injecté. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CONSIGNES, codeDeSortie, genererLot } from "../scripts/generer_resumes.mjs";
import { controlerResume, publier } from "../scripts/resumes-clairs.mjs";
import { preparerExplications, sourceBudget, sourceVote } from "../scripts/sources-explications.mjs";

const AGREGATS = [["Recettes totales"], ["Dépenses totales"], ["Encours de dette"], ["Dépenses d'investissement"], ["Frais de personnel"], ["Impôts et taxes"]];
const SRC = { producteur: "Observatoire des finances et de la gestion publique locales (OFGL)", url: "https://www.data.gouv.fr/datasets/comptes-des-communes-2018-2025/", maj: "2026-07-29" };
const COMPTES = { "2024": [43000, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "2025": [43919, 106788649, 2431, 109595615, 2495, 102604168, 2336, 34127568, 777, null, null, 49867899, 1135] };
const SCRUTIN = { n: "8421", d: "2026-07-20", t: "l'ensemble de la proposition de loi pour une montagne vivante.", sl: "l'Assemblée nationale a adopté", tv: "scrutin public solennel", dec: { pour: "376", contre: "92", abstentions: "4" }, nv: "472", dl: "Pour une montagne vivante" };
const faux = contenu => async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: contenu } }], usage: { total_tokens: 200 } }) });

test("source d'un budget : le dernier exercice, chaque montant tel que publié, l'absent dit absent", () => {
  const s = sourceBudget({ insee: "77288", nom: "Melun", comptes: COMPTES, agregats: AGREGATS, src: SRC });
  assert.equal(s.cle, "budget:77288"); assert.equal(s.date, "2026-07-29"); assert.equal(s.url, SRC.url);
  assert.match(s.texte, /pour l'année 2025/);
  assert.match(s.texte, /Dépenses totales : 109 595 615 euros, soit 2 495 euros par habitant\./);
  assert.match(s.texte, /Frais de personnel : non publié pour cette année\./, "un agrégat absent n'est jamais un zéro (invariant 5)");
  assert.equal(sourceBudget({ insee: "1", nom: "X", comptes: {}, agregats: AGREGATS, src: SRC }), null);
});

test("source d'un vote : objet, date en toutes lettres, résultat et nombres de la fiche", () => {
  const v = sourceVote(SCRUTIN);
  assert.equal(v.cle, "scrutin:8421");
  assert.match(v.texte, /le 20 juillet 2026, scrutin public solennel\./);
  assert.match(v.texte, /Pour : 376\. Contre : 92\. Abstentions : 4\./);
});

test("les contrôles d'un chiffre : « une dette élevée » refusée pour un budget, permise dans une loi qui la cite", () => {
  const src = sourceBudget({ insee: "77288", nom: "Melun", comptes: COMPTES, agregats: AGREGATS, src: SRC }).texte;
  assert.ok(controlerResume("En 2025, Melun a dépensé 2 495 euros par habitant et doit 102 604 168 euros.", src, { type: "budget" }).ok);
  assert.match(controlerResume("En 2025, Melun a une dette élevée de 102 604 168 euros.", src, { type: "budget" }).erreurs.join("|"), /mot de jugement : élevée/);
  assert.match(controlerResume("Le vote est largement adopté, par 376 voix.", sourceVote(SCRUTIN).texte, { type: "vote" }).erreurs.join("|"), /largement/);
  assert.match(controlerResume("En 2025, Melun a dépensé 3 000 euros par habitant.", src, { type: "budget" }).erreurs.join("|"), /nombre absent du texte officiel : 3000/, "aucun montant inventé");
});

test("chaque type a sa consigne, envoyée au modèle", async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "expl-"));
  const t = path.join(d, "b.txt"); fs.writeFileSync(t, sourceBudget({ insee: "77288", nom: "Melun", comptes: COMPTES, agregats: AGREGATS, src: SRC }).texte);
  let envoye = null;
  const fetchImpl = async (u, init) => { envoye = JSON.parse(init.body); return faux("En 2025, Melun a dépensé 2 495 euros par habitant.")(); };
  const c = await genererLot([{ type: "budget", cle: "budget:77288", texte: t, url: SRC.url, producteur: SRC.producteur }], { cle: "k", fetchImpl, jour: "2026-11-27", sortie: d });
  assert.equal(envoye.messages[0].content, CONSIGNES.budget);
  assert.ok(c[0].ok);
  const f = JSON.parse(fs.readFileSync(path.join(d, "budget-77288.json"), "utf8"));
  assert.equal(f.cle, "budget:77288"); assert.equal(f.type, "budget"); assert.equal(f.valide, false);
  assert.equal(f.source.producteur, SRC.producteur);
  /* Publié seulement une fois validé, sous sa clé, lisible par resumePour({ budget }) de l'application. */
  f.valide = true; f.valide_le = "2026-11-27"; fs.writeFileSync(path.join(d, "budget-77288.json"), JSON.stringify(f));
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "pub-"));
  publier(data, { dossier: d, jour: "2026-11-27" });
  assert.ok(JSON.parse(fs.readFileSync(path.join(data, "resumes-clairs.json"), "utf8")).resumes["budget:77288"]);
});

test("une panne de l'API (402 : paiement requis) arrête le lot sans autre appel, et le run est rouge", async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "panne-"));
  const t = path.join(d, "v.txt"); fs.writeFileSync(t, sourceVote(SCRUTIN).texte);
  let appels = 0;
  const fetchImpl = async () => { appels++; return { ok: false, status: 402, json: async () => ({}) }; };
  const lots = [1, 2, 3].map(() => ({ type: "vote", cle: "scrutin:8421", texte: t, url: "https://www.assemblee-nationale.fr/dyn/17/scrutins/8421" }));
  const c = await genererLot(lots, { cle: "k", fetchImpl, essai: true, jour: "2026-11-27" });
  assert.equal(appels, 1, "on ne repaie pas : arrêt au premier refus de l'API");
  assert.match(c[0].erreurs[0], /paiement requis par Mistral \(402\)/);
  assert.equal(codeDeSortie(c), 1);
  assert.equal(codeDeSortie([{ ok: false, erreurs: ["mot de jugement : x"] }]), 1, "aucun texte valable : rouge");
  assert.equal(codeDeSortie([{ ok: true }, { ok: false, erreurs: ["mot de jugement : x"] }]), 0, "un refus isolé par les contrôles : vert");
});

test("lot de la semaine : --depuis garde les données récentes, --deja saute ce qui est fait, l'IDF par défaut", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "donnees-"));
  fs.mkdirSync(path.join(data, "departments"));
  fs.writeFileSync(path.join(data, "index.json"), JSON.stringify({ sources: { comptes: SRC }, agregats: AGREGATS }));
  fs.writeFileSync(path.join(data, "scrutins.json"), JSON.stringify({ scrutins: [SCRUTIN, { ...SCRUTIN, n: "8500", d: "2026-11-25" }] }));
  fs.writeFileSync(path.join(data, "departments", "77.json"), JSON.stringify({ communes: { "77288": { nom: "Melun", comptes: COMPTES }, "77001": { nom: "Achères", comptes: COMPTES } } }));
  fs.writeFileSync(path.join(data, "departments", "01.json"), JSON.stringify({ communes: { "01001": { nom: "Hors IDF", comptes: COMPTES } } }));
  const deja = fs.mkdtempSync(path.join(os.tmpdir(), "deja-")); fs.writeFileSync(path.join(deja, "budget-77001.json"), "{}");
  const sortie = fs.mkdtempSync(path.join(os.tmpdir(), "sortie-"));
  const r = preparerExplications({ donnees: data, types: ["budget", "vote"], depuis: "2026-07-25", deja, sortie });
  assert.deepEqual(r.lots.map(l => l.cle).sort(), ["budget:77288", "scrutin:8500"]);
  assert.ok(r.ecartes.some(e => e.cle === "budget:77001" && /déjà/.test(e.raison)));
  assert.ok(r.ecartes.some(e => e.cle === "scrutin:8421" && /avant le/.test(e.raison)));
  assert.ok(!r.lots.some(l => l.cle === "budget:01001"), "hors Île-de-France : pas par défaut (bêta)");
  const r2 = preparerExplications({ donnees: data, types: ["budget"], depuis: "2026-08-01", sortie });
  assert.equal(r2.lots.length, 0, "un budget ne revient qu'à la mise à jour OFGL suivante");
});
