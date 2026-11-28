/* PREMIER LANCEMENT (28/11/2026, porteur, hotfix H2 ; avant : 13/11/2026, ADR 0009).
 * L'accueil EST l'onboarding : l'accroche A et la recherche de commune, sans barrière, sans rien garder sur l'appareil.
 * Le prénom, facultatif, se donne à la demande (Réglages, « Personnaliser ») ; ses gardes restent : nettoyé, refusé
 * s'il n'en est pas un, jamais dans une adresse demandée (invariant 2). Ancien en-tête, pour l'histoire :
 * Sans profil, l'accueil laisse la place à « Bienvenue sur Repère ». On vérifie : le voile de démarrage disparaît en
 * 1,5 s au plus et ne capte aucun geste ; tout tient sur un écran d'iPhone sans défiler ; un prénom refusé (chiffres)
 * n'est pas gardé ; un prénom donné est gardé, nettoyé, et l'accueil dit bonjour ; « Passer » n'en garde aucun ;
 * le prénom n'apparaît dans aucune adresse demandée (invariant 2) ; un lien profond n'est pas détourné.
 * Usage : node apps/mobile/tests/onboarding-web.mjs http://localhost:8811 */
import { createRequire } from "node:module";
import { passerBienvenue } from "./_premier-lancement.mjs";
const { chromium } = createRequire(process.cwd() + "/")("playwright");

const BASE = process.argv[2] || "http://localhost:8811";
const CAP = process.argv[3] || null;
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const navigateur = await chromium.launch();
const nouveau = async () => {
  const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await contexte.newPage();
  const erreurs = [], demandees = [];
  page.on("pageerror", e => erreurs.push(String(e.message || e).slice(0, 160)));
  page.on("request", r => demandees.push(r.url()));
  return { contexte, page, erreurs, demandees };
};
const lireProfil = page => page.evaluate(() => JSON.parse(localStorage.getItem("repere.profil") || "null"));

