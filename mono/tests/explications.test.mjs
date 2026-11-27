/* EXPLICATIONS « EN CLAIR » DES VOTES (27/11/2026) : source, consigne, contrôles, pannes, lot de la semaine.
   Pas de budget par IA (décision du porteur, 27/11/2026). Aucun réseau : un faux Mistral injecté. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CONSIGNES, codeDeSortie, genererLot, messages } from "../scripts/generer_resumes.mjs";
import { controlerResume, publier } from "../scripts/resumes-clairs.mjs";
import { preparerExplications, sourceVote } from "../scripts/sources-explications.mjs";

const SCRUTIN = { n: "8421", d: "2026-07-20", t: "l'ensemble de la proposition de loi pour une montagne vivante.", sl: "l'Assemblée nationale a adopté", tv: "scrutin public solennel", dec: { pour: "376", contre: "92", abstentions: "4" }, nv: "472", dl: "Pour une montagne vivante" };
const URL = "https://www.assemblee-nationale.fr/dyn/17/scrutins/8421";
const faux = contenu => async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: contenu } }], usage: { total_tokens: 200 } }) });

test("source d'un vote : objet, date en toutes lettres, résultat et nombres de la fiche", () => {
  const v = sourceVote(SCRUTIN);
  assert.equal(v.cle, "scrutin:8421");
  assert.match(v.texte, /le 20 juillet 2026, scrutin public solennel\./);
  assert.match(v.texte, /Pour : 376\. Contre : 92\. Abstentions : 4\./);
  assert.equal(sourceVote({ n: "x" }), null);
});

test("pas de budget par IA : type refusé à la génération comme à la clé", () => {
  assert.equal(CONSIGNES.budget, undefined);
  assert.throws(() => messages("x", "budget"), /pas de budget/);
});

test("les contrôles d'un vote : « largement », « serré » refusés ; aucun nombre inventé", () => {
  const src = sourceVote(SCRUTIN).texte;
  assert.ok(controlerResume("Les députés ont voté sur la loi pour une montagne vivante : 376 pour, 92 contre et 4 abstentions.", src, { type: "vote" }).ok);
  assert.match(controlerResume("Le texte est largement adopté, par 376 voix.", src, { type: "vote" }).erreurs.join("|"), /largement/);
  assert.match(controlerResume("Un vote serré : 376 voix pour la loi.", src, { type: "vote" }).erreurs.join("|"), /serré/);
  assert.match(controlerResume("La loi a été adoptée par 380 voix pour un total de 472.", src, { type: "vote" }).erreurs.join("|"), /nombre absent du texte officiel : 380/);
});

test("la consigne du vote est envoyée ; le brouillon porte sa clé et attend la validation", async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "expl-"));
  const t = path.join(d, "v.txt"); fs.writeFileSync(t, sourceVote(SCRUTIN).texte);
  let envoye = null;
  const fetchImpl = async (u, init) => { envoye = JSON.parse(init.body); return faux("Les députés ont voté sur la loi pour une montagne vivante : 376 pour, 92 contre et 4 abstentions.")(); };
  const c = await genererLot([{ type: "vote", cle: "scrutin:8421", texte: t, url: URL, producteur: "Assemblée nationale", scrutins: ["8421"] }], { cle: "k", fetchImpl, jour: "2026-11-27", sortie: d });
  assert.equal(envoye.messages[0].content, CONSIGNES.vote);
  assert.ok(c[0].ok, c[0].erreurs.join("|"));
  const f = JSON.parse(fs.readFileSync(path.join(d, "scrutin-8421.json"), "utf8"));
  assert.equal(f.cle, "scrutin:8421"); assert.equal(f.type, "vote"); assert.equal(f.valide, false);
  f.valide = true; f.valide_le = "2026-11-27"; fs.writeFileSync(path.join(d, "scrutin-8421.json"), JSON.stringify(f));
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "pub-"));
  publier(data, { dossier: d, jour: "2026-11-27" });
  assert.ok(JSON.parse(fs.readFileSync(path.join(data, "resumes-clairs.json"), "utf8")).resumes["scrutin:8421"]);
});

test("une panne de l'API (402 : paiement requis) arrête le lot sans autre appel, et le run est rouge", async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "panne-"));
  const t = path.join(d, "v.txt"); fs.writeFileSync(t, sourceVote(SCRUTIN).texte);
  let appels = 0;
  const fetchImpl = async () => { appels++; return { ok: false, status: 402, json: async () => ({}) }; };
  const lots = [1, 2, 3].map(() => ({ type: "vote", cle: "scrutin:8421", texte: t, url: URL }));
  const c = await genererLot(lots, { cle: "k", fetchImpl, essai: true, jour: "2026-11-27" });
  assert.equal(appels, 1, "on ne repaie pas : arrêt au premier refus de l'API");
  assert.match(c[0].erreurs[0], /paiement requis par Mistral \(402\)/);
  assert.equal(codeDeSortie(c), 1);
  assert.equal(codeDeSortie([{ ok: false, erreurs: ["mot de jugement : x"] }]), 1, "aucun texte valable : rouge");
  assert.equal(codeDeSortie([{ ok: true }, { ok: false, erreurs: ["mot de jugement : x"] }]), 0, "un refus isolé par les contrôles : vert");
});

test("lot de la semaine : --depuis garde les votes récents, --deja saute ce qui est fait", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "donnees-"));
  fs.writeFileSync(path.join(data, "scrutins.json"), JSON.stringify({ scrutins: [SCRUTIN, { ...SCRUTIN, n: "8500", d: "2026-11-25" }, { ...SCRUTIN, n: "8501", d: "2026-11-26" }] }));
  const deja = fs.mkdtempSync(path.join(os.tmpdir(), "deja-")); fs.writeFileSync(path.join(deja, "scrutin-8501.json"), "{}");
  const sortie = fs.mkdtempSync(path.join(os.tmpdir(), "sortie-"));
  const r = preparerExplications({ donnees: data, depuis: "2026-11-20", deja, sortie });
  assert.deepEqual(r.lots.map(l => l.cle), ["scrutin:8500"]);
  assert.ok(r.ecartes.some(e => e.cle === "scrutin:8501" && /déjà/.test(e.raison)));
  assert.ok(r.ecartes.some(e => e.cle === "scrutin:8421" && /avant le/.test(e.raison)));
});

test("carte « Expliquer simplement » : le modèle et la date de relecture publiés, les mentions écrites", async () => {
  const { nomDuModele, mentionGeneration, mentionRelecture, resumeAffichable } = await import("../packages/core/src/index.js");
  assert.equal(nomDuModele("ia:mistral-small-latest"), "Mistral");
  assert.equal(nomDuModele("session"), null, "un modèle inconnu n'a pas de nom inventé");
  assert.equal(mentionGeneration("Mistral", "Assemblée nationale"), "Généré par IA (Mistral) à partir des données officielles de l'Assemblée nationale.");
  assert.equal(mentionRelecture("27 novembre 2026"), "Relu et validé par Repère le 27 novembre 2026.");
  const r = resumeAffichable({ valide: true, valide_le: "2026-11-27", modele: "ia:mistral-small-latest", resume: "Texte.", source: { producteur: "Assemblée nationale", url: "https://a.fr", releve_le: "2026-11-12" } });
  assert.equal(r.valideLe, "2026-11-27"); assert.equal(r.modele, "Mistral");
  /* Le fichier publié porte le modèle du brouillon (methode.voie). */
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "mod-"));
  const t = path.join(d, "v.txt"); fs.writeFileSync(t, sourceVote(SCRUTIN).texte);
  await genererLot([{ type: "vote", cle: "scrutin:8421", texte: t, url: URL }], { cle: "k", fetchImpl: faux("Les députés ont voté : 376 pour, 92 contre et 4 abstentions."), jour: "2026-11-27", sortie: d });
  const f = JSON.parse(fs.readFileSync(path.join(d, "scrutin-8421.json"), "utf8")); f.valide = true; f.valide_le = "2026-11-27";
  fs.writeFileSync(path.join(d, "scrutin-8421.json"), JSON.stringify(f));
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "pub-")); publier(data, { dossier: d, jour: "2026-11-27" });
  assert.equal(JSON.parse(fs.readFileSync(path.join(data, "resumes-clairs.json"), "utf8")).resumes["scrutin:8421"].modele, "ia:mistral-small-latest");
});
