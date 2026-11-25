/* LE BUREAU (dashboard desktop, porteur, 25/11/2026) : à 1440 px, barre latérale et tableau de bord ; à 390 px,
 * l'application mobile inchangée (barre d'onglets, pas de barre latérale). Chaque widget dit quelque chose (doctrine
 * du vide) ; le tour guidé se passe et ne revient pas ; aucune clé de stockage ajoutée.
 * Usage : node apps/mobile/tests/bureau-web.mjs http://localhost:8811 [dossier-captures] */
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
const CAP = process.argv[3] || null;
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const navigateur = await chromium.launch();
const ouvrir = async (largeur, hauteur, profil) => {
  const contexte = await navigateur.newContext({ viewport: { width: largeur, height: hauteur } });
  await contexte.addInitScript(p => { if (p && !localStorage.getItem("repere.profil")) localStorage.setItem("repere.profil", JSON.stringify(p)); }, profil);
  const page = await contexte.newPage();
  const erreurs = []; page.on("pageerror", e => erreurs.push(String(e.message || e).slice(0, 160)));
  return { contexte, page, erreurs };
};

/* 1. Grand écran, première visite : pas de barrière au prénom, la recherche au centre, le tour guidé. */
{
  const { contexte, page, erreurs } = await ouvrir(1440, 900, null);
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByTestId("tableau-de-bord").waitFor({ timeout: 15000 });
  verifier(await page.getByTestId("barre-laterale").isVisible(), "1440 px : la barre latérale est là");
  verifier(!(await page.getByTestId("barriere-bienvenue").isVisible().catch(() => false)), "1440 px : pas de barrière au prénom sur l'accueil");
  verifier(await page.getByPlaceholder(/Votre ville ou code postal/).isVisible(), "1440 px : la recherche de commune est visible");
  verifier(await page.getByTestId("tour-guide").isVisible(), "première visite : le tour guidé est proposé");
  if (CAP) await page.screenshot({ path: CAP + "/bureau-accueil.png" });
  /* Seconde passe (porteur, 25/11/2026) : pas une colonne centrée, un bloc d'accueil, une grille qui prend la largeur. */
  verifier(await page.getByTestId("hero").isVisible(), "le bloc d'accueil (hero) est là");
  const largeur = (await page.getByTestId("tableau-de-bord").boundingBox()).width;
  verifier(largeur >= 1000, `à 1440 px, la grille prend la largeur (${Math.round(largeur)} px, attendu 1000 au moins)`);
  const scr = await page.getByTestId("widget-scrutin").boundingBox(), chf = await page.getByTestId("widget-chiffre").boundingBox();
  verifier(Math.abs(scr.y - chf.y) < 2 && scr.width > chf.width * 1.5, "Bento : le scrutin et le chiffre clé sont côte à côte, de tailles différentes");
  await page.getByTestId("tour-passer").click(); await page.waitForTimeout(400);
  verifier(await page.getByTestId("tour-guide").count() === 0, "« J'ai compris » ferme le tour guidé");
  await page.reload({ waitUntil: "networkidle" }); await page.getByTestId("tableau-de-bord").waitFor({ timeout: 15000 });
  verifier(await page.getByTestId("tour-guide").count() === 0, "après rechargement, il ne revient pas de lui-même");
  await page.getByTestId("faire-le-tour").click(); await page.waitForTimeout(300);
  verifier(await page.getByTestId("tour-guide").isVisible(), "« Faire le tour » le rouvre");
  await page.getByTestId("faire-le-tour").click(); await page.waitForTimeout(300);
  /* Doctrine du vide : chaque widget porte une phrase sous son titre. */
  const widgets = page.locator('[data-testid^="widget-"]:not([data-testid="widget-source"])');
  const n = await widgets.count();
  verifier(n >= 7, `sept widgets au moins (${n})`);
  for (let i = 0; i < n; i++) {
    const t = (await widgets.nth(i).innerText()).trim().split("\n").filter(Boolean);
    verifier(t.length >= 2, `widget ${await widgets.nth(i).getAttribute("data-testid")} : il dit quelque chose (« ${(t[1] || "").slice(0, 40)} »)`);
  }
  await page.getByTestId("dep-95").first().click(); await page.waitForTimeout(400);
  const texteCarte = await page.getByTestId("widget-carte").innerText();
  verifier(/communes en Val-d'Oise|pas encore chargée/.test(texteCarte), "un département ouvre la liste de ses communes (ou dit qu'elle manque)");
  const cles = await page.evaluate(() => Object.keys(localStorage).sort());
  verifier(cles.every(c => ["repere.departement", "repere.profil"].includes(c)), "aucune clé de stockage ajoutée : " + JSON.stringify(cles));
  verifier(erreurs.length === 0, "bureau : aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));
  await contexte.close();
}

/* 2. Un onglet sur grand écran : la barre latérale remplace la barre du bas. */
{
  const { contexte, page } = await ouvrir(1440, 900, { prenom: "Test", animationsReduites: true, mode: "clair", alertes: [] });
  await page.goto(BASE + "/qui-decide", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  verifier(await page.getByTestId("barre-laterale").isVisible(), "1440 px, onglet : barre latérale");
  verifier(await page.getByRole("tab").count() === 0, "1440 px, onglet : plus de barre d'onglets en bas");
  verifier(await page.locator('[data-testid="barre-quidecide"][aria-current="page"]').count() === 1, "l'entrée « Qui décide » est marquée comme page courante");
  await contexte.close();
}

/* 3. Mobile : rien ne change. */
{
  const { contexte, page } = await ouvrir(390, 844, { prenom: "Test", animationsReduites: true, mode: "clair", alertes: [] });
  await page.goto(BASE + "/qui-decide", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  verifier(await page.getByTestId("barre-laterale").count() === 0, "390 px : pas de barre latérale");
  verifier(await page.getByRole("tab").count() >= 4, "390 px : la barre d'onglets est là");
  await page.goto(BASE + "/", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  verifier(await page.getByTestId("tableau-de-bord").count() === 0, "390 px : l'accueil mobile, pas le tableau de bord");
  await contexte.close();
}

await navigateur.close();
console.log(echecs === 0 ? "bureau : zéro échec" : `bureau : ${echecs} échec(s)`);
process.exit(echecs === 0 ? 0 : 1);
