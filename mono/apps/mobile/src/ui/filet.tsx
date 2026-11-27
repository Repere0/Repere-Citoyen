/* LE FILET D'ERREURS (27/11/2026, audit V1 : « une erreur de rendu laissait une page blanche »).
 *
 * expo-router affiche ce composant quand un écran plante (ErrorBoundary exporté par app/_layout.tsx). Il ne dépend
 * d'AUCUN fournisseur de l'application (thème, profil, données) : c'est peut-être l'un d'eux qui a planté. Il dit une
 * phrase vraie (doctrine du vide, invariant 5), rassure sur ce qui est gardé (les deux clés de l'appareil ne sont pas
 * touchées) et donne trois gestes : réessayer, revenir à l'accueil, signaler (par la messagerie du lecteur, sans
 * traceur). */
import Constants from "expo-constants";
import { Linking, Platform, Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { NEUTRES_FILET } from "../lib/palette";
import { COURRIEL_AVIS, lienSignalement } from "../lib/avis";
import { MARQUE_DEFILEMENT } from "../lib/defilement-ios";

export function FiletErreur({ error, retry }: ErrorBoundaryProps) {
  const c = NEUTRES_FILET[useColorScheme() === "dark" ? "sombre" : "clair"];
  const chemin = Platform.OS === "web" && typeof window !== "undefined" ? window.location.pathname : "";
  const accueil = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") { window.location.assign("/"); return; }
    retry();
  };
  const signaler = () => {
    if (!COURRIEL_AVIS) return;
    const lien = lienSignalement(COURRIEL_AVIS, { version: Constants.expoConfig?.version || "inconnue", date: new Date(), chemin, erreur: error?.message || String(error),
      navigateur: Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.userAgent : null });
    if (Platform.OS === "web" && typeof window !== "undefined") window.location.href = lien; else Linking.openURL(lien).catch(() => {});
  };
  const bouton = (texte: string, action: () => void, plein: boolean, id: string) => (
    <Pressable onPress={action} accessibilityRole="button" testID={id}
      style={({ pressed }) => ({ minHeight: 48, borderRadius: 12, paddingHorizontal: 24, alignItems: "center", justifyContent: "center",
        backgroundColor: plein ? c.encre : "transparent", borderWidth: plein ? 0 : 1, borderColor: c.trait, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ fontSize: 16, fontWeight: "600", color: plein ? c.sol : c.encre }}>{texte}</Text>
    </Pressable>
  );
  return (
    <ScrollView {...MARQUE_DEFILEMENT} style={{ flex: 1, backgroundColor: c.sol }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
      <View testID="filet-erreur" accessibilityRole="alert" style={{ maxWidth: 480, width: "100%", alignSelf: "center", gap: 16, padding: 24, borderRadius: 16, backgroundColor: c.carte, borderWidth: 1, borderColor: c.trait }}>
        <Text accessibilityRole="header" style={{ fontSize: 20, lineHeight: 28, fontWeight: "700", color: c.encre }}>Cet écran n'a pas pu s'afficher.</Text>
        <Text style={{ fontSize: 16, lineHeight: 24, color: c.encre }}>
          Repère a rencontré une erreur. Votre commune et vos réglages restent gardés sur cet appareil : rien n'est perdu.
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.sourd }}>Réessayer suffit souvent. Si l'erreur revient, la signaler aide à la corriger.</Text>
        <View style={{ gap: 8 }}>
          {bouton("Réessayer", retry, true, "filet-reessayer")}
          {bouton("Revenir à l'accueil", accueil, false, "filet-accueil")}
          {COURRIEL_AVIS ? bouton("Signaler l'erreur", signaler, false, "filet-signaler") : null}
        </View>
      </View>
    </ScrollView>
  );
}
