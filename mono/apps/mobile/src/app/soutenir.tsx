/* SOUTENIR REPÈRE (13/11/2026, décision du porteur).
 *
 * Ce que cette page ne fait PAS, et ne doit jamais faire tant que l'association n'existe pas : encaisser.
 * Aucun lien de paiement, aucun formulaire, aucune adresse e-mail demandée. Le bouton est éteint et dit
 * pourquoi — appeler au don sans structure déclarée exposerait le porteur, et promettre un paiement qui
 * n'existe pas serait faux.
 *
 * Les promesses écrites ici sont vérifiables dans l'application : pas de publicité, pas de traceur, pas de
 * compte. Si l'une d'elles cessait d'être vraie, c'est cette page qu'il faudrait corriger en premier. */
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { enfonce } from "../ui/mouvement";
import { lienPublic } from "../lib/adresse-publique";
import { MESSAGE_RESULTAT, partager, type Resultat } from "../ui/partage/partager";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Carte } from "../lib/composants";
import { Page, Question } from "../ui/page";
import { CIBLE, couleurs, PAS, POLICE, RAYON, TYPO } from "../lib/theme";

/* SOUTENIR AUTREMENT, DÈS AUJOURD'HUI (porteur, 26/11/2026) : en attendant le don, trois gestes qui ne coûtent rien et
   ne collectent rien. Aucun compteur de partages, aucun remerciement chiffré (invariant 6 : rien ne récompense un
   partage). Le dépôt est public (vérifié le 26/11/2026) : le lien GitHub y mène sans compte à créer. */
/* Adresse en minuscules : GitHub les accepte, et le nom sans accent est refusé hors commentaire (conformite.test). */
export const DEPOT = "https://github.com/repere0/repere-citoyen";

function Geste({ icone, titre, corps, action, etiquette, id }: { icone: keyof typeof Ionicons.glyphMap; titre: string; corps: string; action: () => void; etiquette: string; id: string }) {
  return (
    <Pressable onPress={action} accessibilityRole="button" accessibilityLabel={etiquette} testID={id}
      style={({ pressed }) => ({ flexDirection: "row", gap: PAS * 3, alignItems: "center", minHeight: CIBLE + 16, padding: PAS * 3,
        borderRadius: RAYON.bloc, borderWidth: 1, borderColor: couleurs.trait, backgroundColor: couleurs.carte, ...enfonce(pressed) })}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: couleurs.voile, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icone} size={20} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[TYPO.corps, { fontFamily: POLICE.titre }]}>{titre}</Text>
        <Text style={TYPO.note}>{corps}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
    </Pressable>
  );
}

export default function Soutenir() {
  const [etat, setEtat] = useState<Resultat | null>(null);
  return (
    <Page sansDate>
      <Stack.Screen options={{ title: "Soutenir Repère" }} />
      <Question etiquette="Projet indépendant" question="Soutenir Repère"
        sous="Projet indépendant, sans publicité, sans traceur. Pour rester libre, nous avons besoin de vous." />

      <Carte titre="Ce que votre soutien protège">
        {[
          ["shield-checkmark-outline", "Aucune publicité", "Personne n'achète d'espace ici, donc personne n'a son mot à dire sur ce qui s'affiche."],
          ["eye-off-outline", "Aucun traceur", "Pas de mesure d'audience, pas de revente de données : il n'y a rien à revendre."],
          ["document-text-outline", "Des sources, toujours", "Relever, vérifier et republier des données officielles prend du temps tous les jours."],
        ].map(([icone, titre, corps]) => (
          <View key={titre} style={{ flexDirection: "row", gap: PAS * 3, alignItems: "flex-start" }}>
            <Ionicons name={icone as keyof typeof Ionicons.glyphMap} size={22} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[TYPO.corps, { fontFamily: POLICE.titre }]}>{titre}</Text>
              <Text style={TYPO.note}>{corps}</Text>
            </View>
          </View>
        ))}
      </Carte>

      <Carte titre="Soutenir dès aujourd'hui, sans rien payer">
        <Geste id="soutien-partager" icone="share-social-outline" titre="Faire connaître Repère"
          corps="Envoyez le lien à un proche, une classe, une association : c'est ce qui aide le plus."
          etiquette="Partager Repère" action={async () => setEtat(await partager({ texte: "Repère : qui décide chez moi, où va mon argent. Des chiffres officiels, sourcés, sans opinion.", lien: lienPublic("") }))} />
        {etat ? <Text style={TYPO.note} accessibilityLiveRegion="polite" testID="soutien-resultat">{MESSAGE_RESULTAT[etat]}</Text> : null}
        <Geste id="soutien-avis" icone="chatbubble-ellipses-outline" titre="Suggérer une amélioration"
          corps="Une erreur, un manque, une idée : votre message arrive directement au porteur du projet."
          etiquette="Suggérer une amélioration" action={() => router.push("/avis")} />
        <Geste id="soutien-github" icone="logo-github" titre="Contribuer au code"
          corps="Le code de Repère est public sur GitHub : on peut le lire, signaler un problème ou proposer une correction."
          etiquette="Contribuer au code sur GitHub (ouvre le site GitHub)" action={() => { Linking.openURL(DEPOT).catch(() => {}); }} />
      </Carte>

      {/* Bouton ÉTEINT, et qui dit pourquoi : ni lien de paiement, ni collecte, tant que l'association n'existe pas. */}
      <View accessible accessibilityRole="button" accessibilityState={{ disabled: true }} testID="don-eteint"
        accessibilityLabel="Faire un don : bientôt disponible, en attente de la création de l'association"
        style={{ minHeight: CIBLE + 8, borderRadius: RAYON.pastille, alignItems: "center", justifyContent: "center",
          backgroundColor: couleurs.voile, borderWidth: 1, borderColor: couleurs.trait }}>
        <Text style={{ fontSize: 16, fontFamily: POLICE.section, color: couleurs.sourd }}>Faire un don</Text>
      </View>
      <Text style={[TYPO.note, { textAlign: "center" }]}>Bientôt disponible — en attente de la création de l'association.</Text>
      <Text style={TYPO.micro}>Repère ne collecte aujourd'hui aucun paiement et ne demande aucune coordonnée. Cette page le dira autrement le jour où ce sera le cas.</Text>
    </Page>
  );
}
