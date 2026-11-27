/* « EN CLAIR » — le résumé d'un texte voté (note de conception du 12/11/2026). Branché le 12/11/2026 sur
 * resumes-clairs.json (seulement des résumés validés par le porteur, scripts/resumes-clairs.mjs). Tant que `resume` n'est pas validé (core `resumeAffichable`), l'écran dit
 * « Pas encore de résumé » et renvoie vers le texte officiel (invariant 5). La mention IA est toujours écrite. */
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { dateFr, mentionGeneration, mentionRelecture, mentionResume, PAS_DE_RESUME, resumeAffichable, resumePour } from "@repere/core";
import { chargerResumesClairs } from "../lib/donnees";
import { couleurs, CIBLE, PAS, POLICE, RAYON, TYPO } from "../lib/theme";
import { Vide } from "../lib/composants";
import { enfonce } from "./mouvement";
import { niveauTitre } from "./titre";

type Resume = { valide?: boolean; valide_le?: string | null; modele?: string; resume?: string; source?: { producteur?: string; url?: string; releve_le?: string } } | null | undefined;

export function ResumeClair({ resume, lienOfficiel }: { resume: Resume; lienOfficiel?: string }) {
  const r = resumeAffichable(resume) as { texte: string; producteur: string; url: string; releveLe: string } | null;
  if (!r) {
    return <Vide icone="document-text-outline" titre={PAS_DE_RESUME} lien={lienOfficiel ? { texte: "Lire le texte officiel", url: lienOfficiel } : undefined} />;
  }
  return (
    <View testID="resume-clair" style={{ gap: PAS * 2, padding: PAS * 4, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, borderWidth: 1, borderColor: couleurs.trait }}>
      {/* 26/11/2026 (porteur) : l'étincelle dit, avant même la mention, que ce texte a été rédigé avec une IA. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
        <Ionicons name="sparkles-outline" size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
        <Text style={TYPO.etiquette} {...niveauTitre(2)}>En clair</Text>
      </View>
      <Text style={TYPO.corps}>{r.texte}</Text>
      <Text style={TYPO.micro}>{mentionResume(r.producteur)}</Text>
      <Pressable onPress={() => Linking.openURL(r.url)} accessibilityRole="link"
        accessibilityLabel={`Lire le texte officiel${r.producteur ? ` (${r.producteur})` : ""}, ouvre un site externe`}
        style={({ pressed }) => ({ minHeight: CIBLE, justifyContent: "center", alignSelf: "flex-start", ...enfonce(pressed) })}>
        <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.lien }]}>Lire le texte officiel ↗</Text>
      </Pressable>
      <Text style={TYPO.micro}>{r.producteur ? `${r.producteur} · ` : ""}relevé le {dateFr(r.releveLe)}</Text>
    </View>
  );
}

/* « EXPLIQUER SIMPLEMENT » (porteur, 27/11/2026). Un bouton discret ; la carte se déplie dessous. Il n'existe que si
   un texte VALIDÉ par le porteur est publié pour ce vote ou ce texte de loi : pas de bouton qui mène à du vide.
   Toujours écrit dans la carte : généré par IA (et par quel modèle, s'il est publié), à partir de quelle source, et
   relu par Repère. Pas d'appel au réseau : le texte est déjà dans resumes-clairs.json (pré-généré, aucune clé ici). */
type Affichable = { texte: string; producteur: string; url: string; releveLe: string; valideLe: string | null; modele: string | null };
export function ExpliquerSimplement({ resume }: { resume: Resume }) {
  const [ouvert, setOuvert] = useState(false);
  const r = resumeAffichable(resume) as Affichable | null;
  if (!r) return null;
  return (
    <View style={{ gap: PAS * 2 }}>
      <Pressable testID="expliquer-simplement" onPress={() => setOuvert(o => !o)} accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }} aria-expanded={ouvert} accessibilityLabel="Expliquer simplement"
        accessibilityHint={ouvert ? "Replier l'explication" : "Déplier une explication en mots simples, rédigée avec une IA et relue"}
        style={({ pressed }) => ({ minHeight: CIBLE, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: PAS * 2,
          paddingHorizontal: PAS * 4, borderRadius: RAYON.pastille, borderWidth: 1, borderColor: couleurs.trait, backgroundColor: couleurs.carte, ...enfonce(pressed) })}>
        <Ionicons name="sparkles-outline" size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
        <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.encre }]}>Expliquer simplement</Text>
        <Ionicons name={ouvert ? "chevron-up" : "chevron-down"} size={18} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
      </Pressable>
      {ouvert ? (
        <View testID="explication" style={{ gap: PAS * 2, padding: PAS * 4, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, borderWidth: 1, borderColor: couleurs.trait }}>
          <Text style={[TYPO.corps, { color: couleurs.encre }]}>{r.texte}</Text>
          <Text style={TYPO.micro}>{mentionGeneration(r.modele, r.producteur)}</Text>
          <Text style={TYPO.micro}>{mentionRelecture(r.valideLe ? dateFr(r.valideLe) : null)}</Text>
          <Pressable onPress={() => Linking.openURL(r.url)} accessibilityRole="link"
            accessibilityLabel={`Lire le texte officiel${r.producteur ? ` (${r.producteur})` : ""}, ouvre un site externe`}
            style={({ pressed }) => ({ minHeight: CIBLE, justifyContent: "center", alignSelf: "flex-start", ...enfonce(pressed) })}>
            <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.lien }]}>Lire le texte officiel ↗</Text>
          </Pressable>
          <Text style={TYPO.micro}>{r.producteur ? `${r.producteur} · ` : ""}source relevée le {dateFr(r.releveLe)}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* Le résumé d'un vote, lu dans le fichier publié : par dossier législatif, sinon par numéro de scrutin. Fichier
   absent, pas arrivé ou sans ce texte : « Pas encore de résumé pour ce texte » et le lien officiel (invariant 5). */
export function ResumeClairDuVote({ dossier, scrutin, lienOfficiel }: { dossier?: string | null; scrutin?: string | number | null; lienOfficiel?: string }) {
  const [index, setIndex] = useState<unknown>(null);
  useEffect(() => {
    let vivant = true;
    chargerResumesClairs().then((r: { donnees: unknown }) => { if (vivant) setIndex(r.donnees ?? null); }).catch(() => {});
    return () => { vivant = false; };
  }, []);
  /* 27/11/2026 (porteur, décision 10) : sur l'écran d'un vote ou d'un texte, le bouton « Expliquer simplement » à la
     place du bloc ; sans texte validé, rien (le lien officiel est déjà sur l'écran). `lienOfficiel` n'est plus lu. */
  void lienOfficiel;
  return <ExpliquerSimplement resume={resumePour(index, { dossier, scrutin }) as Resume} />;
}

/* Le résumé du budget d'une commune (26/11/2026), clé « budget:<insee> » dans le même fichier. Finances a déjà ses
   phrases claires, calculées : sans résumé validé, rien de plus ne s'affiche ici (pas un second « pas encore »). */
export function ResumeClairDuBudget({ insee }: { insee?: string | null }) {
  const [index, setIndex] = useState<unknown>(null);
  useEffect(() => {
    let vivant = true;
    chargerResumesClairs().then((r: { donnees: unknown }) => { if (vivant) setIndex(r.donnees ?? null); }).catch(() => {});
    return () => { vivant = false; };
  }, []);
  const r = resumePour(index, { budget: insee }) as Resume;
  if (!resumeAffichable(r)) return null;
  return <ResumeClair resume={r} />;
}
