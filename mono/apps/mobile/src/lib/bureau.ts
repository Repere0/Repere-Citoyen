/* LE MODE BUREAU (dashboard desktop, porteur, 25/11/2026). Au-dessus de 1024 px de large, sur le web seulement :
 * barre latérale à gauche au lieu de la barre d'onglets en bas, et tableau de bord sur l'accueil. En dessous,
 * l'application mobile est inchangée. Les deux seuils reprennent ceux de Tailwind (lg 1024, xl 1280) ; le porteur a
 * choisi de garder theme.ts plutôt que Tailwind (25/11/2026). */
import { Platform, useWindowDimensions } from "react-native";

export const LG = 1024, XL = 1280;
export const LARGEUR_BARRE = 264;

export const estBureau = (largeur: number, os: string = Platform.OS) => os === "web" && largeur >= LG;

export function useBureau(): { bureau: boolean; large: boolean } {
  const { width } = useWindowDimensions();
  return { bureau: estBureau(width), large: estBureau(width) && width >= XL };
}

/* Transitions douces au survol (200 ms), sur le web seulement ; ailleurs, rien. */
export const TRANSITION: object = Platform.OS === "web"
  ? { transitionProperty: "background-color, border-color, color, opacity, transform", transitionDuration: "200ms", transitionTimingFunction: "ease-out" }
  : {};

/* LES PAGES DE DÉTAIL SUR ORDINATEUR (porteur, 25/11/2026) : deux colonnes de lecture, comme une page de magazine.
   Le contenu coule de haut en bas dans la première colonne, puis dans la seconde : l'ordre de lecture ne change pas,
   et aucun bloc n'est coupé entre deux colonnes. Le style est posé une fois, par une feuille du navigateur. */
export function poserStylesBureau() {
  if (Platform.OS !== "web" || typeof document === "undefined" || document.getElementById("repere-bureau")) return;
  const el = document.createElement("style");
  el.id = "repere-bureau";
  el.textContent = [
    '[data-bureau-colonnes="1"]{display:block!important;column-count:2;column-gap:56px}',
    '[data-bureau-colonnes="1"]>*{break-inside:avoid;margin-bottom:24px}',
  ].join("\n");
  document.head.appendChild(el);
}

/* MICRO-INTERACTIONS (polish, porteur, 25/11/2026) : sur le web, tout ce qui se touche (bouton, lien, onglet, case,
   interrupteur) change de fond, de filet ou d'opacité en 200 ms, au lieu de sauter. Rien si le lecteur a demandé
   moins de mouvement (préférence du système). */
export function poserStylesWeb() {
  if (Platform.OS !== "web" || typeof document === "undefined" || document.getElementById("repere-transitions")) return;
  const el = document.createElement("style");
  el.id = "repere-transitions";
  el.textContent = '@media (prefers-reduced-motion: no-preference){[role="button"],[role="link"],[role="tab"],[role="switch"],[role="radio"],[role="checkbox"]{transition:background-color 200ms ease-out,border-color 200ms ease-out,opacity 200ms ease-out,transform 200ms ease-out,box-shadow 200ms ease-out}}';
  document.head.appendChild(el);
}
