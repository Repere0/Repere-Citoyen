/* RÉGLAGES (Step Up, porteur, 25/11/2026). Un écran, plus une fenêtre de huit boutons empilés : des
 * catégories (Apparence, Confort de lecture, Mon profil, Repère, Légal), une icône par ligne, de vrais
 * interrupteurs. Tout ce qui est réglé ici s'écrit dans repere.profil, sur l'appareil, et nulle part ailleurs
 * (invariant 2) : aucune clé neuve. */
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CIBLE, PAS, RAYON, TYPO, OMBRE, couleurs, feuille } from "../lib/theme";
import { MARQUE_DEFILEMENT } from "../lib/defilement-ios";
import { useTheme } from "../lib/themeChoix";
import { useProfil } from "../lib/profil";
import { useBienvenue } from "../lib/bienvenue";
import { useBasSur } from "../ui/page";
import { niveauTitre } from "../ui/titre";
import { enfonce } from "../ui/mouvement";
import { Interrupteur } from "../ui/interrupteur";
import { BoutonAvis } from "../ui/demo";
import { ALERTES, LIBELLE_ALERTE } from "@repere/core";

const ICONE_ALERTE: Record<string, Icone> = { votes: "megaphone-outline", budgets: "wallet-outline", elections: "calendar-outline", actus: "newspaper-outline" };

type Icone = keyof typeof Ionicons.glyphMap;

function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <View style={{ gap: PAS * 2 }}>
      <Text style={[TYPO.etiquette, { paddingHorizontal: PAS }]} {...niveauTitre(2)}>{titre}</Text>
      <View style={s.carte}>{children}</View>
    </View>
  );
}

function Ligne({ icone, texte, onPress, testID, role = "link" }: { icone: Icone; texte: string; onPress: () => void; testID?: string; role?: "link" | "button" }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={role} accessibilityLabel={texte} testID={testID}
      style={({ pressed }) => [s.ligne, pressed && enfonce(true)]}>
      <Ionicons name={icone} size={20} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
      <Text style={[TYPO.corps, { flex: 1 }]}>{texte}</Text>
      <Ionicons name="chevron-forward" size={20} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
    </Pressable>
  );
}

const Filet = () => <View style={{ height: 1, backgroundColor: couleurs.trait }} />;

export default function Reglages() {
  const { choix, mode, setChoix } = useTheme();
  const { profil, modifier } = useProfil();
  const { ouvrir: ouvrirBienvenue } = useBienvenue();
  const bas = useBasSur();
  const systeme = choix === "systeme";
  return (
    <ScrollView {...MARQUE_DEFILEMENT} style={{ flex: 1, backgroundColor: couleurs.sol }}
      contentContainerStyle={{ padding: PAS * 4, paddingBottom: bas, gap: PAS * 6, maxWidth: 640, width: "100%", alignSelf: "center" }}>
      <Stack.Screen options={{ title: "Réglages" }} />
      <Text style={TYPO.question} {...niveauTitre(1)}>Réglages</Text>

      <Groupe titre="Apparence">
        <Interrupteur icone="phone-portrait-outline" texte="Suivre le téléphone" aide="Clair ou sombre, comme le reste de l'appareil."
          actif={systeme} onPress={() => setChoix(systeme ? mode : "systeme")} />
        <Filet />
        <Interrupteur icone="moon-outline" texte="Mode sombre" actif={mode === "sombre"} desactive={systeme}
          onPress={() => setChoix(mode === "sombre" ? "clair" : "sombre")} />
      </Groupe>

      <Groupe titre="Confort de lecture">
        <Interrupteur icone="pause-circle-outline" texte="Réduire les animations" actif={!!profil?.animationsReduites}
          onPress={() => modifier({ animationsReduites: !profil?.animationsReduites })} />
        <Filet />
        <Interrupteur icone="color-palette-outline" texte="Couleurs pour daltoniens" actif={!!profil?.modeDaltonien}
          onPress={() => modifier({ modeDaltonien: !profil?.modeDaltonien })} />
        <Filet />
        <Ligne icone="text-outline" texte="Taille, espacement et contraste" onPress={() => router.push("/confort-lecture")} />
      </Groupe>

      {/* ADR 0013 (25/11/2026) : des alertes locales, sans notification poussée ni serveur. Le bandeau de l'accueil dit,
          à chaque ouverture, ce qui a été publié ces 7 jours sur les sujets cochés ici. */}
      <Groupe titre="Mes alertes">
        <Text style={[TYPO.note, { paddingVertical: PAS * 2 }]}>À l'ouverture, l'accueil vous dit ce qui a été publié sur ces sujets. Rien n'est envoyé.</Text>
        {(ALERTES as string[]).map(a => {
          const choisis = profil?.alertes || [];
          const actif = choisis.includes(a);
          return (
            <View key={a}>
              <Filet />
              <Interrupteur icone={ICONE_ALERTE[a]} texte={LIBELLE_ALERTE[a as keyof typeof LIBELLE_ALERTE]} actif={actif}
                onPress={() => modifier({ alertes: actif ? choisis.filter(x => x !== a) : [...choisis, a] })} />
            </View>
          );
        })}
      </Groupe>

      <Groupe titre="Mon profil">
        {/* 14/11/2026 (porteur) : le prénom est vidé, la bienvenue le redemande ; rien d'autre ne bouge. */}
        <Ligne icone="person-outline" role="button" testID="changer-prenom"
          texte={profil?.prenom ? `Changer de prénom (${profil.prenom})` : "Choisir un prénom"}
          onPress={() => { modifier({ prenom: "" }); ouvrirBienvenue(); }} />
        <Filet />
        <Ligne icone="location-outline" texte="Changer de commune" onPress={() => router.push("/")} />
      </Groupe>

      <Groupe titre="Repère">
        {/* 17/11/2026 : l'avis par la messagerie du lecteur ; absent si aucune adresse n'est réglée. */}
        <BoutonAvis style={{ justifyContent: "flex-start", paddingVertical: PAS }} />
        <Ligne icone="heart-outline" texte="Soutenir Repère" onPress={() => router.push("/soutenir")} />
        <Filet />
        <Ligne icone="help-circle-outline" texte="Questions fréquentes" onPress={() => router.push("/faq")} />
        <Filet />
        <Ligne icone="information-circle-outline" texte="À propos" onPress={() => router.push("/a-propos")} />
      </Groupe>

      <Groupe titre="Légal">
        <Ligne icone="lock-closed-outline" texte="Confidentialité" onPress={() => router.push("/confidentialite")} />
        <Filet />
        {/* 17/11/2026 : obligatoires (LCEN, art. 1-1, et magasins d'applications). */}
        <Ligne icone="document-text-outline" texte="Mentions légales" onPress={() => router.push("/mentions-legales")} />
      </Groupe>
    </ScrollView>
  );
}

const s = feuille(() => StyleSheet.create({
  carte: { backgroundColor: couleurs.carte, borderRadius: RAYON.carte, paddingHorizontal: PAS * 4, paddingVertical: PAS, ...OMBRE },
  ligne: { minHeight: CIBLE + 8, flexDirection: "row", alignItems: "center", gap: PAS * 3 },
}));
