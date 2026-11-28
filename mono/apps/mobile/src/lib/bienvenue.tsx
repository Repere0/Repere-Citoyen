/* OUVRIR LA BIENVENUE À LA DEMANDE (23/11/2026, porteur, ADR 0012).
 *
 * Un lien partagé ouvre son contenu sans passer par les trois écrans de bienvenue. Le lecteur arrivé ainsi
 * voit un bandeau discret ; le bouton « Personnaliser » pose la bienvenue par-dessus la page, comme à
 * l'accueil. Rien n'est gardé : l'état vit en mémoire, le temps de la session. */
import { createContext, useContext } from "react";

/* `parLien` (28/11/2026, hotfix H2) : la session a commencé ailleurs que sur l'accueil (un lien partagé). Seul ce
   lecteur-là voit le bandeau « Vous découvrez Repère » : sans prénom imposé, il serait sinon sur toutes les pages. */
export const ContexteBienvenue = createContext<{ ouvrir: () => void; parLien: boolean }>({ ouvrir: () => {}, parLien: false });
export const useBienvenue = () => useContext(ContexteBienvenue);

/* La règle, en une fonction (gardée par tests/chaine.test.mjs). 28/11/2026 (porteur, hotfix H2) : la bienvenue ne
   couvre plus l'accueil à la première ouverture — l'accueil EST l'onboarding (accroche A, puis la recherche de commune),
   comme sur grand écran depuis le 25/11. Elle ne se pose que si le lecteur la demande (« Personnaliser », Réglages),
   et jamais quand un prénom est gardé. `chemin` reste un paramètre : la règle ne dépend plus de la page. */
export function bienvenueDressee(barriere: boolean, chemin: string, demandee: boolean): boolean {
  void chemin;
  return barriere && demandee;
}
