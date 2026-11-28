/* HOTFIX UX DE LA BÊTA (28/11/2026, décision du porteur après l'audit du jour, H1 à H5).
 * Chaque contrôle vise un défaut MESURÉ en production le 28/11 (claude/Repere_Audit_UX_Onboarding_Hotfix_28_11_2026.md) :
 *   H1 — « Salaires 49 € » se lisait 49 € par habitant : la mention « Sur 100 € dépensés » doit se VOIR.
 *   H2 — trois écrans avant toute valeur, et la commune toujours pas choisie : à la première ouverture, plus de
 *        barrière ; l'accueil dit l'accroche A et la recherche de commune est le premier champ ; pas de carte
 *        d'alertes tant qu'aucune commune n'est gardée.
 *   H3 — titres du calendrier de 4 à 11 lignes : deux lignes au plus, « Lire tout » déplie.
 *   H4 — « Élections présidentielles » (singulier), promesse « Personne ne sait que vous êtes là » (inexacte).
 *   H5 — EcoS, Dem, DR et UDR avaient la même couleur dans l'hémicycle.
 * Usage : node apps/mobile/tests/hotfix-ux-web.mjs http://localhost:8811 [dossier de captures] */
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");

const BASE = process.argv[2] || "http://localhost:8811";
const CAP = process.argv[3] || null;
const PROFIL = { prenom: "Test", niveauZoom: "france", tailleTexte: 16, espacement: 1.5, contraste: "normal", policeDyslexie: false, animationsReduites: true, modeDaltonien: false, masquerImages: false, themes: [] };
const COMMUNE = { d: "77", c: "77288", nom: "Melun" };
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const navigateur = await chromium.launch();

async function ouvrir(chemin, { profil = null, commune = null } = {}) {
  const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await contexte.addInitScript(([p, d]) => {
    if (sessionStorage.getItem("__init")) return;
    sessionStorage.setItem("__init", "1");
    localStorage.clear();
    if (p) localStorage.setItem("repere.profil", JSON.stringify(p));
    if (d) localStorage.setItem("repere.departement", JSON.stringify(d));
  }, [profil, commune]);
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(String(e.message || e).slice(0, 160)));
  await page.goto(BASE + chemin, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  return { contexte, page, erreurs };
}

/* ── H2 + H4 (accueil) : la toute première ouverture ─────────────────────────────────────────────── */
{
  const { contexte, page, erreurs } = await ouvrir("/");
  const barriere = await page.getByTestId("barriere-bienvenue").isVisible().catch(() => false);
  verifier(!barriere, "H2 · première ouverture : aucune barrière de bienvenue par-dessus l'accueil");
  const h1 = page.getByRole("heading", { name: "De votre mairie à l'Assemblée." });
  verifier(await h1.count() === 1, "H2 · l'accroche A est le titre de l'accueil");
  const texte = await page.locator("body").innerText();
  verifier(texte.includes("Qui décide, qui vote quoi, où va l'argent public. Chaque fait avec sa source."), "H2 · le sous-titre de l'accroche A");
  const champ = page.getByPlaceholder("Votre ville ou code postal");
  const boite = await champ.boundingBox();
  verifier(boite && boite.y + boite.height <= 844 * 0.6, `H2 · la recherche de commune est dans le haut de l'écran (finit à ${boite && Math.round(boite.y + boite.height)} px sur 844)`);
  verifier(!texte.includes("Choisir mes sujets"), "H2 · sans commune, pas de carte d'alertes « Choisir mes sujets »");
  verifier(texte.includes("Sans compte, sans traceur publicitaire."), "H2 · la ligne de confidentialité est sous la recherche");
  verifier(!texte.includes("Personne ne sait que vous êtes là"), "H4 · la promesse inexacte a disparu");
  const profil = await page.evaluate(() => localStorage.getItem("repere.profil"));
  verifier(profil === null, "H2 · rien n'est gardé sur l'appareil tant que le lecteur n'a rien choisi");
  if (CAP) await page.screenshot({ path: `${CAP}/hotfix-accueil.png` });
  /* Le parcours entier en un écran : taper, choisir, arriver chez soi. */
  const parcours = await (async () => {
    if (!(await champ.isVisible().catch(() => false))) return false;
    await champ.fill("Melun");
    await page.getByText("Melun", { exact: true }).first().click({ timeout: 10000 });
    await page.waitForURL(/chez-vous/, { timeout: 15000 }).catch(() => {});
    return /chez-vous/.test(page.url());
  })().catch(() => false);
  verifier(parcours, "H2 · taper sa commune et la choisir mène à sa page, sans autre écran");
  verifier(erreurs.length === 0, "H2 · aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));
  await contexte.close();
}

/* ── H2 bis : un lecteur avec un profil (prénom, réglages) mais sans commune — le cas mesuré en production ─────── */
{
  const { contexte, page } = await ouvrir("/", { profil: PROFIL });
  await page.getByTestId("bonjour").waitFor({ timeout: 10000 }).catch(() => {});
  const texte = await page.locator("body").innerText();
  verifier(texte.includes("Bonjour Test"), "H2 bis · avec un prénom gardé : « Bonjour Test »");
  verifier(!texte.includes("Choisir mes sujets"), "H2 bis · sans commune, pas de carte d'alertes « Choisir mes sujets »");
  await contexte.close();
}

/* ── H2 ter : les alertes (ADR 0013) restent visibles, sur la page de la commune ─────────────────────────────────── */
{
  const { contexte, page } = await ouvrir("/chez-vous", { profil: PROFIL, commune: { d: COMMUNE.d, c: COMMUNE.c } });
  verifier(await page.getByTestId("alertes-proposition").first().isVisible().catch(() => false), "H2 ter · page Commune : la proposition d'alertes est visible");
  const heros = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-testid="reponse"]')].filter(e => e.offsetParent)[0]; return r ? Math.round(r.getBoundingClientRect().bottom) : null; });
  verifier(heros !== null && heros <= 844, `H2 ter · la réponse héros reste dans le premier écran (${heros} px)`);
  await contexte.close();
}

