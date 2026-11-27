// Le Hub des outils citoyens (27/11/2026). Usage : node apps/mobile/tests/outils-web.mjs http://localhost:8811
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "ECHEC ") + m); if (!c) echecs++; };
const nav = await chromium.launch();
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";
const erreurs = [];

/* Un lien touché ouvre un onglet (Linking.openURL → window.open) : on retient l'adresse au lieu de quitter la page. */
async function ouvrir({ largeur = 390, ua } = {}) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, serviceWorkers: "block", ...(ua ? { userAgent: ua, isMobile: true, hasTouch: true } : {}) });
  await ctx.addInitScript(() => {
    localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test" }));
    window.__ouverts = []; window.open = u => { window.__ouverts.push(String(u)); return null; };
  });
  const page = await ctx.newPage(); page.on("pageerror", e => erreurs.push(String(e)));
  return { ctx, page };
}
/* window.open reçoit l'adresse normalisée par le navigateur (« https://www.ameli.fr/ ») : on compare sans la barre finale. */
const ouvert = async page => (await page.evaluate(() => window.__ouverts.slice(-1)[0] || "")).replace(/\/$/, "");

{ /* Téléphone : on arrive par la barre d'onglets. */
  const { ctx, page } = await ouvrir({ ua: IPHONE });
  /* La barre d'onglets vit sous l'accueil de la commune (l'écran « / » est la porte d'entrée, sans barre). */
  await page.goto(BASE + "/chez-vous#melun", { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  const onglet = page.getByRole("tab").filter({ hasText: /Outils/ }).first();
  ok(await onglet.count() === 1, "390 px : un onglet « Outils » dans la barre du bas");
  await onglet.click(); await page.waitForTimeout(1200);
  ok(new URL(page.url()).pathname === "/outils", `l'onglet ouvre /outils (${new URL(page.url()).pathname})`);
  const t = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  ok(t.includes("Les outils citoyens"), "le Hub s'ouvre, avec son titre");
  for (const c of ["Identité et connexion", "Démarches et droits", "Impôts", "Santé", "Aides et famille", "Emploi et formation"])
    ok(t.toLowerCase().includes(c.toLowerCase()), `catégorie « ${c} » affichée`);
  ok(await page.locator('[data-testid^="outil-"]').count() === 10, "dix cartes de services");
  /* 27/11/2026 : en colonne, un flexBasis de 300 étirait chaque carte à 300 px de haut, du vide sous le texte. */
  const hCarte = (await page.getByTestId("outil-legifrance").boundingBox()).height;
  ok(hCarte < 220, `390 px : une carte garde la hauteur de son contenu (${Math.round(hCarte)} px)`);
  ok(await page.getByTestId("app-franceconnect").count() === 0, "sans application : pas de bouton « Télécharger l'app » (FranceConnect)");
  ok(t.includes("n'est affilié à aucun de ces services"), "la mention de non-affiliation est écrite");

  /* La recherche : sans accent ni majuscule. */
  const champ = page.getByLabel("Rechercher un outil citoyen");
  await champ.fill("IMPOT"); await page.waitForTimeout(300);
  ok(await page.locator('[data-testid^="outil-"]').count() === 1 && await page.getByTestId("outil-impots").count() === 1, "recherche « IMPOT » : une seule carte, impots.gouv");
  await champ.fill("zzzz"); await page.waitForTimeout(300);
  ok((await page.locator("body").innerText()).includes("Aucun service ne correspond"), "recherche sans résultat : une phrase vraie et un lien (invariant 5)");
  await page.getByRole("button", { name: "Effacer la recherche" }).click(); await page.waitForTimeout(300);
  ok(await page.locator('[data-testid^="outil-"]').count() === 10, "« Effacer » remet les dix services");

  /* Le clic sur une carte renvoie vers le bon site ; sur iPhone, l'app vers l'App Store. */
  /* 27/11/2026, soir (porteur) : toute la carte ouvre le site ; plus de bouton « Site web ». */
  ok(!t.includes("Site web"), "plus aucun bouton « Site web »");
  await page.getByTestId("lien-ameli").click();
  ok(await ouvert(page) === "https://www.ameli.fr", `la carte d'ameli ouvre https://www.ameli.fr (${await ouvert(page)})`);
  const hLien = (await page.getByTestId("lien-ameli").boundingBox()).height;
  ok(hLien >= 48, `la carte-lien fait 48 px au moins (${Math.round(hLien)} px)`);
  const imbriques = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="lien-"]')]
    .filter(l => l.querySelector('a, button, [role="link"], [role="button"]')).length);
  ok(imbriques === 0, `aucune commande imbriquée dans une carte-lien (${imbriques})`);
  ok((await page.getByTestId("lien-ameli").innerText()).includes("Santé"), "le nom de la catégorie est écrit sur la carte, la couleur n'est jamais seule");
  const filet = await page.getByTestId("outil-ameli").evaluate(e => getComputedStyle(e).borderTopColor);
  ok(filet === "rgb(252, 231, 243)", `filet de la carte à la teinte « Santé » du mode clair (${filet})`);
  await page.getByTestId("app-impots").click();
  ok(await ouvert(page) === "https://apps.apple.com/fr/app/id505488770", `iPhone : « Télécharger l'app » ouvre l'App Store (${await ouvert(page)})`);
  const h = (await page.getByTestId("app-impots").boundingBox()).height;
  ok(h >= 44, `cible tactile de 44 px au moins (${Math.round(h)} px)`);
  ok(await page.getByRole("link", { name: /^ameli, site officiel, ouvre un site externe$/ }).count() === 1, "chaque carte-lien a un nom accessible clair");
  await ctx.close();
}
{ /* Réglage « mode daltonien » : la variante Okabe-Ito (ADR 0014). */
  const { ctx, page } = await ouvrir();
  await ctx.addInitScript(() => localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test", modeDaltonien: true })));
  await page.goto(BASE + "/outils", { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  const filet = await page.getByTestId("outil-ameli").evaluate(e => getComputedStyle(e).borderTopColor);
  ok(filet === "rgb(242, 220, 232)", `mode daltonien : filet « Santé » de la variante (${filet})`);
  await ctx.close();
}
{ /* Android : le Play Store. */
  const { ctx, page } = await ouvrir({ ua: ANDROID });
  await page.goto(BASE + "/outils", { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  await page.getByTestId("app-caf").click();
  ok(await ouvert(page) === "https://play.google.com/store/apps/details?id=fr.cnaf.mobile.moncompte", `Android : le Play Store (${await ouvert(page)})`);
  await ctx.close();
}
{ /* Ordinateur : la barre latérale mène au Hub ; l'app ouvre le site officiel. */
  const { ctx, page } = await ouvrir({ largeur: 1440 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  const entree = page.getByRole("link", { name: /^Outils$/ }).first();
  ok(await entree.count() === 1, "1440 px : une entrée « Outils » dans la barre latérale");
  if (await entree.count()) { await entree.click(); await page.waitForTimeout(1200); }
  ok(new URL(page.url()).pathname === "/outils", "la barre latérale ouvre /outils");
  await page.getByTestId("app-france-travail").click();
  ok(await ouvert(page) === "https://www.francetravail.fr", `ordinateur : « Télécharger l'app » ouvre le site officiel (${await ouvert(page)})`);
  const debord = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(!debord, "aucun débordement horizontal à 1440 px");
  await ctx.close();
}
ok(!erreurs.length, "aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs[0] : ""));
await nav.close();
console.log(echecs ? `outils : ${echecs} échec(s)` : "outils : zéro échec");
process.exit(echecs ? 1 : 0);
