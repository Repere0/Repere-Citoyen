#!/usr/bin/env node
/* GÉNÉRER DES BROUILLONS DE RÉSUMÉS « EN CLAIR » AVEC UNE IA — 26/11/2026 (porteur : voie 2, Mistral).
 *
 * Ce script ÉCRIT des BROUILLONS, jamais une publication :
 *   1. il lit un ou plusieurs textes officiels (un fichier texte par dossier, préparé par la collecte ou à la main) ;
 *   2. il demande un résumé au modèle avec une consigne fixe (CONSIGNE, ci-dessous) ;
 *   3. il passe la réponse dans les contrôles de scripts/resumes-clairs.mjs (nombres et noms propres présents dans le
 *      texte officiel, aucun mot de jugement, longueur) ; une réponse qui échoue n'est PAS écrite ;
 *   4. il range le brouillon dans data/resumes/<dossier>.json avec `valide: false`.
 * Rien ne s'affiche tant que le porteur n'a pas posé `valide: true` à la main (garde-fou 5, décision du 26/11/2026),
 * puis lancé `node scripts/resumes-clairs.mjs --publier ./data`.
 *
 * AUCUNE CLÉ DANS LE DÉPÔT, AUCUN APPEL DEPUIS L'APPLICATION : la clé vient de l'environnement (MISTRAL_API_KEY), en
 * local ou dans un secret GitHub. L'application ne fait que lire le fichier publié.
 *
 * USAGE (depuis mono/) :
 *   node scripts/generer_resumes.mjs --liste lots.json [--mock] [--modele mistral-small-latest] [--essai]
 *   lots.json : [{ "dossier": "DLR5L17N51670", "texte": "chemin/vers/officiel.txt", "url": "https://www.assemblee-nationale.fr/...",
 *                  "titre": "…", "scrutins": ["9759"] }, …]
 *   --mock   : aucun appel réseau ; le « modèle » renvoie les deux premières phrases du texte officiel (pour éprouver
 *              la chaîne sans clé ni dépense).
 *   --essai  : appelle le modèle, contrôle, affiche, mais n'écrit rien (mesurer la qualité et les jetons consommés).
 * DÉPENSE : chaque appel est facturé par Mistral. Le script compte les jetons renvoyés par l'API (champ `usage`) et
 * les affiche ; il ne connaît pas le tarif et ne chiffre rien. Premier passage recommandé : 20 textes en --essai. */
import fs from "node:fs";
import { brouillon, controlerResume } from "./resumes-clairs.mjs";
import { jourParis } from "../packages/core/src/aujourdhui.js";

export const MODELE_DEFAUT = "mistral-small-latest";
export const URL_MISTRAL = "https://api.mistral.ai/v1/chat/completions";

/* La consigne du porteur (26/11/2026), mot pour mot dans sa partie centrale, et les règles de Repère autour. */
export const CONSIGNE = [
  "Explique ce texte à un jeune de 15 ans, en 3 phrases maximum, sans aucun jugement de valeur, en te basant UNIQUEMENT sur les faits présents dans ce texte.",
  "Règles : n'ajoute aucun nombre, aucune date ni aucun nom qui ne figure pas dans le texte ; n'utilise aucun mot qui donne un avis, qui compare ou qui classe ;",
  "ne dis pas si le texte est bon ou mauvais ; écris en français courant, au présent ; réponds par le résumé seul, sans titre ni introduction.",
].join(" ");

/* Le message envoyé au modèle : la consigne, puis le texte officiel tel quel, délimité. */
export function messages(texteOfficiel) {
  return [
    { role: "system", content: CONSIGNE },
    { role: "user", content: `Texte officiel :\n"""\n${String(texteOfficiel).trim()}\n"""` },
  ];
}

/* Le faux modèle : les deux premières phrases du texte officiel, mot pour mot. Il passe toujours les contrôles de
   faits (tout vient du texte) : il éprouve la chaîne, pas la qualité. */
export function modeleSimule(texteOfficiel) {
  const phrases = String(texteOfficiel).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return { texte: phrases.slice(0, 2).join(" "), jetons: null };
}

