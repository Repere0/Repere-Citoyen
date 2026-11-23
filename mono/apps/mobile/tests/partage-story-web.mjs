/* LES CARTES DE PARTAGE (STORY), VUES DANS UN NAVIGATEUR — 30/10/2026 (V20, bloc 3).
 *
 * Usage : node apps/mobile/tests/partage-story-web.mjs http://localhost:8811 [dossier-captures]
 *
 * CE QUE CE CONTROLE MESURE : la carte 9:16 rendue par l'application (meme code React
 * Native, via react-native-web), photographiee a l'echelle 3 : 360 x 640 -> 1080 x 1920.
 * Pour trois cartes : actualite locale, calendrier, fiche de l'annuaire (budget et vote de la fiche
 * elu supprimes le 12/11/2026 par le porteur). Une carte absente fait echouer le controle.
 * L'agenda et l'actualite locale sont des DONNEES D'ESSAI injectees par ce test (page.route),
 * marquees « ESSAI », jamais publiees : les fichiers reels peuvent etre absents ou vides.
 * Pour chaque carte :
 *   - l'image fait 1080 x 1920 et pese plus de 10 Ko (elle n'est pas vide) ;
 *   - le logo est present (anneau de 34 px) ;
 *   - chaque texte a un contraste d'au moins 4,5:1 sur le fond de la carte ;
 *   - la derniere ligne dit la source.
 * CE QU'IL NE MESURE PAS : le PNG produit sur telephone par react-native-view-shot
 * (captureRef). Dans un navigateur, cette capture echoue et l'application partage le
 * texte seul (use-partage-story.ts). La mise en page est la meme ; le moteur de rendu
 * de l'image, non. A verifier sur appareil. */
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

