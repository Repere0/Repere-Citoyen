/* LA BARRE D'ONGLETS FLOTTANTE (polish, porteur, 25/11/2026). Sur le web (PWA), la barre du bas devient translucide
 * et floutée : le contenu passe dessous. Il faut donc que chaque écran d'onglet garde, en bas, la hauteur de la barre
 * en marge : ce contexte la donne (0 hors des onglets et hors du web). Sur iOS et Android, la barre reste opaque et
 * dans le flux : un vrai flou natif demanderait expo-blur, une dépendance de plus, non ajoutée. */
import { createContext, useContext } from "react";
import { Platform } from "react-native";

export const BARRE_FLOTTANTE = Platform.OS === "web";
export const HauteurOnglets = createContext(0);
export const useHauteurOnglets = () => useContext(HauteurOnglets);