/* L'appel réel. `fetchImpl` est injectable pour les tests (aucun réseau dans le banc). */
export async function appelerMistral(texteOfficiel, { cle, modele = MODELE_DEFAUT, fetchImpl = fetch } = {}) {
  if (!cle) throw new Error("MISTRAL_API_KEY absente de l'environnement (jamais dans un fichier du dépôt)");
  const rep = await fetchImpl(URL_MISTRAL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
    body: JSON.stringify({ model: modele, temperature: 0, max_tokens: 300, messages: messages(texteOfficiel) }),
  });
  if (!rep.ok) throw new Error(`Mistral a répondu ${rep.status}`);
  const json = await rep.json();
  const texte = json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  if (typeof texte !== "string" || !texte.trim()) throw new Error("réponse sans texte");
  return { texte: texte.trim(), jetons: json.usage || null };
}

/* Un lot : génère, contrôle, écrit (ou pas). Renvoie un compte rendu par dossier, sans jamais lever pour un seul
   texte refusé (les autres continuent). */
export async function genererLot(lots, { mock = false, essai = false, cle, modele, fetchImpl, jour, sortie } = {}) {
  const compte = [];
  for (const l of lots) {
    const ligne = { dossier: l.dossier, ok: false, erreurs: [], jetons: null };
    try {
      const officiel = fs.readFileSync(l.texte, "utf8");
      const { texte, jetons } = mock ? modeleSimule(officiel) : await appelerMistral(officiel, { cle, modele, fetchImpl });
      ligne.jetons = jetons;
      const c = controlerResume(texte, officiel);
      if (!c.ok) { ligne.erreurs = c.erreurs; ligne.resume = texte; compte.push(ligne); continue; }
      ligne.resume = texte;
      if (!essai) brouillon({ dossier: l.dossier, texte: officiel, resume: texte, url: l.url, titre: l.titre || null, scrutins: l.scrutins || [], jour,
        voie: mock ? "simulation" : `ia:${modele || MODELE_DEFAUT}`, ...(sortie ? { sortie } : {}) });
      ligne.ok = true;
    } catch (e) {
      ligne.erreurs = [String(e && e.message ? e.message : e)];
    }
    compte.push(ligne);
  }
  return compte;
}

async function main() {
  const a = process.argv.slice(2);
  const val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const liste = val("--liste");
  if (!liste) { console.error("usage : node scripts/generer_resumes.mjs --liste lots.json [--mock] [--essai] [--modele NOM]"); process.exit(2); }
  const lots = JSON.parse(fs.readFileSync(liste, "utf8"));
  const mock = a.includes("--mock"), essai = a.includes("--essai");
  /* La date du relevé, à l'heure de Paris (jamais celle de la machine en UTC). */
  const jour = jourParis(new Date());
  const compte = await genererLot(lots, { mock, essai, cle: process.env.MISTRAL_API_KEY, modele: val("--modele") || MODELE_DEFAUT, jour });
  let jetons = 0;
  for (const l of compte) {
    if (l.jetons && l.jetons.total_tokens) jetons += l.jetons.total_tokens;
    console.log(`${l.ok ? "brouillon" : "REFUSÉ  "} ${l.dossier}${l.erreurs.length ? " : " + l.erreurs.join(" ; ") : ""}`);
    if (l.resume) console.log(`          « ${l.resume} »`);
  }
  console.log(`${compte.filter(l => l.ok).length}/${compte.length} brouillons ${essai ? "contrôlés (rien d'écrit, --essai)" : "écrits, valide: false"}${mock ? " (modèle simulé)" : ""}.`);
  if (!mock) console.log(`Jetons consommés selon l'API : ${jetons || "non renvoyés"}. Le coût dépend du tarif Mistral du jour : non calculé ici.`);
  console.log("Rien ne s'affiche avant que le porteur pose valide: true, puis publie (scripts/resumes-clairs.mjs --publier).");
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error("generer_resumes : " + e.message); process.exit(2); });
