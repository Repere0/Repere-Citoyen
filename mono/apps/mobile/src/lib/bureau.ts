/* LE MODE BUREAU (dashboard desktop, porteur, 25/11/2026). Au-dessus de 1024 px de large, sur le web seulement :
 * barre latérale à gauche au lieu de la barre d'onglets en bas, et tableau de bord sur l'accueil. En dessous,
 * l'application mobile est inchangée. Les deux seuils reprennent ceux de Tailwind (lg 1024, xl 1280) ; le porteur a
 * choisi de garder theme.ts plutôt que Tailwind (25/11/2026). */
import { Platform, useWindowDimensions } from "react-native";

export const LG = 1024, XL = 1280;
export const LARGEUR_BARRE = 240;

export const estBureau = (largeur: number, os: string = Platform.OS) => os === "web" && largeur >= LG;

export function useBureau(): { bureau: boolean; large: boolean } {
  const { width } = useWindowDimensions();
  return { bureau: estBureau(width), large: estBureau(width) && width >= XL };
}
