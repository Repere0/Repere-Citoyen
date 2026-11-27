import test from "node:test";
import assert from "node:assert/strict";
import { resumeAffichable, mentionResume } from "../packages/core/src/index.js";

const bon = { valide: true, resume: "Le texte crée une aide.", source: { producteur: "Assemblée nationale", url: "https://www.assemblee-nationale.fr/x", releve_le: "2026-11-12" } };
test("résumé — affiché seulement validé, avec source https et date", () => {
  assert.equal(resumeAffichable(bon).texte, "Le texte crée une aide.");
  assert.equal(resumeAffichable({ ...bon, valide: false }), null, "brouillon : jamais affiché");
  assert.equal(resumeAffichable({ ...bon, valide: "true" }), null, "seul le booléen vrai valide");
  assert.equal(resumeAffichable({ ...bon, resume: "  " }), null);
  assert.equal(resumeAffichable({ ...bon, source: { ...bon.source, url: "http://x" } }), null, "source non https");
  assert.equal(resumeAffichable({ ...bon, source: { ...bon.source, releve_le: "" } }), null, "sans date de relevé");
  assert.equal(resumeAffichable(null), null);
});
test("résumé — la mention d'assistance IA est écrite en toutes lettres", () => {
  assert.equal(mentionResume("Assemblée nationale"), "Résumé généré avec l'aide de l'IA à partir des données officielles de l'Assemblée nationale.");
  assert.match(mentionResume("Sénat"), /avec l'aide de l'IA/);
});

/* 27/11/2026 (chantier Calendrier) : une séance porte un ou plusieurs dossiers ; elle affiche l'explication du
   PREMIER dossier qui en a une validée, dans l'ordre de l'ordre du jour. Aucune : rien (le bouton n'apparaît pas). */
test("resumeDesDossiers : le premier dossier qui a une explication validée, sinon rien", async () => {
  const { resumeDesDossiers } = await import("../packages/core/src/index.js");
  const ok = { valide: true, resume: "Texte relu.", source: { url: "https://www.assemblee-nationale.fr/x", releve_le: "2026-11-20" } };
  const index = { resumes: { DLR5L17N1: { ...ok, valide: false }, DLR5L17N2: ok, DLR5L17N3: { ...ok, resume: "Autre." } } };
  assert.equal(resumeDesDossiers(index, ["DLR5L17N1", "DLR5L17N2", "DLR5L17N3"]), ok, "le brouillon est sauté, le premier validé gagne");
  assert.equal(resumeDesDossiers(index, ["DLR5L17N9"]), null);
  assert.equal(resumeDesDossiers(index, []), null);
  assert.equal(resumeDesDossiers(null, ["DLR5L17N2"]), null);
  assert.equal(resumeDesDossiers(index, undefined), null);
});
