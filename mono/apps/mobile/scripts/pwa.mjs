// PWA : manifeste, balises iOS et vercel.json, deduits de app.json (une seule source).
// Expo (Metro) ne produit plus de manifeste : ce script le fait apres `expo export`.
// Fonctions pures exportees pour etre eprouvees (tests/pwa.test.mjs).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { politique } from "./cloudflare.mjs";

export function construireManifeste(appJson) {
  const w = appJson.expo.web, e = appJson.expo;
  return {
    /* id (17/11/2026) : identite stable de l'application installee, meme si start_url change un jour. */
    id: "/", name: w.name || e.name, short_name: w.shortName || e.name, description: w.description,
    lang: w.lang || "fr", dir: "ltr", start_url: "/", scope: "/", display: w.display || "standalone",
    orientation: w.orientation || "portrait", background_color: w.backgroundColor, theme_color: w.themeColor,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      /* MASQUABLE (17/11/2026) : Android decoupe l'icone en cercle, en goutte ou en carre arrondi. Sans entree
         « maskable », il la reduit dans une pastille blanche. Mesure : le logo tient dans un rayon de 171,5 px sur
         512, la zone sure est de 204,8 px (40 %), fond plein : la meme image convient, sans marge a ajouter. */
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

// viewport-fit=cover : sans lui, iOS ne donne pas les marges de securite et la barre
// d'etat translucide recouvrirait l'en-tete.
/* PARTAGE D'UN LIEN (17/11/2026) : Open Graph et carte « summary », communs a tout le site. Une seule page HTML
   est servie (export « single ») : un robot de reseau social n'execute pas le JavaScript, il lit ces balises-ci
   pour toutes les adresses.
   23/11/2026 (audit C6) : og:url et og:image (1200 x 630, public/og-image.png), carte « summary_large_image ».
   L'adresse absolue vient d'app.json (expo.extra.adressePublique), la meme que l'application. Sans elle (cle
   absente), ces deux balises ne sont pas ecrites : mieux vaut un apercu sans image qu'une image introuvable. */
const echapper = t => String(t || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const PARTAGE = (nom, description, adresse) => [
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="${echapper(nom)}" />`,
  `<meta property="og:title" content="${echapper(nom)}" />`,
  `<meta property="og:description" content="${echapper(description)}" />`,
  `<meta property="og:locale" content="fr_FR" />`,
  ...(adresse ? [
    `<meta property="og:url" content="${echapper(adresse)}/" />`,
    `<meta property="og:image" content="${echapper(adresse)}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${echapper(nom)} : qui décide chez vous, où va votre argent." />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ] : [`<meta name="twitter:card" content="summary" />`]),
];
const BALISES = (nom, couleur, description, adresse) => [
  ...PARTAGE(nom, description, adresse),
  '<link rel="manifest" href="/manifest.json" />',
  // 12/11/2026 : sizes + ?v= pour que Safari redemande l'icone (cache tenace). A incrementer si l'icone change.
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  `<meta name="apple-mobile-web-app-title" content="${nom}" />`,
  /* theme-color : ecrit par Expo depuis app.json (expo.web.themeColor) ; on ne l'ecrit qu'en son absence (23/11 : il etait en double). */
  ...(couleur ? [`<meta name="theme-color" content="${couleur}" />`] : []),
  // 12/11/2026 (iPhone, Safari) : la barre basse disparaissait ou passait sous la barre d'accueil. La page est figee a la
  // taille VISIBLE (100dvh : suit la barre d'adresse de Safari), le document ne defile plus (seuls les ecrans defilent),
  // la marge de securite du bas est donnee par la barre elle-meme (react-native-safe-area-context lit env(safe-area-inset-bottom)).
  // 12/11/2026 (roadmap beta) : la regle « [role=tablist]{padding-bottom:env(safe-area-inset-bottom)} » est RETIREE. Mesure
  // avec une marge de 34 px emulee (tests/marges-ios-web.mjs) : elle doublait la marge que la barre pose deja (les libelles
  // des onglets descendaient de 6 px dans la zone de la barre d'accueil) et elle gonflait de 34 px chaque controle
  // segmente de l'application, qui porte le meme role (« 100 EUR citoyen / Evolution / Recettes »).
  '<style id="repere-ios">html,body{height:100%;overflow:hidden;overscroll-behavior:none}body{position:fixed;top:0;right:0;bottom:0;left:0;width:100%}#root{height:100%}@supports(height:100dvh){html,body,#root{height:100dvh}}</style>',
].join("\n    ");

export const NOSCRIPT = "<noscript>Repère a besoin de JavaScript pour s'afficher. Activez-le dans les réglages de votre navigateur, puis rechargez la page.</noscript>";

const ENREGISTRE = "<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}</script>";

export function injecterBalises(html, appJson) {
  if (html.includes("apple-mobile-web-app-capable")) return html.includes("serviceWorker.register") ? html : html.replace("</head>", `  ${ENREGISTRE}\n  </head>`); // idempotent
  const w = appJson.expo.web;
  let sortie = html.replace(/(<meta name="viewport" content="[^"]*?)"/, (m, a) => (a.includes("viewport-fit") ? m : `${a}, viewport-fit=cover"`));
  const adresse = (appJson.expo.extra?.adressePublique || "").replace(/\/$/, "");
  const couleur = /<meta name="theme-color"/.test(sortie) ? null : w.themeColor;
  sortie = sortie.replace("</head>", `  ${BALISES(w.shortName || appJson.expo.name, couleur, w.description, adresse)}\n    ${ENREGISTRE}\n  </head>`);
  /* Sans JavaScript, Expo affiche « You need to enable JavaScript to run this app. » : en anglais (audit V1, 27/11/2026). */
  sortie = sortie.replace(/<noscript>[\s\S]*?<\/noscript>/, NOSCRIPT);
  /* Langue du document : sans elle, lecteurs d'ecran et moteurs lisent le francais avec une voix anglaise. */
  if (!/<html[^>]*\blang=/.test(sortie)) sortie = sortie.replace(/<html(\s|>)/, '<html lang="fr"$1');
  return sortie;
}

// Garde de fin de build : liste ce qui manque, vide si tout est la.
export function manques(html, manifeste) {
  const m = [];
  if (/<noscript>[^<]*You need to enable JavaScript/.test(html)) m.push("message sans JavaScript en anglais");
  for (const t of ['rel="manifest"', 'rel="apple-touch-icon"', 'name="apple-mobile-web-app-capable" content="yes"',
    'name="apple-mobile-web-app-status-bar-style" content="black-translucent"', "viewport-fit=cover"]) if (!html.includes(t)) m.push(t);
  if (!html.includes("serviceWorker.register('/sw.js')")) m.push("enregistrement du service worker");
  if (manifeste.display !== "standalone") m.push("display standalone");
  if (!manifeste.icons?.length) m.push("icones");
  return m;
}

// POURQUOI : Expo range les polices et les icones sous assets/node_modules/. La CLI Vercel (et d'autres
// hebergeurs) n'envoie JAMAIS un dossier nomme node_modules : en ligne, polices et icones repondent 404
// (texte en Times New Roman, icones en carres vides) alors que tout marche en local.
// On renomme le dossier et on reecrit les adresses du JavaScript. Les noms de fichiers restent empreintes.
export function deplacerNodeModules(dist) {
  const src = join(dist, "assets", "node_modules");
  if (existsSync(src)) renameSync(src, join(dist, "assets", "vendor"));
  const parcourir = d => { for (const n of readdirSync(d)) { const f = join(d, n);
    if (statSync(f).isDirectory()) parcourir(f);
    else if (/\.(js|json|html|css)$/.test(n)) { const t = readFileSync(f, "utf8");
      if (t.includes("/assets/node_modules/")) writeFileSync(f, t.split("/assets/node_modules/").join("/assets/vendor/")); } } };
  parcourir(dist);
}

// Garde : aucun chemin ni adresse ne doit encore contenir node_modules.
export function restesNodeModules(dist) {
  const reste = [];
  const parcourir = d => { for (const n of readdirSync(d)) { const f = join(d, n);
    if (n === "node_modules") reste.push(relative(dist, f));
    if (statSync(f).isDirectory()) parcourir(f);
    else if (/\.(js|json|html|css)$/.test(n) && readFileSync(f, "utf8").includes("/assets/node_modules/")) reste.push(relative(dist, f)); } };
  parcourir(dist);
  return reste;
}

// Tout ce que le build produit hors /data : l'interface complete, jamais les donnees.
export function fichiersCoquille(dist) {
  const sortie = ["/", "/index.html", "/offline.html", "/manifest.json", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/favicon.ico"];
  const parcourir = d => { for (const n of readdirSync(d)) { const f = join(d, n);
    if (statSync(f).isDirectory()) parcourir(f); else sortie.push("/" + relative(dist, f).split(sep).join("/").split("/").map(encodeURIComponent).join("/")); } };
  for (const d of ["_expo", "assets"]) parcourir(join(dist, d));
  return sortie;
}

// Ecrit la liste et la version dans sw.js. La version change si la liste ou le sw change.
export function preparerSw(sw, fichiers) {
  const liste = /const A_PRECHARGER = \[[^\]]*\];/;
  if (!liste.test(sw) || !sw.includes("__VERSION__")) throw new Error("sw.js : A_PRECHARGER ou __VERSION__ introuvable");
  const avecListe = sw.replace(liste, "const A_PRECHARGER = " + JSON.stringify(fichiers) + ";");
  const version = createHash("sha256").update(avecListe).digest("hex").slice(0, 12);
  return avecListe.replace("__VERSION__", version);
}

export function appliquer(dossierApp, dist) {
  const appJson = JSON.parse(readFileSync(join(dossierApp, "app.json"), "utf8"));
  deplacerNodeModules(dist);
  const manifeste = construireManifeste(appJson);
  writeFileSync(join(dist, "manifest.json"), JSON.stringify(manifeste, null, 2) + "\n");
  const f = join(dist, "index.html");
  writeFileSync(f, injecterBalises(readFileSync(f, "utf8"), appJson));
  // Vercel lit vercel.json dans le dossier deploye : `vercel deploy dist` ignorerait celui de la racine.
  // Sans les commandes de build : dans dist/, `vercel deploy` ne doit rien reconstruire, seulement reecrire les adresses.
  const v = JSON.parse(readFileSync(join(dossierApp, "vercel.json"), "utf8"));
  /* 17/11/2026 : les memes en-tetes de securite que sur Cloudflare (scripts/cloudflare.mjs), la politique de contenu
     etant deduite de l'index.html construit (empreinte du script ecrit). */
  const securite = { source: "/(.*)", headers: [
    { key: "Content-Security-Policy", value: politique(readFileSync(f, "utf8")) },
    { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "no-referrer" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  ] };
  writeFileSync(join(dist, "vercel.json"), JSON.stringify({ rewrites: v.rewrites, headers: [...(v.headers || []), securite] }, null, 2) + "\n");
  const sw = join(dist, "sw.js");
  writeFileSync(sw, preparerSw(readFileSync(join(dossierApp, "public", "sw.js"), "utf8"), fichiersCoquille(dist)));
  const reste = manques(readFileSync(f, "utf8"), manifeste);
  if (reste.length) throw new Error("PWA incomplete : " + reste.join(", "));
  const nm = restesNodeModules(dist);
  if (nm.length) throw new Error("node_modules encore present (non envoye par Vercel) : " + nm.join(", "));
}

// Ligne de commande : node scripts/pwa.mjs <dossier-dist> (utilisee par build-web.mjs et la CI).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  /* 23/11/2026 : polices allégées avant la liste du service worker (qui doit citer les .woff2). */
  const { allegerPolices } = await import("./polices-web.mjs");
  await allegerPolices(process.argv[2]);
  appliquer(join(fileURLToPath(import.meta.url), "..", ".."), process.argv[2]);
}
