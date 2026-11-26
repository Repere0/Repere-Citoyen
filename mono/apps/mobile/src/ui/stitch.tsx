/* LES COMPOSANTS SIGNATURES DES MAQUETTES STITCH (09/11/2026, décision du porteur : « tout Stitch »).
 *
 * EnClair            le cartouche « En clair » : une phrase calculée ou lue, jamais rédigée ici.
 * VoteBarTricolor    la répartition d'un scrutin (pour, contre, abstention), nombres écrits.
 * Onglets            le contrôle segmenté compact (pastille blanche, point d'accent).
 * BadgeRepere        le badge « ● REPÈRE DU JOUR · EXERCICE … ».
 *
 * Écarts assumés aux maquettes (règles du produit, pas de la direction artistique) :
 * - « En clair (4 sec) » devient « En clair » : la durée de lecture n'est pas mesurée (règle
 *   « mesurer plutôt que supposer ») ;
 * - les couleurs de vote ne portent jamais le texte (2,56 à 2,98:1 sur la carte claire) : le
 *   nombre et le mot sont dans l'encre, la couleur est dans la barre et la pastille ;
 * - les tailles de 11 px de la maquette suivent l'échelle du lecteur (TYPO), jamais figées.
 *
 * Aucune couleur littérale ici : tout vient de theme.ts (ACCENTS, JAUGE, couleurs) et de
 * useCouleurVote (variante daltonienne comprise). */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BarreSegments } from "./visuels";
import { ACCENTS, CIBLE, couleurs, feuille, JAUGE, PAS, POLICE, RAYON, TYPO } from "../lib/theme";
import { useCouleurVote } from "../lib/couleur-vote";
import { espacesFines } from "./donnees";
import { enfonce } from "./mouvement";

/* ── Le cartouche « En clair » ─────────────────────────────────────────── */
export function EnClair({ texte, enfants }: { texte?: string | null; enfants?: ReactNode }) {
  if (!texte && !enfants) return null;
  return (
    <View style={s.enClair} accessible accessibilityLabel={`En clair : ${texte ?? ""}`}>
      <View style={s.enClairTete}>
        {/* L'éclair dans la couleur du texte d'accent : en émeraude, il tombait à 2,72:1 sur le fond du
            cartouche (mesuré par parcours-web). L'émeraude reste au filet de gauche. */}
        <Ionicons name="flash" size={14} color={ACCENTS.texteAccent} accessible={false} importantForAccessibility="no" />
        <Text style={s.enClairBadge}>EN CLAIR</Text>
      </View>
      {texte ? <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen }]}>{texte}</Text> : null}
      {enfants}
    </View>
  );
}

