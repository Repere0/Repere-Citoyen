// POLICES DU WEB, ALLÉGÉES (23/11/2026, audit pré-bêta M1).
//
// Mesuré avant : le premier écran chargeait 1 096 Ko de polices TTF, dont Ionicons ENTIER (390 Ko, 211 Ko
// compressés) pour une cinquantaine de pictogrammes, et huit fautes de texte complètes (tous alphabets).
// Après `expo export`, ce script remplace chaque .ttf de dist/assets par un .woff2 réduit :
//   - polices de texte : latin (ASCII, Latin-1, Latin étendu A, ponctuation, €, espaces fines) ;
//   - Ionicons : les seuls pictogrammes nommés dans src/ (et leurs variantes -outline / -sharp).
// Les adresses sont réécrites dans le JavaScript exporté. expo-font écrit « src:url(...) » sans format :
// le navigateur reconnaît le woff2 à son contenu.
// Le téléphone (iOS, Android) n'est pas concerné : il garde les TTF embarqués.
import { readFileSync, writeFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Les caractères des polices de texte : tout le français, l'anglais, les noms propres d'Europe de l'Ouest et
   centrale (Latin étendu A : ł, ő, š…), la ponctuation typographique, l'euro et les espaces insécables. */
export function caracteresTexte() {
  const plages = [[0x20, 0x7e], [0xa0, 0xff], [0x100, 0x17f], [0x2000, 0x206f], [0x20ac, 0x20ac], [0x2190, 0x2193], [0x2212, 0x2212]];
  let s = "";
  for (const [a, b] of plages) for (let c = a; c <= b; c++) s += String.fromCodePoint(c);
  return s;
}

function fichiers(dossier, filtre) {
  const out = [];
  for (const n of readdirSync(dossier)) {
    const p = join(dossier, n);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...fichiers(p, filtre));
    else if (filtre(p)) out.push(p);
  }
  return out;
}

/* Les noms d'Ionicons cités dans le code : toute chaîne littérale qui est un nom de la table, plus ses variantes
   (« newspaper » écrit seul sert aussi à `${nom}-outline`). Trop large ne coûte que quelques octets ; trop étroit
   donnerait un carré vide : la garde `nomsManquants` le vérifie sur le code. */
export function nomsIonicons(sources, table) {
  const noms = new Set();
  for (const src of sources) {
    for (const m of src.matchAll(/["'`]([a-z0-9-]+)["'`$]/g)) {
      const base = m[1].replace(/-(outline|sharp)$/, "");
      for (const v of [base, `${base}-outline`, `${base}-sharp`]) if (v in table) noms.add(v);
    }
  }
  return [...noms].sort();
}

export function sourcesApp() {
  return fichiers(join(APP, "src"), p => /\.(tsx?|jsx?)$/.test(p)).map(p => readFileSync(p, "utf8"));
}

export function tableIonicons() {
  return JSON.parse(readFileSync(join(APP, "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "glyphmaps", "Ionicons.json"), "utf8"));
}

export async function allegerPolices(dist) {
  const assets = join(dist, "assets");
  let ttf;
  try { ttf = fichiers(assets, p => p.endsWith(".ttf")); } catch { return { avant: 0, apres: 0, polices: [] }; }
  if (!ttf.length) return { avant: 0, apres: 0, polices: [] };
  const table = tableIonicons();
  const pictos = nomsIonicons(sourcesApp(), table).map(n => String.fromCodePoint(table[n])).join("");
  const texte = caracteresTexte();
  const js = fichiers(dist, p => /\.(js|html|json)$/.test(p) && !p.includes(`${sep}data${sep}`));
  const contenus = new Map(js.map(p => [p, readFileSync(p, "utf8")]));
  let avant = 0, apres = 0;
  const polices = [];
  for (const f of ttf) {
    const brut = readFileSync(f);
    const estIcones = /Ionicons/.test(f);
    const woff2 = await subsetFont(brut, estIcones ? pictos : texte, { targetFormat: "woff2" });
    const g = f.replace(/\.ttf$/, ".woff2");
    writeFileSync(g, woff2);
    rmSync(f);
    avant += brut.length; apres += woff2.length;
    polices.push({ police: relative(dist, g), avant: brut.length, apres: woff2.length });
    const ancien = relative(dist, f).split(sep).join("/"), nouveau = relative(dist, g).split(sep).join("/");
    for (const [p, c] of contenus) if (c.includes(ancien)) contenus.set(p, c.split(ancien).join(nouveau));
  }
  for (const [p, c] of contenus) writeFileSync(p, c);
  const restes = [...contenus.values()].filter(c => /assets\/[^"'\s]+\.ttf/.test(c)).length;
  if (restes) throw new Error(`polices : ${restes} fichier(s) citent encore un .ttf supprimé`);
  return { avant, apres, polices, pictogrammes: [...pictos].length };
}

// Ligne de commande : node scripts/polices-web.mjs <dossier-dist>
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await allegerPolices(process.argv[2]);
  console.log(`Polices web : ${Math.round(r.avant / 1024)} Ko de TTF -> ${Math.round(r.apres / 1024)} Ko de woff2 (${r.pictogrammes} pictogrammes Ionicons gardés)`);
}
