/* LA BARRE LATÉRALE DU BUREAU (porteur, 25/11/2026). Remplace la barre d'onglets en bas quand l'écran fait 1024 px
 * ou plus (lib/bureau.ts). Les mêmes destinations que l'application, rien de plus ; en bas, Réglages et Soutenir.
 * L'entrée active est marquée par un fond neutre et aria-current, jamais par une couleur de vote ou de parti. */
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CIBLE, PAS, POLICE, RAYON, TYPO, couleurs } from "../../lib/theme";
import { LARGEUR_BARRE } from "../../lib/bureau";
import { useTheme } from "../../lib/themeChoix";
import { Logo } from "../logo";
import { MARQUE_DEFILEMENT } from "../../lib/defilement-ios";
import { enfonce } from "../mouvement";

type Icone = keyof typeof Ionicons.glyphMap;
export const ENTREES: { chemin: string; texte: string; icone: Icone; actif?: (c: string) => boolean }[] = [
  { chemin: "/", texte: "Tableau de bord", icone: "grid-outline", actif: c => c === "/" },
  { chemin: "/chez-vous", texte: "Ma commune", icone: "location-outline" },
  { chemin: "/qui-decide", texte: "Qui décide", icone: "business-outline" },
  { chemin: "/finances", texte: "Finances", icone: "wallet-outline" },
  { chemin: "/scrutins", texte: "Le Parlement", icone: "megaphone-outline" },
  { chemin: "/a-venir", texte: "Le calendrier", icone: "calendar-outline" },
  { chemin: "/presidentielle-2027", texte: "Présidentielle 2027", icone: "flag-outline" },
  { chemin: "/quiz", texte: "Quiz civique", icone: "school-outline" },
  { chemin: "/dictionnaire", texte: "Dictionnaire", icone: "book-outline" },
];
const BAS: typeof ENTREES = [
  { chemin: "/reglages", texte: "Réglages", icone: "settings-outline" },
  { chemin: "/soutenir", texte: "Soutenir Repère", icone: "heart-outline" },
];

function Entree({ e, chemin }: { e: (typeof ENTREES)[number]; chemin: string }) {
  const actif = e.actif ? e.actif(chemin) : chemin === e.chemin || chemin.startsWith(e.chemin + "/");
  return (
    <Pressable onPress={() => router.navigate(e.chemin as never)} accessibilityRole="link" accessibilityLabel={e.texte}
      aria-current={actif ? "page" : undefined} testID={`barre-${e.chemin.replace(/\W/g, "") || "accueil"}`}
      style={({ pressed }) => [{ minHeight: CIBLE, flexDirection: "row", alignItems: "center", gap: PAS * 3, paddingHorizontal: PAS * 3,
        borderRadius: RAYON.bloc, backgroundColor: actif ? couleurs.voile : "transparent" }, pressed && enfonce(true)]}>
      <Ionicons name={actif ? (e.icone.replace("-outline", "") as Icone) : e.icone} size={20} color={actif ? couleurs.encre : couleurs.sourd} accessible={false} importantForAccessibility="no" />
      <Text style={[TYPO.corps, { color: actif ? couleurs.encre : couleurs.sourd, fontFamily: actif ? POLICE.section : POLICE.texteMoyen }]}>{e.texte}</Text>
    </Pressable>
  );
}

export function BarreLaterale() {
  const chemin = usePathname();
  const { mode, setChoix } = useTheme();
  return (
    <View testID="barre-laterale" accessibilityRole="navigation" aria-label="Navigation principale"
      style={{ width: LARGEUR_BARRE, borderRightWidth: 1, borderRightColor: couleurs.trait, backgroundColor: couleurs.carte }}>
      <ScrollView {...MARQUE_DEFILEMENT} contentContainerStyle={{ padding: PAS * 4, gap: PAS, flexGrow: 1 }}>
        <Pressable onPress={() => router.navigate("/")} accessibilityRole="link" accessibilityLabel="Repère, tableau de bord"
          style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: PAS * 2, minHeight: CIBLE, marginBottom: PAS * 4 }, pressed && enfonce(true)]}>
          <Logo size={28} variant={mode} />
          <Text style={{ fontFamily: POLICE.affiche, fontSize: 20, color: couleurs.encre }}>Repère</Text>
        </Pressable>
        {ENTREES.map(e => <Entree key={e.chemin} e={e} chemin={chemin} />)}
        <View style={{ flex: 1, minHeight: PAS * 6 }} />
        <View style={{ height: 1, backgroundColor: couleurs.trait, marginVertical: PAS * 2 }} />
        {BAS.map(e => <Entree key={e.chemin} e={e} chemin={chemin} />)}
        <Pressable onPress={() => setChoix(mode === "sombre" ? "clair" : "sombre")} accessibilityRole="button"
          accessibilityLabel={mode === "sombre" ? "Passer en mode clair" : "Passer en mode sombre"}
          style={({ pressed }) => [{ minHeight: CIBLE, flexDirection: "row", alignItems: "center", gap: PAS * 3, paddingHorizontal: PAS * 3 }, pressed && enfonce(true)]}>
          <Ionicons name={mode === "sombre" ? "sunny-outline" : "moon-outline"} size={20} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
          <Text style={[TYPO.corps, { color: couleurs.sourd, fontFamily: POLICE.texteMoyen }]}>{mode === "sombre" ? "Mode clair" : "Mode sombre"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