/* ── H1 : la répartition dit « sur 100 € » à l'œil ───────────────────────────────────────────────── */
for (const chemin of ["/chez-vous", "/finances"]) {
  const { contexte, page } = await ouvrir(chemin, { profil: PROFIL, commune: { d: COMMUNE.d, c: COMMUNE.c } });
  const mention = page.getByTestId("barre-budget-sur-100");
  const visible = await mention.first().isVisible().catch(() => false);
  verifier(visible, `H1 · ${chemin} : la mention visible au-dessus de la légende`);
  if (visible) verifier((await mention.first().innerText()).trim() === "Sur 100 € dépensés", `H1 · ${chemin} : elle dit « Sur 100 € dépensés »`);
  if (CAP && chemin === "/chez-vous") await page.screenshot({ path: `${CAP}/hotfix-commune.png` });
  await contexte.close();
}

/* ── H3 : calendrier, deux lignes au plus, « Lire tout » ─────────────────────────────────────────── */
{
  /* Agenda d'ESSAI (jamais une donnée réelle publiée) : les titres longs relevés en production le 28/11/2026. */
  const jourParis = d => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const J = k => jourParis(new Date(Date.now() + k * 864e5));
  const LONG = "ESSAI PLF pour 2027 – Examen des amendements de séance sur la mission « Écologie, développement et mobilité durables » (et articles 81 et 82), le compte d'affectation spéciale « Financement des aides aux collectivités pour l'électrification rurale (FACÉ) » et le budget annexe « Contrôle et exploitation aériens »";
  const evenements = [];
  for (let k = 1; k <= 3; k++) {
    evenements.push({ debut: `${J(k)}T09:30`, titre: LONG, categorie: "Séance publique" });
    evenements.push({ debut: `${J(k)}T15:00`, titre: "ESSAI Questions au Gouvernement", categorie: "Séance publique" });
    evenements.push({ debut: `${J(k)}T21:30`, titre: "ESSAI PLF pour 2027 – Examen des amendements de séance sur la mission « Travail, emploi et administration des ministères sociaux » (et articles 88 et 89)", categorie: "Séance publique" });
  }
  const contexte0 = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  await contexte0.route("**/data/agenda-an.json", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    source: { producteur: "Assemblée nationale (ESSAI)", licence: "Licence ouverte", url: "https://www.assemblee-nationale.fr/dyn/agenda", releve_le: J(0) }, evenements }) }));
  await contexte0.route("**/data/calendrier-senat.json", r => r.abort());
  await contexte0.addInitScript(([p, d]) => { localStorage.setItem("repere.profil", JSON.stringify(p)); localStorage.setItem("repere.departement", JSON.stringify(d)); }, [PROFIL, { d: COMMUNE.d, c: COMMUNE.c }]);
  const page = await contexte0.newPage();
  const contexte = contexte0;
  await page.goto(BASE + "/a-venir", { waitUntil: "networkidle" });
  await page.getByTestId("cal-ligne").first().waitFor({ timeout: 20000 });
  const lignes = await page.getByTestId("cal-titre").evaluateAll(els => els.map(e => {
    const s = getComputedStyle(e); const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.3;
    return Math.round(e.getBoundingClientRect().height / lh);
  }));
  const max = Math.max(...lignes);
  verifier(lignes.length >= 6, `H3 · ${lignes.length} titres de séance mesurés`);
  verifier(max <= 2, `H3 · aucun titre de séance au-delà de 2 lignes (max ${max})`);
  const boutons = page.getByRole("button", { name: /^Lire tout le titre/ });
  const n = await boutons.count();
  verifier(n > 0, `H3 · « Lire tout » est proposé sur les titres longs (${n})`);
  if (n) {
    const b = await boutons.first().boundingBox();
    verifier(b && b.height >= 44, `H3 · « Lire tout » : cible de 44 px au moins (${b && Math.round(b.height)})`);
    const titre = page.getByTestId("cal-titre").filter({ has: page.locator("xpath=.") }).first();
    await boutons.first().click();
    await page.waitForTimeout(300);
    const apres = await page.getByTestId("cal-titre").evaluateAll(els => els.map(e => {
      const s = getComputedStyle(e); const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.3;
      return Math.round(e.getBoundingClientRect().height / lh);
    }));
    verifier(Math.max(...apres) > 2, `H3 · « Lire tout » déplie le titre entier (${Math.max(...apres)} lignes)`);
    verifier(await page.getByRole("button", { name: /^Réduire le titre/ }).count() === 1, "H3 · le titre déplié se replie");
    void titre;
  }
  if (CAP) await page.screenshot({ path: `${CAP}/hotfix-calendrier.png` });
  await contexte.close();
}

