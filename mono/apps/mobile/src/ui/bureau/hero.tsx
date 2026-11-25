/* LE BLOC D'ACCUEIL DU BUREAU (porteur, 25/11/2026, seconde passe « Pro »).
 * Une phrase qui dit ce qu'est Repère, la recherche de commune (la même que sur le téléphone, passée en enfant),
 * la date des données (invariant 9) et « Faire le tour » : trois étapes côte à côte, ouvertes d'office à la première
 * visite. Les fermer écrit le profil sans prénom (passer) : elles ne se rouvrent plus d'elles-mêmes, mais le bouton
 * reste. Sur téléphone, ce composant ne fait que rendre ses enfants. */
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CIBLE, PAS, POLICE, RAYON, TYPO, couleurs } from "../../lib/theme";
import { useProfil } from "../../lib/profil";
import { TRANSITION } from "../../lib/bureau";
import { DatePublication } from "../fraicheur";
import { enfonce } from "../mouvement";
import { niveauTitre } from "../titre";

const ETAPES = [
  { icone: "business-outline", titre: "Qui décide chez vous", corps: "Votre maire, votre député, vos sénateurs : leurs noms et ce qu'ils votent, d'après les sources officielles." },
  { icone: "wallet-outline", titre: "Où va votre argent", corps: "Le budget de votre commune ramené à un habitant : salaires, investissements, autres dépenses." },
  { icone: "document-text-outline", titre: "D'où viennent les chiffres", corps: "Chaque chiffre dit sa source et sa date. Repère ne donne pas d'avis : il montre, vous jugez." },
] as const;

export function HeroBureau({ actif, children }: { actif: boolean; children: ReactNode }) {
  const { profil, passer } = useProfil();
  const [tour, setTour] = useState<boolean | null>(null);
  if (!actif) return <>{children}</>;
  const ouvert = tour ?? !profil;
  const fermer = () => { if (!profil) passer(); setTour(false); };
  return (
    <View testID="hero" style={{ gap: PAS * 8, paddingTop: PAS * 10, paddingBottom: PAS * 2 }}>
      <View style={{ gap: PAS * 3, maxWidth: 880 }}>
        {/* hors échelle : titre du bureau, 56 px (porteur : des titres plus grands sur ordinateur). */}
        {/* Refonte premium : grand mais fin (demi-gras), interlettrage serré. */}
        <Text style={{ fontFamily: POLICE.donneeForte, fontSize: 48 /* hors échelle : titre du bureau, porteur 25/11/2026 */, lineHeight: 56, letterSpacing: -1.4, color: couleurs.encre }} {...niveauTitre(1)}>
          Comprenez qui décide chez vous, et où va votre argent.
        </Text>
        <Text style={[TYPO.section, { fontFamily: POLICE.texte, color: couleurs.sourd, maxWidth: 640 }]}>
          Les données publiques de votre commune, de l'Assemblée et du Sénat. Chaque chiffre est daté et sourcé.
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 4, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 420, maxWidth: 720 }}>{children}</View>
        <Pressable onPress={() => setTour(!ouvert)} accessibilityRole="button" testID="faire-le-tour" accessibilityState={{ expanded: ouvert }}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: PAS * 2,
            paddingHorizontal: PAS * 5, borderRadius: RAYON.bloc, backgroundColor: hovered || ouvert ? couleurs.voile : "transparent" }, TRANSITION, pressed && enfonce(true)]}>
          <Ionicons name={ouvert ? "close-outline" : "compass-outline"} size={20} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
          <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.encre }]}>{ouvert ? "Fermer le tour" : "Comment ça marche"}</Text>
        </Pressable>
      </View>
      <DatePublication />
      {ouvert ? (
        <View testID="tour-guide" style={{ gap: PAS * 4 }}>
        <View style={{ flexDirection: "row", gap: PAS * 4 }}>
          {ETAPES.map((e, i) => (
            <View key={e.titre} style={{ flex: 1, gap: PAS * 3, padding: PAS * 6, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, borderWidth: 1, borderColor: couleurs.trait }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
                <Ionicons name={e.icone} size={20} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
                <Text style={[TYPO.note, { fontFamily: POLICE.texteMoyen }]}>Étape {i + 1} sur 3</Text>
              </View>
              <Text style={[TYPO.section, { fontFamily: POLICE.titre }]} {...niveauTitre(2)}>{e.titre}</Text>
              <Text style={[TYPO.corps, { color: couleurs.sourd }]}>{e.corps}</Text>
            </View>
          ))}
        </View>
          <View style={{ alignItems: "flex-end" }}>
            <Pressable onPress={fermer} accessibilityRole="button" testID="tour-passer"
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [{ minHeight: CIBLE, paddingHorizontal: PAS * 6, borderRadius: RAYON.bloc, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.encre, opacity: hovered ? 0.88 : 1 }, TRANSITION, pressed && enfonce(true)]}>
              <Text style={[TYPO.corps, { color: couleurs.sol, fontFamily: POLICE.texteMoyen }]}>J'ai compris</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
