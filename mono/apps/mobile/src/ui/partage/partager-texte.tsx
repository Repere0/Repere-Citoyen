/* LE PARTAGE TEXTE DES ÉCRANS DE DÉTAIL (V37, bloc 7, 31/10/2026).
 *
 * Un bouton en tête d'écran : le titre de la page, le lien direct et la source telle que l'écran la montre.
 * 23/11/2026 (audit C5) : le lien était « repere:// » + l'écran, qui ne s'ouvre que si l'application native est
 * installée (elle n'est distribuée à personne). C'est désormais l'adresse https de la page (lib/adresse-publique.ts),
 * la commune après le « # », jamais envoyée au serveur (invariant 2). Pas de carte d'image : ce partage-là est un texte. */
import { useRef, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, Pressable, Text, View } from "react-native";
import { dateFr } from "@repere/core";
import { couleurs, CIBLE } from "../../lib/theme";
import { useSelection } from "../../lib/selection";
import { lienDeLaPage, slugDe } from "../../lib/adresse-web";
import { lienPublic } from "../../lib/adresse-publique";
import { MESSAGE_RESULTAT, partager, type Resultat } from "./partager";

/* « Source : X, relevé le JJ mois AAAA. » — la même forme que la fiche élu. */
export function ligneSource(s: { producteur?: string; maj?: string } | null | undefined): string {
  if (!s || !s.producteur) return "";
  return `Source : ${s.producteur}${s.maj ? `, relevé le ${dateFr(s.maj)}` : ""}.`;
}

/* « Copier le lien » (web, 12/11/2026, décision du porteur) : copie l'adresse de la page avec la commune après le « # ».
   Un message dit « Lien copié » ; si le navigateur refuse la copie, il le dit aussi (jamais un faux « copié »). */
async function copier(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    return false;
  }
}
export function BoutonCopierLien({ icone = false }: { icone?: boolean }) {
  const { choix } = useSelection();
  const [etat, setEtat] = useState<"" | "ok" | "echec">("");
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (Platform.OS !== "web") return null;
  const onPress = async () => {
    setEtat((await copier(lienDeLaPage(choix ? choix.insee : null))) ? "ok" : "echec");
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setEtat(""), 3000);
  };
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Copier le lien de cette page"
      style={({ pressed }) => ({ minHeight: CIBLE, minWidth: CIBLE, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, opacity: pressed ? 0.6 : 1 })}>
      {icone && !etat ? <Ionicons name="share-outline" size={24} color={couleurs.lien} accessible={false} importantForAccessibility="no" /> : (
        <Text style={{ fontSize: 17, color: couleurs.lien, fontWeight: "500" }} accessibilityLiveRegion="polite">
          {etat === "ok" ? "Lien copié" : etat === "echec" ? "Copie impossible" : "Copier le lien"}
        </Text>
      )}
    </Pressable>
  );
}

export function BoutonPartageTexte({ titre, chemin, source }: { titre: string; chemin: string; source: string }) {
  return (
    /* 13/11/2026 (porteur) : « Copier le lien » quitte l'en-tête (il est en bas de chaque page) et « Partager » devient
       une icône. Mesuré à 390 px sur Finances : le titre (124 à 244 px) passait sous le mot « Partager » (190 à 260 px). */
    <BoutonPartager titre={titre} chemin={chemin} source={source} />
  );
}

function BoutonPartager({ titre, chemin, source }: { titre: string; chemin: string; source: string }) {
  const { choix } = useSelection();
  const [etat, setEtat] = useState<Resultat | null>(null);
  const message = etat ? MESSAGE_RESULTAT[etat] : "";
  return (
    <>
    <Pressable
      onPress={async () => {
        const lien = lienPublic(chemin, slugDe(choix ? choix.insee : null));
        setEtat(await partager({ texte: [titre, source].filter(Boolean).join("\n"), lien }));
      }}
      accessibilityRole="button"
      accessibilityLabel={`Partager : ${titre}`}
      style={({ pressed }) => ({ minHeight: CIBLE, minWidth: CIBLE, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <Ionicons name="share-outline" size={24} color={couleurs.lien} accessible={false} importantForAccessibility="no" />
    </Pressable>
    {message ? <Text style={{ fontSize: 13, color: couleurs.sourd }} accessibilityLiveRegion="polite" testID="partage-resultat">{message}</Text> : null}
    </>
  );
}
