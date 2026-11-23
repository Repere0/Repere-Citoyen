/* LA STORY « LE REPÈRE DU JOUR » — modèle A, « l'affiche » (nuit, 23/11/2026, modèles validés par le porteur).
 *
 * Avant : trois faits en petit, sans adresse. Désormais : le fait du jour en très grand, la commune et la date en
 * étiquette, « Et chez vous ? » et l'adresse en pied, la source du fait juste au-dessus. Les deux autres faits
 * restent dans l'application : une story se lit en deux secondes. Rien n'est calculé ici : le fait et sa source
 * viennent de l'écran. */
import type { ComponentRef, RefObject } from "react";
import { Text, View } from "react-native";
import { raccourcirFait } from "@repere/core";
import { POLICE } from "../lib/theme";
import { NEUTRES_CARTE } from "../lib/palette";
import type { FaitDuJour, SourcesDuJour } from "../lib/repere-jour";
import { CarteStory, Etiquette, tailleTitre } from "./partage/carte-story";

export function RepereDuJourStory({ refCarte, ville, date, faits, sources }: {
  refCarte: RefObject<ComponentRef<typeof View> | null>; ville: string; date: string;
  faits: (FaitDuJour & { texte: string })[]; sources: SourcesDuJour;
}) {
  const P = NEUTRES_CARTE.nuit;
  const f = faits[0];
  const src = f ? sources[f.source] : null;
  const texte = f ? raccourcirFait(f.texte, { max: 120, visible: 120 }) : "";
  const t = tailleTitre(texte, 44);
  return (
    <CarteStory refCarte={refCarte} fond="nuit" invitation={"Et chez vous\u00a0?"}
      source={src ? `Source : ${src.court ?? src.producteur}.` : "Chiffres publiés par les producteurs cités."}
      etiquette={<Etiquette texte={`${ville} · ${date}`} />}
      corps={<>
        <Text style={{ fontFamily: POLICE.affiche, fontSize: t, lineHeight: Math.round(t * 1.1), letterSpacing: -1, color: P.encre }}>{texte}</Text>
        {faits.length > 1 ? <Text style={{ fontFamily: POLICE.texte, color: P.sourd, fontSize: 16, lineHeight: 22 }}>{`Et ${faits.length - 1} autre${faits.length > 2 ? "s" : ""} fait${faits.length > 2 ? "s" : ""} du jour dans Repère.`}</Text> : null}
      </>} />
  );
}
