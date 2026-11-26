// Générateur de brouillons de résumés par IA (26/11/2026) : aucun réseau dans le banc, un faux Mistral injecté.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CONSIGNE, appelerMistral, genererLot, messages, modeleSimule } from "../scripts/generer_resumes.mjs";

const TEXTE = `Projet de loi de finances pour 2027. L'article 3 crée une aide de 1 500 euros pour les communes de moins de 3 500 habitants.
Le Gouvernement remet un rapport au Parlement avant le 1er octobre 2027.`;
const URL = "https://www.assemblee-nationale.fr/dyn/17/dossiers/DLR5L17N51670";
const prep = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "gen-"));
  const t = path.join(d, "officiel.txt"); fs.writeFileSync(t, TEXTE);
  return { d, lots: [{ dossier: "DLR5L17N51670", texte: t, url: URL }] };
};
const fauxMistral = contenu => async (url, init) => {
  fauxMistral.dernier = { url, init };
  return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: contenu } }], usage: { total_tokens: 321 } }) };
};

test("la consigne du porteur est envoyée mot pour mot, avec le texte officiel délimité", () => {
  assert.match(CONSIGNE, /Explique ce texte à un jeune de 15 ans, en 3 phrases maximum, sans aucun jugement de valeur, en te basant UNIQUEMENT sur les faits présents dans ce texte\./);
  const m = messages(TEXTE);
  assert.equal(m[0].role, "system"); assert.ok(m[1].content.includes(TEXTE.trim()));
});

test("sans clé : erreur claire, aucun appel", async () => {
  await assert.rejects(appelerMistral(TEXTE, { cle: "", fetchImpl: () => { throw new Error("appel interdit"); } }), /MISTRAL_API_KEY absente/);
});

test("une réponse fidèle devient un brouillon valide: false, jamais true", async () => {
  const { d, lots } = prep();
  const bon = "Le texte crée une aide de 1 500 euros pour les communes de moins de 3 500 habitants. Le Gouvernement remet un rapport au Parlement avant le 1er octobre 2027.";
  const c = await genererLot(lots, { cle: "essai", fetchImpl: fauxMistral(bon), jour: "2026-11-26", sortie: d });
  assert.equal(c[0].ok, true, JSON.stringify(c[0].erreurs));
  assert.equal(c[0].jetons.total_tokens, 321, "les jetons renvoyés par l'API sont comptés");
  const f = JSON.parse(fs.readFileSync(path.join(d, "DLR5L17N51670.json"), "utf8"));
  assert.equal(f.valide, false, "le script ne valide jamais");
  assert.equal(f.methode.voie, "ia:mistral-small-latest", "le brouillon dit qu'il vient d'une IA, et laquelle");
  assert.equal(JSON.parse(fauxMistral.dernier.init.body).temperature, 0);
  assert.equal(fauxMistral.dernier.init.headers.Authorization, "Bearer essai");
});

test("une réponse qui invente un nombre ou juge est refusée et rien n'est écrit", async () => {
  const { d, lots } = prep();
  for (const faux of ["Le texte crée une aide de 2 500 euros pour les communes.", "C'est une mesure importante pour les communes de moins de 3 500 habitants."]) {
    const c = await genererLot(lots, { cle: "essai", fetchImpl: fauxMistral(faux), jour: "2026-11-26", sortie: d });
    assert.equal(c[0].ok, false, faux);
  }
  assert.equal(fs.existsSync(path.join(d, "DLR5L17N51670.json")), false);
  const e = await genererLot(lots, { essai: true, cle: "essai", fetchImpl: fauxMistral("Le texte crée une aide de 2 500 euros pour les communes."), jour: "2026-11-26", sortie: d });
  assert.equal(e[0].ok, false, "en --essai aussi, un nombre inventé est signalé");
});

test("--essai contrôle sans écrire ; le modèle simulé passe la chaîne sans réseau", async () => {
  const { d, lots } = prep();
  const c = await genererLot(lots, { mock: true, essai: true, jour: "2026-11-26", sortie: d });
  assert.equal(c[0].ok, true, JSON.stringify(c[0].erreurs));
  assert.equal(fs.existsSync(path.join(d, "DLR5L17N51670.json")), false, "--essai n'écrit rien");
  assert.ok(TEXTE.replace(/\s+/g, " ").startsWith(modeleSimule(TEXTE).texte.slice(0, 30)));
});
