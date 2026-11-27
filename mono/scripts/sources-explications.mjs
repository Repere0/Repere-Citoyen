#!/usr/bin/env node
/* LES SOURCES DES EXPLICATIONS « EN CLAIR » AU-DELÀ DES LOIS (porteur, 27/11/2026 : « un traducteur universel pour
 * toute la data publique complexe »). Ce script ne parle à aucune IA : il écrit, pour chaque donnée, le TEXTE
 * OFFICIEL que le modèle aura le droit de reformuler, et rien d'autre. Tout nombre de l'explication devra s'y lire
 * (contrôle des nombres, scripts/resumes-clairs.mjs).
 *
 * Deux types :
 *   - budget : les six agrégats OFGL du dernier exercice d'une commune (montant et par habitant), tels que publiés ;
 *   - vote   : un scrutin publié (objet, date, nature, résultat, pour, contre, abstentions, votants).
 * Les événements du calendrier n'ont PAS de type propre : leur seul texte officiel est un titre d'une ligne, et
 * « expliquer l'enjeu » à partir d'un titre, c'est inventer. Un événement qui porte un dossier législatif affiche
 * l'explication de ce dossier (déjà produite par textes-officiels.mjs) : rien à payer deux fois.
 *
 * LOT DE LA SEMAINE (coût maîtrisé) : --depuis AAAA-MM-JJ ne garde que les données publiées ou mises à jour depuis
 * cette date (un budget suit la date de mise à jour OFGL : il ne revient qu'une fois par an ; un vote suit sa date).
 * --deja <dossier> saute ce qui a déjà un brouillon ou une explication validée.
 *
 * USAGE (depuis mono/) :
 *   node scripts/sources-explications.mjs --types budget,vote --donnees data --sortie explications \
 *        [--departements 75,77,78,91,92,93,94,95] [--depuis 2026-11-20] [--deja ../data/resumes] [--limite 50]
 *   Écrit <sortie>/<clé>.txt et <sortie>/lots.json, que lit scripts/generer_resumes.mjs. */
import fs from "node:fs";
import path from "node:path";
import { fichierDeCle } from "./resumes-clairs.mjs";

export const IDF = ["75", "77", "78", "91", "92", "93", "94", "95"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dateLongue = j => { const [a, m, d] = j.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${a}`; };
const euros = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/* Le texte officiel d'un budget : une ligne par agrégat publié, rien qui ne soit dans le fichier OFGL. Un agrégat
   absent est dit absent (doctrine du vide), jamais compté zéro. */
export function sourceBudget({ insee, nom, comptes, agregats, src }) {
  const ans = Object.keys(comptes || {}).filter(a => /^\d{4}$/.test(a)).sort();
  const an = ans[ans.length - 1];
  if (!an) return null;
  const ex = comptes[an];
  const lignes = agregats.map(([libelle], i) => {
    const m = ex[1 + i * 2], h = ex[2 + i * 2];
    if (typeof m !== "number") return `${libelle} : non publié pour cette année.`;
    return `${libelle} : ${euros(m)} euros${typeof h === "number" ? `, soit ${euros(h)} euros par habitant` : ""}.`;
  });
  const texte = [`Comptes de la commune de ${nom} pour l'année ${an}, publiés par l'Observatoire des finances et de la gestion publique locales (OFGL).`,
    typeof ex[0] === "number" ? `Population prise en compte : ${euros(ex[0])} habitants.` : null, ...lignes].filter(Boolean).join("\n");
  return { type: "budget", cle: `budget:${insee}`, titre: `Les comptes ${an} de ${nom}`, texte, url: src.url, producteur: src.producteur, date: src.maj };
}

/* Le texte officiel d'un vote : ce que dit la fiche publiée du scrutin. */
export function sourceVote(s) {
  if (!s || !/^\d+$/.test(String(s.n || "")) || !/^\d{4}-\d{2}-\d{2}$/.test(s.d || "")) return null;
  const dec = s.dec || {};
  const texte = [
    `Scrutin numéro ${s.n} de l'Assemblée nationale, le ${dateLongue(s.d)}${s.tv ? `, ${s.tv}` : ""}.`,
    s.t ? `Objet du vote : ${String(s.t).replace(/\s+/g, " ").trim()}` : null,
    s.dl ? `Dossier : ${s.dl}.` : null,
    s.sl ? `Résultat : ${s.sl}.` : null,
    dec.pour != null ? `Pour : ${dec.pour}. Contre : ${dec.contre}. Abstentions : ${dec.abstentions}.` : null,
    s.nv ? `Votants : ${s.nv}.` : null,
  ].filter(Boolean).join("\n");
  /* Adresse de la fiche du scrutin sur le site de l'Assemblée : forme vue sur le site public, NON VÉRIFIÉE depuis le
     conteneur (il ne joint pas l'Assemblée). */
  return { type: "vote", cle: `scrutin:${s.n}`, titre: s.dl || `Scrutin ${s.n}`, texte, url: `https://www.assemblee-nationale.fr/dyn/17/scrutins/${s.n}`, producteur: "Assemblée nationale", date: s.d, scrutins: [String(s.n)] };
}