/* ── H4 : les textes ─────────────────────────────────────────────────────────────────────────────── */
{
  const { contexte, page } = await ouvrir("/dictionnaire", { profil: PROFIL });
  const texte = await page.locator("body").innerText();
  verifier(texte.includes("c'est ne voter ni pour ni contre"), "H4 · dictionnaire : « ne voter ni pour ni contre »");
  await contexte.close();
}

/* ── H5 : l'hémicycle distingue EcoS, Dem, DR et UDR ─────────────────────────────────────────────── */
{
  /* Table des groupes d'ESSAI, avec les sigles que publie l'Assemblée pour la 17e législature (relevés le 28/11/2026). */
  const SIGLES = ["LFI", "SOC", "LIOT", "EPR", "DR", "UDR", "EcoS", "GDR", "Dem", "NI", "HOR", "RN"];
  const t = {}; let i = 0;
  SIGLES.forEach(g => { for (let j = 0; j < 10; j++, i++) t["PA" + (i + 1)] = { groupe: g, nom: `Député ${i + 1}` }; });
  const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  await contexte.route("**/deputes-groupes.json", r => r.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ v: 1, genere_le: "2026-11-28", source: { producteur: "Assemblée nationale (table d'essai)", licence: "Licence Ouverte 2.0" }, groupes: t }) }));
  await contexte.route("**/hemicycle-plan.json", r => r.abort());
  await contexte.addInitScript(p => localStorage.setItem("repere.profil", JSON.stringify(p)), PROFIL);
  const page = await contexte.newPage();
  await page.goto(BASE + "/scrutins", { waitUntil: "networkidle" });
  await page.getByText("EcoS", { exact: true }).first().waitFor({ timeout: 20000 }).catch(() => {});
  const fonds = await page.evaluate(() => {
    const out = {};
    for (const e of document.querySelectorAll("div,span")) {
      const t = (e.textContent || "").trim();
      if (e.childElementCount || !/^(EcoS|Dem|DR|UDR)$/.test(t)) continue;
      const pastille = [...e.parentElement.querySelectorAll("*")].find(x => x !== e && x.getBoundingClientRect().width > 4 && x.getBoundingClientRect().width < 20);
      if (pastille) out[t] = getComputedStyle(pastille).backgroundColor;
    }
    return out;
  });
  const valeurs = Object.values(fonds);
  verifier(valeurs.length === 4, `H5 · les quatre groupes sont dans la légende (${Object.keys(fonds).join(", ")})`);
  verifier(new Set(valeurs).size === 4, "H5 · quatre couleurs différentes : " + JSON.stringify(fonds));
  verifier(!valeurs.includes("rgb(91, 98, 112)"), "H5 · aucun des quatre n'est le gris « groupe inconnu »");
  await contexte.close();
}

await navigateur.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout passe.");
process.exit(echecs ? 1 : 0);
