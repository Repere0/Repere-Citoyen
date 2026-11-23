/* OUVRIR LA BIENVENUE À LA DEMANDE (23/11/2026, porteur, ADR 0012).
 *
 * Un lien partagé ouvre son contenu sans passer par les trois écrans de bienvenue. Le lecteur arrivé ainsi
 * voit un bandeau discret ; le bouton « Personnaliser » pose la bienvenue par-dessus la page, comme à
 * l'accueil. Rien n'est gardé : l'état vit en mémoire, le temps de la session. */
import { createContext, useContext } from "react";

export const ContexteBienvenue = createContext<{ ouvrir: () => void }>({ ouvrir: () => {} });
export const useBienvenue = () => useContext(ContexteBienvenue);

/* La règle, en une fonction (gardée par tests/chaine.test.mjs) : la bienvenue couvre l'écran quand aucun prénom
   n'est gardé ET que l'on est sur l'accueil (ouverture directe), ou que le lecteur l'a demandée. Sur toute autre
   page (un lien partagé, la confidentialité), le contenu passe d'abord. */
export function bienvenueDressee(barriere: boolean, chemin: string, demandee: boolean): boolean {
  return barriere && (chemin === "/" || demandee);
}
