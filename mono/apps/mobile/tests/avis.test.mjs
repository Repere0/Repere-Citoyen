/* Mode démo et avis des lecteurs (17/11/2026) : un lien mailto pré-rempli, encodé, sans serveur. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const { corpsAvis, lienAvis } = await import("../src/lib/avis.ts");
const sys = { version: "0.1.0", date: new Date("2026-11-17T10:00:00Z"), plateforme: "web", navigateur: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" };

/* 27/11/2026 (porteur) : les informations techniques tout en bas, sous une ligne qui le dit, sur UNE ligne courte. */
test("informations techniques : en bas, sous la ligne de séparation, en une ligne lisible", () => {
  const c = corpsAvis(sys, { note: 4, texte: "Bien." });
  const lignes = c.split("\n");
  const i = lignes.indexOf("--- Ne pas modifier en dessous de cette ligne ---");
  assert.ok(i > 0, "la ligne de séparation est là");
  assert.equal(lignes.length - i - 1, 1, "une seule ligne technique");
  assert.match(lignes[i + 1], /^Repère 0\.1\.0 · 2026-11-17 · web · /);
  assert.ok(!c.includes("Mozilla/5.0"), "plus la chaîne entière du navigateur");
  assert.ok(lignes.slice(0, i).join("\n").includes("Bien."), "le texte du lecteur est AU-DESSUS de la ligne");
  assert.doesNotMatch(corpsAvis({ ...sys, navigateur: null }), /sur iOS/, "sans navigateur, rien d'inventé");
});

test("navigateur en clair : Safari, Chrome, Firefox, Edge et le système", async () => {
  const { navigateurCourt } = await import("../src/lib/avis.ts");
  assert.equal(navigateurCourt("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1"), "Safari 18 sur iOS 18.1");
  assert.equal(navigateurCourt("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36"), "Chrome 131 sur Android 14");
  assert.equal(navigateurCourt("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0"), "Firefox 132 sur Windows");
  assert.equal(navigateurCourt(null), null);
});

/* Porteur, 27/11/2026 (14:51) : le prénom ne sort JAMAIS de l'appareil, même dans un mail que le lecteur envoie
   lui-même (invariant 2). Le sujet reste neutre. */
test("sujet : la page choisie entre crochets, « Général » sans choix, jamais le prénom", async () => {
  const { sujetAvis, THEMES_AVIS } = await import("../src/lib/avis.ts");
  assert.deepEqual([...THEMES_AVIS], ["Accueil", "L'Assemblée", "Ma commune", "Finances", "Les élus", "Le calendrier", "Le quiz", "Autre"]);
  assert.equal(sujetAvis({ theme: "Finances", prenom: "Jean" }), "[Avis - Finances] Retour d'un lecteur", "le prénom n'entre pas dans le sujet");
  assert.ok(!lienAvis("a@b.fr", sys, { theme: "Finances", prenom: "Jean", texte: "x" }).includes("Jean"), "ni dans le message");
  assert.equal(sujetAvis({}), "[Avis - Général] Retour d'un lecteur");
  assert.equal(sujetAvis({ theme: "Inventé" }), "[Avis - Général] Retour d'un lecteur", "hors liste : Général");
  const l = lienAvis("a@b.fr", sys, { theme: "Le quiz" });
  assert.equal(decodeURIComponent(l.split("subject=")[1].split("&body=")[0]), "[Avis - Le quiz] Retour d'un lecteur");
});

test("le lien mailto est encodé : ni espace, ni retour à la ligne, ni « & » nu dans le corps", () => {
  /* 27/11/2026 : le navigateur n'est plus recopié tel quel ; le « & » passe par le texte du lecteur. */
  const l = lienAvis("avis@example.org", sys, { texte: "a & b ; c=d" });
  assert.match(l, /^mailto:avis@example\.org\?subject=[^ ]+&body=[^ \n]+$/);
  const corps = decodeURIComponent(l.split("&body=")[1]);
  assert.ok(corps.includes("a & b ; c=d"));
});

test("aucune adresse inventée : sans variable de build, pas de bouton", () => {
  const src = fs.readFileSync(new URL("../src/lib/avis.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g, ""), /@[a-z0-9-]+\.(fr|com|org)/i, "une adresse écrite en dur dans avis.ts");
});

/* Step Up (25/11/2026) : l'avis en trois étapes. */
test("avis en trois étapes : note, points d'une liste fixe, texte ; rien d'inventé", () => {
  const c = corpsAvis(sys, { note: 4, points: ["Le design", "intrus", "C'est lent"], texte: "Très clair." });
  /* 27/11/2026 : dans l'ordre note, ce qui va, ce qui ne va pas, message. */
  const ordre = ["Note : 4 étoiles sur 5 (beaucoup)", "Ce qui va : Le design", "Ce qui ne va pas : C'est lent", "Mon message :", "Très clair."].map(t => c.indexOf(t));
  assert.ok(ordre.every(x => x >= 0), "tout est écrit");
  assert.deepEqual(ordre, [...ordre].sort((a, b) => a - b), "dans l'ordre demandé");
  assert.ok(!c.includes("intrus"), "un point hors liste est ignoré");
  assert.ok(!corpsAvis(sys, { note: 9 }).includes("Note :"), "une note hors de 1 à 5 n'est pas écrite");
  assert.ok(corpsAvis(sys).startsWith("Mon message :"), "sans réponses, le message commence par le texte");
});

test("signaler une erreur (filet, 27/11/2026) : écran sans commune ni paramètre, erreur bornée, rien d'autre", async () => {
  const { lienSignalement } = await import("../src/lib/avis.ts");
  const l = lienSignalement("a@b.fr", { version: "1.2.3", date: new Date("2026-11-27T10:00:00Z"), chemin: "/finances?x=1#melun", erreur: "x".repeat(500), navigateur: "Safari" });
  const corps = decodeURIComponent(l.split("body=")[1]);
  assert.match(l, /^mailto:a@b\.fr\?subject=/);
  assert.match(corps, /Écran : \/finances\n/);
  assert.doesNotMatch(corps, /melun|x=1/, "jamais la commune ni un paramètre (invariant 2)");
  assert.equal((corps.match(/x/g) || []).length, 300, "erreur bornée à 300 caractères");
  assert.match(corps, /Version : 1\.2\.3\nDate : 2026-11-27\nNavigateur : Safari$/);
});