export function preparerExplications({ donnees, types, departements = IDF, depuis = null, deja = null, limite = 50, sortie }) {
  const existants = deja && fs.existsSync(deja) ? new Set(fs.readdirSync(deja).filter(f => f.endsWith(".json")).map(f => f.replace(/\.json$/, ""))) : new Set();
  const lots = [], ecartes = [];
  const garder = x => {
    if (!x) return;
    if (existants.has(fichierDeCle(x.cle))) { ecartes.push({ cle: x.cle, raison: "déjà un brouillon ou une explication" }); return; }
    if (depuis && !(x.date >= depuis)) { ecartes.push({ cle: x.cle, raison: `donnée du ${x.date}, avant le ${depuis}` }); return; }
    lots.push(x);
  };
  const index = JSON.parse(fs.readFileSync(path.join(donnees, "index.json"), "utf8"));
  if (types.includes("vote")) {
    const cat = JSON.parse(fs.readFileSync(path.join(donnees, "scrutins.json"), "utf8"));
    for (const s of cat.scrutins || []) garder(sourceVote(s));
  }
  if (types.includes("budget")) {
    const src = index.sources && index.sources.comptes;
    if (!src || !/^https:\/\//.test(src.url || "")) throw new Error("index.json : source des comptes absente (producteur, url, maj)");
    for (const d of departements) {
      const f = path.join(donnees, "departments", d + ".json");
      if (!fs.existsSync(f)) { ecartes.push({ cle: `departement:${d}`, raison: "fichier du département absent" }); continue; }
      const dep = JSON.parse(fs.readFileSync(f, "utf8"));
      for (const [insee, c] of Object.entries(dep.communes || {})) garder(sourceBudget({ insee, nom: c.nom, comptes: c.comptes, agregats: index.agregats, src }));
    }
  }
  const retenus = lots.slice(0, limite);
  fs.mkdirSync(sortie, { recursive: true });
  for (const l of retenus) { l.chemin = path.join(sortie, fichierDeCle(l.cle) + ".txt"); fs.writeFileSync(l.chemin, l.texte + "\n"); }
  const sortieLots = retenus.map(({ texte, chemin, ...l }) => ({ ...l, texte: chemin }));
  fs.writeFileSync(path.join(sortie, "lots.json"), JSON.stringify(sortieLots, null, 1) + "\n");
  return { lots: sortieLots, ecartes, hors_limite: Math.max(0, lots.length - limite) };
}

function main() {
  const a = process.argv.slice(2);
  const val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if (!val("--types") || !val("--donnees") || !val("--sortie")) {
    console.error("usage : node scripts/sources-explications.mjs --types budget,vote --donnees data --sortie explications [--departements 75,77] [--depuis AAAA-MM-JJ] [--deja ../data/resumes] [--limite 50]");
    process.exit(2);
  }
  const r = preparerExplications({ donnees: val("--donnees"), types: val("--types").split(","), sortie: val("--sortie"),
    departements: val("--departements") ? val("--departements").split(",") : IDF, depuis: val("--depuis"), deja: val("--deja"), limite: Number(val("--limite") || 50) });
  const parType = t => r.lots.filter(l => l.type === t).length;
  console.log(`${r.lots.length} source(s) prête(s) : ${parType("budget")} budget(s), ${parType("vote")} vote(s) ; ${r.ecartes.length} écartée(s) ; ${r.hors_limite} au-delà de la limite (prochain lot).`);
}
if (import.meta.url === `file://${process.argv[1]}`) { try { main(); } catch (e) { console.error("sources-explications : " + e.message); process.exit(2); } }