let chromium;
for (const racine of ["../../../package.json", "../package.json"]) {
  try { ({ chromium } = createRequire(path.resolve(import.meta.dirname, racine))("playwright")); break; } catch { /* suivant */ }
}
const BASE = process.argv[2] || "http://localhost:8811";
const CAPTURES = process.argv[3] || null;
if (CAPTURES) fs.mkdirSync(CAPTURES, { recursive: true });
const echecs = [];
const verifier = (ok, msg) => { console.log((ok ? "ok    " : "ECHEC ") + msg); if (!ok) echecs.push(msg); };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const jourParis = d => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const J = k => jourParis(new Date(Date.now() + k * 864e5));
await ctx.route("**/data/agenda-an.json", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
  source: { producteur: "Assemblée nationale (ESSAI)", licence: "Licence ouverte", url: "https://www.assemblee-nationale.fr/dyn/agenda", releve_le: J(0) },
  evenements: [{ debut: `${J(1)}T15:00`, titre: "ESSAI — séance construite pour le test", description: null, categorie: "Séance publique" }],
}) }));
await ctx.route("**/data/calendrier-senat.json", r => r.abort());
await ctx.route("**/data/actus-hebdo.json", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
  semaine: "2026-W01", date_publication: J(0),
  communes: { "77284": { titre: "ESSAI — actualité construite pour le test", resume: "Deux phrases d'essai. Ce n'est pas une donnée réelle.", source: "https://exemple.test/essai", source_nom: "Source d'essai" } },
}) }));
const p = await ctx.newPage();
await p.addInitScript(() => { if (!localStorage.getItem("repere.profil")) localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test", niveauZoom: "tout", tailleTexte: 16, espacement: 1.5, contraste: "normal", policeDyslexie: false, animationsReduites: false, modeDaltonien: false, masquerImages: false })); });  /* V26 : profil deja repondu, l'accueil ne pose pas les 3 questions */

async function controler(nom) {
  const carte = p.locator('[data-testid="carte-story"]').last();
  await carte.waitFor({ state: "attached", timeout: 10000 });
  /* La carte est hors ecran (left: -10000) : on la ramene dans la fenetre pour la
     photographier. Seul le style de son conteneur change, dans ce navigateur d'essai. */
  /* On la deplace sous <body>, en position fixe, au-dessus de tout : sinon le contenu de
     l'ecran la recouvre et la photo melange les deux (vu sur la premiere version de ce test).
     Elle est remise a sa place juste apres. */
  await carte.evaluate(e => {
    const c = e.parentElement;
    window.__story = { c, parent: c.parentElement, suivant: c.nextSibling, style: c.getAttribute("style") };
    document.body.appendChild(c);
    Object.assign(c.style, { position: "fixed", left: "0px", top: "0px", zIndex: "2147483647" });
    /* Le conteneur est « pointerEvents none » : elementFromPoint l'ignorerait. Le temps du
       controle de recouvrement, ses elements redeviennent visibles pour ce test. */
    c.id = "__story";
    const st = document.createElement("style"); st.id = "__story_style";
    st.textContent = "#__story, #__story * { pointer-events: auto !important; }";
    document.head.appendChild(st);
  });
  await p.waitForTimeout(300);
  const png = await carte.screenshot();
  /* Rien d'autre que la carte : aucun element de la page ne doit couvrir son centre ni son pied. */
  const seule = await carte.evaluate(e => [[180, 320], [180, 600], [40, 620]].every(([x, y]) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); }));
  verifier(seule, `${nom} : la carte n'est recouverte par rien`);
  const largeur = png.readUInt32BE(16), hauteur = png.readUInt32BE(20);
  verifier(largeur === 1080 && hauteur === 1920, `${nom} : image ${largeur} x ${hauteur} (attendu 1080 x 1920)`);
  verifier(png.length > 10240, `${nom} : image de ${Math.round(png.length / 1024)} Ko (plus de 10 Ko)`);
  if (CAPTURES) fs.writeFileSync(path.join(CAPTURES, `story-${nom}.png`), png);
  const m = await carte.evaluate(e => {
    const lum = c => { const v = (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map(x => x / 255).map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const fond = lum(getComputedStyle(e).backgroundColor);
    const ratio = c => { const l = lum(c); return (Math.max(l, fond) + 0.05) / (Math.min(l, fond) + 0.05); };
    const logo = [...e.querySelectorAll("div")].some(d => { const r = d.getBoundingClientRect(); return Math.round(r.width) === 34 && Math.round(r.height) === 34; });
    const textes = [...e.querySelectorAll("div[dir=auto]")].filter(t => t.textContent.trim() && !t.querySelector("div[dir=auto]"));
    const faibles = textes.map(t => ({ t: t.textContent.trim().slice(0, 30), r: ratio(getComputedStyle(t).color) })).filter(x => x.r < 4.5)
      /* le badge de groupe porte son propre fond : son texte se mesure sur ce fond (BadgeGroupe, ADR 0001) */
      .filter(x => !/^Groupe/.test(x.t));
    const mots = textes.map(t => t.textContent.trim()).join(" ").split(/\s+/).filter(Boolean).length;
    /* 23/11/2026 (modèles A à D) : zones sûres d'Instagram et de TikTok, 250 px en haut et 340 px en bas sur 1920,
       soit 84 et 114 pt sur 640 ; la source au-dessus du pied ; l'adresse publique dans le pied. */
    const haut = e.getBoundingClientRect().top;
    const horsZone = textes.map(t => { const r = t.getBoundingClientRect(); return { t: t.textContent.trim().slice(0, 30), h: Math.round(r.top - haut), b: Math.round(r.bottom - haut) }; })
      .filter(x => x.h < 84 || x.b > 640 - 114);
    const source = e.querySelector('[data-testid="carte-source"]')?.textContent.trim() || "";
    const pied = e.querySelector('[data-testid="carte-pied"]')?.textContent.trim() || "";
    /* L'adresse ne doit jamais être coupée par une ellipse (vu le 23/11 : « repere-cit… »). */
    const adresse = textes.find(t => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(t.textContent.trim()));
    const adresseEntiere = !!adresse && adresse.scrollWidth <= adresse.clientWidth + 1;
    return { logo, faibles, mots, horsZone, source, pied, adresseEntiere };
  });
  await p.evaluate(() => { const s = window.__story; document.getElementById("__story_style")?.remove(); s.c.removeAttribute("id"); s.c.setAttribute("style", s.style || ""); s.parent.insertBefore(s.c, s.suivant); });
  verifier(m.logo, `${nom} : logo present`);
  /* V34 bloc 4 : une carte story ne porte que le titre, une phrase, un visuel et la source. Plafond : 45 mots. */
  verifier(m.mots <= 55, `${nom} : ${m.mots} mots (au plus 55 : 45 pour le contenu, 10 pour le pied ajouté le 23/11/2026)`);
  verifier(!m.faibles.length, `${nom} : textes a 4,5:1 au moins${m.faibles.length ? " — faibles : " + JSON.stringify(m.faibles) : ""}`);
  verifier(/source|définition/i.test(m.source), `${nom} : la source est écrite au-dessus du pied (« ${m.source.slice(0, 60)} »)`);
  verifier(/^Repère/.test(m.pied) && /\.[a-z]{2,}$/.test(m.pied), `${nom} : la marque, l'invitation et l'adresse sont en pied (« ${m.pied} »)`);
  verifier(m.adresseEntiere, `${nom} : l'adresse publique est écrite en entier, sur sa propre ligne`);
  verifier(!m.horsZone.length, `${nom} : aucun texte dans les zones masquées par Instagram${m.horsZone.length ? " : " + JSON.stringify(m.horsZone) : ""}`);
}

await p.goto(BASE + "/", { waitUntil: "networkidle" });
await p.getByLabel(/Où habitez-vous/).fill("meaux");
await p.getByRole("button", { name: /^Meaux,/ }).first().click();
await p.getByText("Aller plus loin").first().waitFor({ timeout: 15000 });

/* 0. Actualite locale de la semaine (ActuStory, D31) — sur Aujourd'hui */
await p.getByText("Cette semaine à Meaux").first().waitFor({ timeout: 10000 });
await controler("actu");

/* 12/11/2026 (porteur) : plus de carte de partage sur Finances ni sur la fiche d'un élu (ChiffreStory, VoteStory
   supprimées : elles répétaient le chiffre principal). */

/* 3. Calendrier (AgendaStory) */
await p.getByRole("button", { name: "Le calendrier", exact: true }).first().click();
await p.getByText(/Les séances annoncées/).first().waitFor({ timeout: 10000 });
await p.waitForTimeout(800);
await controler("calendrier");
await p.goBack();
await p.getByText("Aller plus loin").first().waitFor({ timeout: 15000 });

/* 4. Annuaire, fiche d'un elu (ElusStory) */
await p.getByRole("button", { name: "Élus", exact: true }).first().click();
await p.getByPlaceholder(/Nom, département/).first().waitFor({ timeout: 10000 });
await p.waitForTimeout(800);
await p.getByRole("button", { name: /, .*,/ }).first().click();
await p.waitForTimeout(800);
await controler("annuaire");

/* 5. Repère du jour (modèle A, l'affiche) */
await p.goto(BASE + "/repere-du-jour#meaux", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
if (await p.locator('[data-testid="carte-story"]').count()) await controler("repere-du-jour");
else console.log("note  repere-du-jour : aucun fait ce jour, pas de carte");

await b.close();
console.log(echecs.length ? `${echecs.length} echec(s)` : "cartes de partage : zero echec");
process.exit(echecs.length ? 1 : 0);
