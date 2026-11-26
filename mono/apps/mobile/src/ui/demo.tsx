/* Bandeau « Version démo » et bouton « Laisser un avis » (17/11/2026). Logique pure : lib/avis.ts. */
import { Linking, Platform, Pressable, Text, View } from "react-native";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CIBLE, couleurs, PAS, RAYON, TYPO } from "../lib/theme";
import { COURRIEL_AVIS, lienAvis, MODE_DEMO } from "../lib/avis";
import { enfonce } from "./mouvement";
import { router } from "expo-router";

export function ouvrirAvis() {
  if (!COURRIEL_AVIS) return;
  const navigateur = Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.userAgent : null;
  Linking.openURL(lienAvis(COURRIEL_AVIS, {
    version: Constants.expoConfig?.version || "inconnue", date: new Date(),
    plateforme: `${Platform.OS} ${String(Platform.Version ?? "")}`.trim(), navigateur,
  })).catch(() => {});
}

export function BoutonAvis({ style }: { style?: object }) {
  if (!COURRIEL_AVIS) return null;
  return (
    /* Step Up (25/11/2026) : l'avis passe par trois questions (app/avis.tsx) avant la messagerie. */
    <Pressable onPress={() => router.push("/avis")} accessibilityRole="link" testID="laisser-un-avis"
      accessibilityLabel="Laisser un avis, en trois questions"
      style={({ pressed }) => [{ minHeight: CIBLE, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: PAS * 2 }, style, pressed && enfonce(true)]}>
      <Ionicons name="chatbubble-ellipses-outline" size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
      <Text style={[TYPO.note, { color: couleurs.encre, fontWeight: "600" }]}>Laisser un avis</Text>
    </Pressable>
  );
}

/* Discret : une ligne en haut de l'application, seulement en mode démo. */
export function BandeauDemo() {
  if (!MODE_DEMO) return null;
  return (
    /* Polish (porteur, 25/11/2026) : un encart doux (fond voile, filet fin, arrondi des cartes), l'icône, le texte et
       le bouton sur une même ligne, centrés verticalement. */
    <View testID="bandeau-demo" accessibilityRole="summary"
      style={{ flexDirection: "row", alignItems: "center", gap: PAS * 3, padding: PAS * 4,
        borderRadius: RAYON.carte, backgroundColor: couleurs.voile, borderWidth: 1, borderColor: couleurs.trait }}>
      <Ionicons name="flask-outline" size={20} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
      <Text style={[TYPO.note, { flex: 1, color: couleurs.encre }]}>Version démo : vos retours nous aident.</Text>
      <BoutonAvis style={{ paddingHorizontal: PAS * 3, borderRadius: RAYON.bloc, backgroundColor: couleurs.carte, borderWidth: 1, borderColor: couleurs.trait }} />
    </View>
  );
}
