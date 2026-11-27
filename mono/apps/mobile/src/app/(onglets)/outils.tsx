/* LES OUTILS CITOYENS (porteur, 27/11/2026) : les sites et applications de l'administration, regroupés par catégorie.
 * La liste est embarquée (src/lib/outils-citoyens.json) : rien n'est demandé au réseau pour l'afficher. Repère
 * n'envoie rien à ces services ; un lien n'ouvre le service que si le lecteur le touche. Pas de logo (marques de
 * l'État et des caisses, Repère ne leur est pas affilié) : un pictogramme décoratif par catégorie, et le nom écrit. */
import { useMemo, useState } from "react";
import { Linking, Platform, Pressable, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { dateFr } from "@repere/core";
import LISTE from "../../lib/outils-citoyens.json";
import { aUneApp, filtrerOutils, lienApp, parCategorie, systemeMobile, type Outil, type Systeme } from "../../lib/outils";
import { Vide } from "../../lib/composants";
import { estIos } from "../../lib/installation";
import { useBureau } from "../../lib/bureau";
import { CIBLE, couleurs, PAS, POLICE, RAYON, TYPO } from "../../lib/theme";
import { useTeinteOutil } from "../../lib/couleur-outil";
import { Page, Question } from "../../ui/page";
import { enfonce } from "../../ui/mouvement";
import { niveauTitre } from "../../ui/titre";

const OUTILS = LISTE.outils as Outil[];
const ICONE: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Identité et connexion": "id-card-outline", "Démarches et droits": "document-text-outline", "Impôts": "calculator-outline",
  "Santé": "medkit-outline", "Aides et famille": "people-outline", "Emploi et formation": "briefcase-outline",
};

function systemeDeLAppareil(): Systeme {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  return systemeMobile(ua, estIos(ua, navigator.platform || "", navigator.maxTouchPoints || 0));
}

/* LA CARTE (27/11/2026, soir, porteur) : toute la carte est UN lien vers le site officiel ; le bouton « Site web »
   a disparu. « Télécharger l'app » reste, À PART, sous le lien : un bouton dans un lien serait deux commandes
   imbriquées (lecteur d'écran et clavier s'y perdent, et un toucher ouvrirait les deux). La teinte de la
   catégorie (ADR 0014) habille la pastille et le filet du haut ; le nom de la catégorie reste écrit. */
function CarteOutil({ o, systeme, bureau, teinte }: { o: Outil; systeme: Systeme; bureau: boolean; teinte: string | null }) {
  const app = aUneApp(o) ? lienApp(o, systeme) : null;
  return (
    /* Sur bureau, des cartes de 300 px au moins côte à côte ; sur téléphone, en colonne, à la hauteur de leur contenu
     (un flexBasis en colonne fixe une HAUTEUR : 300 px de vide mesurés à 390 px). */
    <View testID={`outil-${o.id}`} style={{ ...(bureau ? { flexGrow: 1, flexBasis: 300 } : null), borderRadius: RAYON.carte, overflow: "hidden",
      backgroundColor: couleurs.carte, borderWidth: 1, borderColor: couleurs.trait, borderTopWidth: teinte ? 4 : 1, borderTopColor: teinte || couleurs.trait }}>
      <Pressable onPress={() => Linking.openURL(o.url_web)} accessibilityRole="link" testID={`lien-${o.id}`}
        accessibilityLabel={`${o.nom}, site officiel, ouvre un site externe`}
        style={({ pressed }) => ({ ...(bureau ? { flexGrow: 1 } : null), minHeight: CIBLE, gap: PAS * 2, padding: PAS * 4, ...enfonce(pressed) })}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 3 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: teinte || couleurs.sol }}>
            <Ionicons name={ICONE[o.categorie] || "apps-outline"} size={20} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[TYPO.corps, { fontFamily: POLICE.titre, color: couleurs.encre }]} {...niveauTitre(3)}>{o.nom}</Text>
            <Text style={TYPO.micro}>{o.categorie}</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
        </View>
        <Text style={[TYPO.note, bureau && { flexGrow: 1 }]}>{o.description_simple}</Text>
      </Pressable>
      {app ? (
        <Pressable onPress={() => Linking.openURL(app.url)} accessibilityRole="link" testID={`app-${o.id}`}
          accessibilityLabel={`Télécharger l'application ${o.nom_app || o.nom}, ouvre ${app.vers}`}
          style={({ pressed }) => ({ minHeight: CIBLE, paddingHorizontal: PAS * 4, flexDirection: "row", alignItems: "center", gap: PAS * 2,
            borderTopWidth: 1, borderTopColor: couleurs.trait, ...enfonce(pressed) })}>
          <Ionicons name="download-outline" size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
          <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.encre }]}>Télécharger l'app ↗</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function Outils() {
  const [recherche, setRecherche] = useState("");
  const { bureau } = useBureau();
  const systeme = useMemo(systemeDeLAppareil, []);
  const teinteDe = useTeinteOutil();
  const groupes = parCategorie(filtrerOutils(OUTILS, recherche), LISTE.categories);
  return (
    <Page sansDate>
      <Question etiquette="Services publics" question="Les outils citoyens"
        sous="Les sites et applications officiels de l'administration, au même endroit. Repère ne vous connecte à rien : chaque lien ouvre le service lui-même." />
      <View style={{ justifyContent: "center" }}>
        <TextInput value={recherche} onChangeText={setRecherche} placeholder="Impôts, santé, emploi..."
          placeholderTextColor={couleurs.sourd} accessibilityLabel="Rechercher un outil citoyen" autoCorrect={false}
          style={{ minHeight: 48, borderWidth: 1, borderColor: couleurs.trait, borderRadius: 999, paddingHorizontal: 16, paddingRight: recherche ? 96 : 16,
            color: couleurs.encre, backgroundColor: couleurs.carte, fontSize: 16 }} />
        {recherche.length > 0 ? (
          <Pressable onPress={() => setRecherche("")} accessibilityRole="button" accessibilityLabel="Effacer la recherche"
            style={({ pressed }) => ({ position: "absolute", right: 4, minHeight: 44, paddingHorizontal: 16, borderRadius: 999, justifyContent: "center", ...enfonce(pressed) })}>
            <Text style={[TYPO.note, { color: couleurs.encre }]}>Effacer</Text>
          </Pressable>
        ) : null}
      </View>
      {groupes.length === 0 ? (
        <Vide icone="search-outline" titre={`Aucun service ne correspond à « ${recherche.trim()} ».`}
          corps="Essayez un autre mot, ou cherchez votre démarche sur le site officiel de l'administration."
          lien={{ texte: "Ouvrir Service Public", url: "https://www.service-public.gouv.fr" }} />
      ) : groupes.map(g => (
        <View key={g.categorie} style={{ gap: PAS * 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
            <Ionicons name={ICONE[g.categorie] || "apps-outline"} size={20} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
            <Text style={TYPO.etiquette} {...niveauTitre(2)}>{g.categorie}</Text>
          </View>
          <View style={{ flexDirection: bureau ? "row" : "column", flexWrap: "wrap", gap: PAS * 3 }}>
            {g.outils.map(o => <CarteOutil key={o.id} o={o} systeme={systeme} bureau={bureau} teinte={teinteDe(o.categorie)} />)}
          </View>
        </View>
      ))}
      <Text style={TYPO.micro}>
        Liste établie par Repère, qui n'est affilié à aucun de ces services. Catégories dans un ordre fixe, services par ordre alphabétique. Adresses vérifiées le {dateFr(LISTE.verifie_le)}.
      </Text>
    </Page>
  );
}