/* ── La répartition d'un scrutin ───────────────────────────────────────── */
const nb = (x: unknown) => { const n = Number(x); return Number.isFinite(n) && n >= 0 ? n : null; };
export function VoteBarTricolor({ pour, contre, abstention, position, qui }: {
  pour: unknown; contre: unknown; abstention: unknown; position?: string | null; qui?: string | null;
}) {
  const C = useCouleurVote();
  const p = nb(pour), c = nb(contre), a = nb(abstention);
  if (p === null || c === null || a === null || p + c + a === 0) return null;
  const total = p + c + a;
  /* Arrondis : la somme des trois pourcentages est ramenée à 100 sur l'abstention, comme la maquette. */
  const pp = Math.round(p / total * 100), pc = Math.round(c / total * 100), pa = 100 - pp - pc;
  const parts = [
    { cle: "p", n: p, pct: pp, mot: "Pour" },
    { cle: "c", n: c, pct: pc, mot: "Contre" },
    { cle: "a", n: a, pct: pa, mot: "Abst." },
  ] as const;
  const mot: Record<string, string> = { p: "Pour", c: "Contre", a: "Abstention" };
  /* 26/11/2026 (porteur) : une barre fine et aérée, puis trois colonnes de même largeur (le nombre au-dessus de son
     mot et de sa part), alignées ; la position du député vient dessous, dans la carte, sans fond plein. */
  return (
    <View style={{ gap: PAS * 4 }} accessible
      accessibilityLabel={`${p} pour, ${c} contre, ${a} abstentions${position && qui ? `. ${qui} : ${mot[position] ?? ""}` : ""}`}>
      <BarreSegments hauteur={12} etiquette={`${p} pour, ${c} contre, ${a} abstentions`}
        segments={parts.map(x => ({ cle: x.cle, valeur: x.n, couleur: C[x.cle] }))} />
      <View style={{ flexDirection: "row", gap: PAS * 3 }}>
        {parts.map(x => (
          <View key={x.cle} style={{ flex: 1, gap: PAS }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
              <View style={[s.point, { backgroundColor: C[x.cle] }]} />
              <Text style={TYPO.note}>{x.mot}</Text>
            </View>
            <Text style={[TYPO.section, { fontFamily: POLICE.donneeForte, fontVariant: ["tabular-nums"] }]}>{x.n.toLocaleString("fr-FR")}</Text>
            <Text style={TYPO.micro}>{x.pct}{"\u00a0"}%</Text>
          </View>
        ))}
      </View>
      {position && qui && mot[position] ? (
        <View style={s.badgeDepute}>
          <View style={[s.point, { backgroundColor: C[position as "p" | "c" | "a"] }]} />
          <Text style={[TYPO.corps, { flex: 1, color: couleurs.encre }]}>{qui} : <Text style={{ fontFamily: POLICE.titre }}>{mot[position]}</Text></Text>
        </View>
      ) : null}
    </View>
  );
}

/* ── Le contrôle segmenté ──────────────────────────────────────────────── */
/* Step Up (25/11/2026) : plus de point devant l'onglet actif. Il décalait le libellé (« 100 € citoyen » sortait
   du centre, signalé comme un bug). L'onglet actif se lit par sa carte blanche, son ombre et sa graisse. */
export function Onglets<T extends string>({ valeurs, actif, choisir, etiquette }: {
  valeurs: { cle: T; texte: string }[]; actif: T; choisir: (c: T) => void; etiquette: string;
}) {
  return (
    <View style={s.segments} accessibilityRole="tablist" accessibilityLabel={etiquette}>
      {valeurs.map(v => {
        const on = v.cle === actif;
        return (
          <Pressable key={v.cle} onPress={() => choisir(v.cle)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            accessibilityLabel={v.texte}
            style={({ pressed }) => [s.segment, on && s.segmentActif, pressed && enfonce(true)]}>
            <Text numberOfLines={2} style={[s.segmentTexte, on && { color: couleurs.encre, fontFamily: POLICE.section }]}>{v.texte}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Le badge « Repère du jour » ───────────────────────────────────────── */
export function BadgeRepere({ texte }: { texte: string }) {
  return (
    <View style={s.badgeRepere}>
      <View style={[s.point, { backgroundColor: ACCENTS.civique }]} />
      <Text style={[TYPO.micro, { color: ACCENTS.texteAccent, fontFamily: POLICE.texteGras, letterSpacing: 0.6 }]}>{texte.toUpperCase()}</Text>
    </View>
  );
}

const s = feuille(() => StyleSheet.create({
  enClair: {
    gap: PAS, padding: PAS * 3, borderRadius: RAYON.bloc, backgroundColor: ACCENTS.fondCivique,
    borderLeftWidth: 4, borderLeftColor: ACCENTS.civique,
  },
  enClairTete: { flexDirection: "row", alignItems: "center", gap: PAS * 2 },
  enClairBadge: { ...TYPO.micro, fontFamily: POLICE.texteGras, color: ACCENTS.texteAccent, letterSpacing: 0.6 },
  ligne: { flexDirection: "row", flexWrap: "wrap", columnGap: PAS * 3, rowGap: PAS },
  point: { width: 10, height: 10, borderRadius: 5 },
  badgeDepute: { flexDirection: "row", alignItems: "center", gap: PAS * 2, paddingTop: PAS * 4, borderTopWidth: 1, borderTopColor: couleurs.trait },
  /* Refonte « légère » : une jauge fine. */
  piste: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: couleurs.voile, gap: 2 },
  segments: { flexDirection: "row", padding: 4, gap: 4, borderRadius: RAYON.bloc, backgroundColor: couleurs.voile },
  segment: { flex: 1, minHeight: CIBLE - 4, alignItems: "center", justifyContent: "center", paddingHorizontal: PAS, borderRadius: RAYON.bloc - 4 }, /* 26/11/2026 : arrondi intérieur = arrondi extérieur moins le jour de 4 px */
  segmentActif: { backgroundColor: couleurs.carte, shadowColor: couleurs.encre, shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  /* Pas de capitales : à 360 px, « PLAFONDS » se coupait au milieu du mot (capture du 09/11/2026). */
  segmentTexte: { ...TYPO.micro, fontFamily: POLICE.texteMoyen, color: couleurs.sourd, textAlign: "center" },
  badgeRepere: { flexDirection: "row", alignItems: "center", gap: PAS * 2, alignSelf: "flex-start" },
}));