/* 1. Première ouverture : l'accueil, l'accroche, la recherche ; rien de gardé */
{
  const { contexte, page, erreurs } = await nouveau();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByTestId("accroche").waitFor({ timeout: 10000 });
  verifier(!(await page.getByTestId("barriere-bienvenue").isVisible().catch(() => false)), "première ouverture : aucune barrière de bienvenue");
  verifier((await page.getByTestId("accroche").innerText()).trim() === "De votre mairie à l'Assemblée.", "première ouverture : l'accroche A");
  verifier(await page.getByLabel(/Où habitez-vous/).isVisible(), "première ouverture : la recherche de commune est là");
  verifier(!(await page.getByTestId("bandeau-decouverte").isVisible().catch(() => false)), "ouverture directe : pas de bandeau « Personnaliser » (réservé aux liens partagés)");
  verifier(await lireProfil(page) === null, "première ouverture : rien n'est gardé sur l'appareil");
  if (CAP) await page.screenshot({ path: `${CAP}/accueil-premiere.png` });
  verifier(erreurs.length === 0, "première ouverture : aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));
  await contexte.close();
}

/* 2. Le prénom, à la demande (Réglages) : refusé s'il n'en est pas un, nettoyé, jamais transmis */
{
  const { contexte, page, erreurs, demandees } = await nouveau();
  await page.goto(BASE + "/reglages", { waitUntil: "networkidle" });
  await page.getByTestId("changer-prenom").click();
  await page.getByTestId("barriere-bienvenue").waitFor({ state: "visible", timeout: 10000 });
  verifier(await page.getByText("Comment souhaitez-vous qu'on vous appelle ?").count() === 1, "à la demande : la question du prénom, un seul écran");
  for (const nom of [/^Continuer$/, /^Passer, sans/]) {
    const b = await page.getByRole("button", { name: nom }).boundingBox();
    verifier(b && b.height >= 44, `bienvenue : cible tactile de 44 px au moins (${String(nom)} : ${b && Math.round(b.height)} px)`);
  }
  const champ = page.getByLabel(/Votre prénom/);
  await champ.fill("R2-D2 <script>");
  verifier(await page.getByText("Un prénom : des lettres", { exact: false }).count() === 1, "bienvenue : une saisie refusée est dite au lecteur");
  await champ.fill("  marie-Hélène  ");
  if (CAP) await page.screenshot({ path: `${CAP}/bienvenue.png` });
  await page.getByTestId("continuer-1").click();
  await page.getByTestId("barriere-bienvenue").waitFor({ state: "detached", timeout: 10000 });
  const profil = await lireProfil(page);
  verifier(profil && profil.prenom === "marie-Hélène", "« Continuer » garde le prénom, nettoyé, dans repere.profil (" + JSON.stringify(profil && profil.prenom) + ")");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByTestId("bonjour").waitFor({ timeout: 10000 });
  verifier((await page.getByTestId("bonjour").innerText()).trim() === "Bonjour marie-Hélène", "accueil : « Bonjour marie-Hélène » remplace l'accroche");
  const cles = await page.evaluate(() => Object.keys(localStorage));
  verifier(cles.every(k => k === "repere.profil" || k === "repere.departement"), "aucune autre clé de stockage (" + cles.join(", ") + ")");
  verifier(!demandees.some(u => /marie|H%C3%A9l/i.test(u)), "le prénom n'apparaît dans aucune adresse demandée (" + demandees.length + " requêtes)");
  /* AU LANCEMENT SUIVANT, le voile de démarrage : bref, et il ne capte aucun geste. */
  await page.goto(BASE + "/", { waitUntil: "commit" });
  const voile = page.getByTestId("demarrage");
  await voile.waitFor({ state: "attached", timeout: 10000 });
  const pointeur = await voile.evaluate(e => getComputedStyle(e).pointerEvents);
  const vu = Date.now();
  await voile.waitFor({ state: "detached", timeout: 5000 });
  const duree = Date.now() - vu;
  verifier(pointeur === "none", "lancement suivant : le voile ne capte aucun geste (pointer-events " + pointeur + ")");
  verifier(duree <= 1500, "lancement suivant : le voile part en 1,5 s au plus (" + duree + " ms)");
  verifier(erreurs.length === 0, "aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));
  await contexte.close();
}

/* 3. « Passer », et une saisie refusée : « Citoyen », avec les réglages par défaut */
for (const [saisie, quoi] of [[null, "« Passer »"], ["12345", "une saisie refusée"]]) {
  const { contexte, page } = await nouveau();
  await page.goto(BASE + "/reglages", { waitUntil: "networkidle" });
  await page.getByTestId("changer-prenom").click();
  await page.getByTestId("barriere-bienvenue").waitFor({ state: "visible", timeout: 10000 });
  if (saisie === null) await page.getByRole("button", { name: /^Passer, sans/ }).click();
  else { await page.getByLabel(/Votre prénom/).fill(saisie); await page.getByTestId("continuer-1").click(); }
  await page.getByTestId("barriere-bienvenue").waitFor({ state: "detached", timeout: 10000 });
  await page.waitForTimeout(500);
  const profil = await lireProfil(page);
  verifier(profil && profil.prenom === "Citoyen" && profil.tailleTexte === 16, `${quoi} : le prénom « Citoyen », avec les réglages par défaut (${JSON.stringify(profil && profil.prenom)})`);
  await contexte.close();
}

/* 4. Un lien partagé ouvre son contenu (23/11/2026, porteur, ADR 0012). */
{
  const { contexte, page } = await nouveau();
  await page.goto(BASE + "/finances#melun", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  verifier(page.url().includes("/finances"), "lien partagé sans profil : l'adresse demandée n'est pas détournée");
  verifier(!(await page.getByTestId("barriere-bienvenue").isVisible().catch(() => false)), "lien partagé sans profil : aucune bienvenue ne couvre la page");
  verifier(/Où va l'argent de Melun/.test(await page.locator("body").innerText()), "lien partagé sans profil : le contenu (Finances de Melun) est lu tout de suite");
  verifier(await page.getByTestId("bandeau-decouverte").isVisible(), "lien partagé sans profil : un bandeau propose de personnaliser");
  verifier(await lireProfil(page) === null, "lien partagé : rien n'est gardé sur l'appareil sans que le lecteur le demande");
  await page.getByRole("button", { name: /^Personnaliser Repère/ }).click();
  await page.getByTestId("barriere-bienvenue").waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
  verifier(await page.getByTestId("barriere-bienvenue").isVisible(), "« Personnaliser » pose la bienvenue par-dessus la page");
  await passerBienvenue(page);
  verifier(page.url().includes("/finances") && !(await page.getByTestId("bandeau-decouverte").isVisible().catch(() => false)), "après la bienvenue : on reste sur Finances, le bandeau a disparu");
  await contexte.close();
}

await navigateur.close();
console.log(echecs === 0 ? "onboarding : zéro échec" : `onboarding : ${echecs} échec(s)`);
process.exit(echecs === 0 ? 0 : 1);
