/* Le bouton « Partager » d'un ecran de contexte : il capture la carte correspondante
   (hors ecran) puis la partage (partager.ts). Le texte de repli est fourni ; le lien est celui de la page
   ouverte, la commune apres le « # » (23/11/2026). Le resultat est dit a l'ecran : jamais un clic muet. */
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentRef, ReactNode, RefObject } from "react";
import { Pressable, Text, View } from "react-native";
import { usePathname } from "expo-router";
import { couleurs, CIBLE, PAS, TYPO } from "../../lib/theme";
import { useSelection } from "../../lib/selection";
import { slugDe } from "../../lib/adresse-web";
import { lienPublic } from "../../lib/adresse-publique";
import { MESSAGE_RESULTAT } from "./partager";
import { usePartageStory } from "./use-partage-story";
import { enfonce } from "../mouvement";

export function PartagerCarte({ etiquette, repli, rendu, libelle = "Partager", icone, lien }: {
  etiquette: string; repli: string; rendu: (ref: RefObject<ComponentRef<typeof View> | null>) => ReactNode;
  /* V55 : libellé du bouton (« Partager ma story » sur la page du Repère du jour) */
  libelle?: string;
  /* 13/11/2026 : une icône à côté du libellé, là où le bouton doit attirer l'œil (fin de manche du quiz). */
  icone?: keyof typeof Ionicons.glyphMap;
  /* Le lien qui accompagne l'image ; par défaut, la page ouverte. */
  lien?: string;
}) {
  const chemin = usePathname();
  const { choix } = useSelection();
  const { carte, partager, resultat } = usePartageStory(repli, lien ?? lienPublic(chemin, slugDe(choix ? choix.insee : null)));
  const message = resultat ? MESSAGE_RESULTAT[resultat] : "";
  return (
    <>
      <Pressable onPress={partager} accessibilityRole="button" accessibilityLabel={etiquette}
        style={({ pressed }) => ({ minHeight: CIBLE, borderRadius: 14, borderWidth: 1, borderColor: couleurs.trait,
          backgroundColor: couleurs.carte, alignItems: "center", justifyContent: "center", paddingHorizontal: PAS * 4, ...enfonce(pressed) })}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
          {icone ? <Ionicons name={icone} size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" /> : null}
          <Text style={{ color: couleurs.encre, fontWeight: "500" }}>{libelle}</Text>
        </View>
      </Pressable>
      {message ? <Text style={TYPO.note} accessibilityLiveRegion="polite" testID="partage-resultat">{message}</Text> : null}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", left: -10000, top: 0 }}>
        {rendu(carte)}
      </View>
    </>
  );
}
