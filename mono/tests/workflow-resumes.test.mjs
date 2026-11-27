/* LE LOT HEBDOMADAIRE DES RÉSUMÉS (27/11/2026) : ce que le workflow doit garantir, puisque personne ne le surveille
 * en direct. Lecture du fichier YAML par motifs (pas de dépendance) ; chaque règle est une garde nommée. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const W = readFileSync(new URL("../../.github/workflows/generer-resumes.yml", import.meta.url), "utf8");

test("le lot part seul chaque semaine, en mode brouillons, 10 textes au plus", () => {
  assert.match(W, /schedule:\s*\n\s*#[^\n]*\n\s*#[^\n]*\n\s*- cron: "23 4 \* \* 0"/, "un cron hebdomadaire (dimanche)");
  assert.match(W, /inputs\.mode \|\| 'brouillons'/, "sans menu (lot), le mode est brouillons");
  assert.match(W, /inputs\.limite \|\| 10/, "sans menu, 10 textes au plus (coût borné)");
});

test("à la main, l'essai reste le mode par défaut (rien n'est écrit)", () => {
  assert.match(W, /options: \[essai, simulation, brouillons\]\s*\n\s*default: essai/);
});

test("un texte déjà en brouillon n'est jamais payé deux fois", () => {
  assert.match(W, /git switch -q -C brouillons\/resumes FETCH_HEAD/, "on repart de la branche des brouillons");
  assert.match(W, /textes-officiels\.mjs[^\n]*\\\n[^\n]*--deja \.\.\/data\/resumes/, "les dossiers déjà faits sont sautés");
});

test("jamais un brouillon validé par la machine, jamais rien sur main sans fusion du porteur", () => {
  assert.match(W, /grep -l '"valide": \*true'[^\n]*\n\s*echo "::error::Un brouillon porte valide: true : refusé\."; exit 1/);
  assert.match(W, /git push -q origin brouillons\/resumes/);
  assert.doesNotMatch(W, /git push[^\n]*\bmain\b/, "aucune poussée sur main");
});

test("sans clé, rien n'est appelé ; la simulation ne coûte rien", () => {
  assert.match(W, /Secret MISTRAL_API_KEY absent : rien n'est appelé/);
  assert.match(W, /simulation\) OPTIONS="--mock --essai"/);
});
