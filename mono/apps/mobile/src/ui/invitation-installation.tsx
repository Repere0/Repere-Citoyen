/* LE BANDEAU « INSTALLER REPÈRE » (porteur, 27/11/2026), au-dessus de la barre d'onglets, sur téléphone, dans le
 * navigateur. Règles et cas : lib/installation.ts. Il entre une fois, en douceur (rien si « Réduire les animations »),
 * se ferme par « Plus tard », et ne revient qu'à la prochaine ouverture de l'application. */
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { CIBLE, couleurs, PAS, POLICE, RAYON, TYPO } from "../lib/theme";
import { useBureau } from "../lib/bureau";
import { useTheme } from "../lib/themeChoix";
import { abonner, estAutonome, installationPossible, installerAndroid, invitationAndroid, refuseeCetteFois, refuserCetteFois, vientDEtreInstallee } from "../lib/installation";
import { Logo } from "./logo";
import { enfonce, useMouvementReduit } from "./mouvement";

/* `surHauteur` : la hauteur occupée (0 quand rien n'est montré), pour que la marge du bas des écrans laisse le dernier
   élément lisible au-dessus du bandeau au lieu de passer dessous. */
export function InvitationInstallation({ bas, surHauteur }: { bas: number; surHauteur?: (h: number) => void }) {
  const { bureau } = useBureau();
  const { mode } = useTheme();
  const reduit = useMouvementReduit();
  const [, rafraichir] = useState(0);
  useEffect(() => abonner(() => rafraichir(n => n + 1)), []);
  const quoi = Platform.OS !== "web" || typeof navigator === "undefined" || refuseeCetteFois() || vientDEtreInstallee() ? null
    : installationPossible({ ua: navigator.userAgent, plateforme: navigator.platform, pointsTactiles: navigator.maxTouchPoints || 0, autonome: estAutonome(), invite: !!invitationAndroid(), large: bureau });
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!quoi) return;
    if (reduit) { v.setValue(1); return; }
    const a = Animated.timing(v, { toValue: 1, duration: 260, delay: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [quoi, reduit, v]);
  useEffect(() => { if (!quoi) surHauteur?.(0); }, [quoi, surHauteur]);
  if (!quoi) return null;
  const principal = quoi === "android"
    ? { texte: "Installer", aide: "Installer Repère sur l'écran d'accueil", action: () => { installerAndroid(); } }
    : { texte: "Comment faire", aide: "Comment installer Repère sur l'écran d'accueil", action: () => router.push("/installer") };
  return (
    <Animated.View testID="invitation-installation" accessibilityRole="none" aria-label="Installer Repère"
      onLayout={e => surHauteur?.(Math.ceil(e.nativeEvent.layout.height) + PAS * 2)}
      style={{ position: "absolute", left: PAS * 3, right: PAS * 3, bottom: bas + PAS * 2, opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      <View style={{ gap: PAS * 3, padding: PAS * 3, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, borderWidth: 1, borderColor: couleurs.trait }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 3 }}>
        <Logo size={40} variant={mode} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[TYPO.corps, { fontFamily: POLICE.titre }]}>Repère sur votre écran d'accueil</Text>
          <Text style={TYPO.note}>Il s'ouvre comme une application, même sans réseau.</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: PAS * 2 }}>
        <Pressable onPress={() => refuserCetteFois()} accessibilityRole="button" accessibilityLabel="Plus tard, masquer l'invitation à installer" testID="installation-plus-tard"
          style={({ pressed }) => ({ flex: 1, minHeight: CIBLE, borderRadius: RAYON.bloc, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: couleurs.trait, ...enfonce(pressed) })}>
          <Text style={[TYPO.corps, { fontFamily: POLICE.section }]}>Plus tard</Text>
        </Pressable>
        <Pressable onPress={principal.action} accessibilityRole="button" accessibilityLabel={principal.aide} testID="installation-principal"
          style={({ pressed }) => ({ flex: 1, minHeight: CIBLE, borderRadius: RAYON.bloc, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.encre, ...enfonce(pressed) })}>
          <Text style={[TYPO.corps, { fontFamily: POLICE.section, color: couleurs.sol }]}>{principal.texte}</Text>
        </Pressable>
      </View>
      </View>
    </Animated.View>
  );
}
