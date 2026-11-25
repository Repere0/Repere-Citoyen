/* LA DROITE DE L'EN-TÊTE : la bascule clair / sombre et la roue, qui ouvre l'écran Réglages (Step Up, 25/11/2026).
 * V34 bloc 7 (audit) : la roue est un contour qui suit le thème, sans pastille noire ; la cible reste de 48 px. */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { CIBLE, PAS, couleurs, feuille } from "../lib/theme";
import { useTheme } from "../lib/themeChoix";
import { enfonce } from "./mouvement";
/* LA DROITE DE L'EN-TÊTE D'UN ONGLET (23/11/2026, audit M3) : un écran qui ajoute un bouton (partager) garde la bascule
   et les réglages. Avant, Finances et le Calendrier les perdaient : trois dessins d'en-tête différents. */
export function DroiteEnTete({ children }: { children?: ReactNode }) {
  return <View style={{ flexDirection: "row", alignItems: "center", marginRight: PAS }}>{children}<BoutonReglages /></View>;
}

export function BoutonReglages() {
  const { mode, setChoix } = useTheme();
  const versClair = mode === "sombre";
  return (
    <>
      {/* 12/11/2026 (porteur) : une bascule directe clair / sombre, visible sur tous les onglets. */}
      <Pressable
        onPress={() => setChoix(versClair ? "clair" : "sombre")}
        accessibilityRole="button"
        accessibilityLabel={versClair ? "Passer en mode clair" : "Passer en mode sombre"}
        style={({ pressed }) => [s.roue, pressed && enfonce(true)]}
      >
        <Ionicons name={versClair ? "sunny-outline" : "moon-outline"} size={22} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
      </Pressable>
      {/* Step Up (25/11/2026) : la roue ouvre l'écran Réglages (app/reglages.tsx), plus une fenêtre de huit boutons. */}
      <Pressable
        onPress={() => router.push("/reglages")}
        accessibilityRole="link"
        accessibilityLabel="Réglages"
        style={({ pressed }) => [s.roue, pressed && enfonce(true)]}
      >
        <Ionicons name="settings-outline" size={22} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
      </Pressable>
    </>
  );
}

const s = feuille(() => StyleSheet.create({
  /* 23/11/2026 (audit M3) : sans cercle, comme les boutons de l'accueil ; un seul dessin d'en-tête dans toute l'application. */
  roue: { minWidth: CIBLE, minHeight: CIBLE, borderRadius: CIBLE / 2, alignItems: "center", justifyContent: "center" },
}));
