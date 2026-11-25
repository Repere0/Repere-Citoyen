/* LES ALERTES LOCALES (Step Up, ADR 0013, décision du porteur du 25/11/2026).
 *
 * Aucune notification poussée, aucun serveur (invariant 1) : à l'ouverture, l'application compare ce qu'elle a
 * déjà publié (fichiers publics, datés) avec les sujets que le lecteur a choisis, et le dit en un bandeau.
 * Les sujets vivent dans repere.profil (`alertes`), sur l'appareil, jamais transmis (invariant 2, amendé).
 * Aucune date de visite n'est gardée : « nouveau » veut dire « publié ces 7 derniers jours », écrit à l'écran.
 * `alertes` vaut null tant que la question n'a pas été posée, [] si le lecteur a dit non : on ne redemande pas. */
import { themesDuTexte } from "./themes.js";

export const ALERTES = ["votes", "budgets", "elections", "actus"];
export const LIBELLE_ALERTE = {
  votes: "Votes à l'Assemblée",
  budgets: "Budgets",
  elections: "Élections",
  actus: "Actus de ma mairie",
};
export const FENETRE_ALERTES_JOURS = 7;

/* null (jamais demandé) reste null ; sinon, parmi ALERTES, sans doublon, dans l'ordre de la liste. */
export function nettoyerAlertes(v) {
  if (v === null || v === undefined) return null;
  if (!Array.isArray(v)) return null;
  return ALERTES.filter(a => v.includes(a));
}

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const ecart = (iso, ref) => Math.round((Date.UTC(+ref.slice(0, 4), +ref.slice(5, 7) - 1, +ref.slice(8, 10)) - Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))) / 86400000);
const recent = (iso, ref) => JOUR.test(String(iso).slice(0, 10)) && ecart(String(iso).slice(0, 10), ref) >= 0 && ecart(String(iso).slice(0, 10), ref) < FENETRE_ALERTES_JOURS;

/* Les nouveautés des sujets choisis. `aujourdhui` : la date du jour à Paris (AAAA-MM-JJ), donnée par l'appelant.
   Entrées : scrutins [{n,d,t}], evenements [{id,d,t}], actus [{titre,date,lien}], election {nom,jours}|null.
   Sortie : [{sujet, d, texte, lien?}], la plus récente d'abord. Rien n'est trié par importance (invariant 3). */
/** @param {{ sujets: string[] | null | undefined, aujourdhui: string, scrutins?: {n: string, d: string, t: string}[], evenements?: {id: string, d: string, t: string}[], actus?: {titre: string, date: string, lien: string}[], election?: {nom: string, jours: number} | null }} entree
 *  @returns {{ sujet: string, d: string, texte: string, lien?: string }[]} */
export function nouveautes({ sujets, aujourdhui, scrutins = [], evenements = [], actus = [], election = null }) {
  const s = nettoyerAlertes(sujets) || [];
  const out = [];
  if (s.includes("votes")) for (const x of scrutins) if (recent(x.d, aujourdhui)) out.push({ sujet: "votes", d: x.d, texte: x.t });
  if (s.includes("budgets")) for (const x of evenements) if (recent(x.d, aujourdhui) && themesDuTexte(x.t).includes("Budget")) out.push({ sujet: "budgets", d: x.d, texte: x.t });
  if (s.includes("actus")) for (const x of actus) if (recent(x.date, aujourdhui)) out.push({ sujet: "actus", d: String(x.date).slice(0, 10), texte: x.titre, lien: x.lien });
  out.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
  /* L'élection n'est pas une publication : un rappel, en tête, si elle tombe dans les 30 jours. */
  if (s.includes("elections") && election && election.jours >= 0 && election.jours <= 30)
    out.unshift({ sujet: "elections", d: aujourdhui, texte: election.jours === 0 ? `${election.nom} : c'est aujourd'hui.` : `${election.nom} : dans ${election.jours} jour${election.jours > 1 ? "s" : ""}.` });
  return out;
}
