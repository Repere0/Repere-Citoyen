/* « EN CLAIR » — le résumé d'un texte voté (note de conception du 12/11/2026). Branché le 12/11/2026 sur
 * resumes-clairs.json (seulement des résumés validés par le porteur, scripts/resumes-clairs.mjs). Tant que `resume` n'est pas validé (core `resumeAffichable`), l'écran dit
 * « Pas encore de résumé » et renvoie vers le texte officiel (invariant 5). La mention IA est toujours écrite. */
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { dateFr, explicationBudget, mentionCalcul, mentionGeneration, mentionRelecture, mentionResume, PAS_DE_RESUME, resumeAffichable, resumeDesDossiers, resumePour } from "@repere/core";
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
/* LE BOUTON ET SA CARTE, COMMUNS (porteur, 27/11/2026 : « même bouton, mention différente »). Vote et texte de loi :
   texte d'IA validé, mentions « Généré par IA » et « Relu ». Budget : texte calculé, mention « Calculé par Repère ».
   La mention est toujours écrite : le lecteur sait d'où vient le texte. */
type Explication = { texte: string; mentions: string[]; url: string; producteur: string; pied: string; indice: string; lien: string };
export function BoutonExplication({ e }: { e: Explication }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <View style={{ gap: PAS * 2 }}>
      <Pressable testID="expliquer-simplement" onPress={() => setOuvert(o => !o)} accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }} aria-expanded={ouvert} accessibilityLabel="Expliquer simplement"
        accessibilityHint={ouvert ? "Replier l'explication" : e.indice}
        style={({ pressed }) => ({ minHeight: CIBLE, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: PAS * 2,
          paddingHorizontal: PAS * 4, borderRadius: RAYON.pastille, borderWidth: 1, borderColor: couleurs.trait, backgroundColor: couleurs.carte, ...enfonce(pressed) })}>
        <Ionicons name="sparkles-outline" size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
        <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.encre }]}>Expliquer simplement</Text>
        <Ionicons name={ouvert ? "chevron-up" : "chevron-down"} size={18} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
      </Pressable>
      {ouvert ? (
        <View testID="explication" style={{ gap: PAS * 2, padding: PAS * 4, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, borderWidth: 1, borderColor: couleurs.trait }}>
          <Text style={[TYPO.corps, { color: couleurs.encre }]}>{e.texte}</Text>
          {e.mentions.map(m => <Text key={m} style={TYPO.micro}>{m}</Text>)}
          <Pressable onPress={() => Linking.openURL(e.url)} accessibilityRole="link"
            accessibilityLabel={`${e.lien}${e.producteur ? ` (${e.producteur})` : ""}, ouvre un site externe`}
            style={({ pressed }) => ({ minHeight: CIBLE, justifyContent: "center", alignSelf: "flex-start", ...enfonce(pressed) })}>
            <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.lien }]}>{e.lien} ↗</Text>
          </Pressable>
          {e.pied ? <Text style={TYPO.micro}>{e.pied}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export function ExpliquerSimplement({ resume }: { resume: Resume }) {
  const r = resumeAffichable(resume) as Affichable | null;
  if (!r) return null;
  return <BoutonExplication e={{
    texte: r.texte, url: r.url, producteur: r.producteur, lien: "Lire le texte officiel",
    mentions: [mentionGeneration(r.modele, r.producteur), mentionRelecture(r.valideLe ? dateFr(r.valideLe) : null)],
    pied: `${r.producteur ? `${r.producteur} · ` : ""}source relevée le ${dateFr(r.releveLe)}`,
    indice: "Déplier une explication en mots simples, rédigée avec une IA et relue",
  }} />;
}

/* LE BUDGET EN CLAIR (porteur, 27/11/2026) : le texte est CALCULÉ par core (explicationBudget), jamais rédigé ;
   sans dépenses publiées, ni texte ni bouton (les comptes absents ont déjà leur phrase sur l'écran). */
type SourceComptes = { producteur?: string; licence?: string; maj?: string; url?: string } | undefined;
export function ExplicationBudget({ ex, nom, an, source }: { ex: unknown; nom: string; an: string; source: SourceComptes }) {
  const texte = explicationBudget(ex, { nom, an });
  if (!texte || !source || !source.url) return null;
  return <BoutonExplication e={{
    texte, url: source.url, producteur: "OFGL", lien: "Lire les comptes officiels",
    mentions: [mentionCalcul(source.producteur || "OFGL", source.maj ? dateFr(source.maj) : null)],
    pied: source.licence ? `Licence : ${source.licence}` : "",
    indice: "Déplier une explication en mots simples, calculée par Repère à partir des comptes publiés",
  }} />;
}

/* LES EXPLICATIONS PUBLIÉES, lues une fois par écran (27/11/2026) : le calendrier en a besoin pour chaque séance. */
export function useResumesClairs(): unknown {
  const [index, setIndex] = useState<unknown>(null);
  useEffect(() => {
    let vivant = true;
    chargerResumesClairs().then((r: { donnees: unknown }) => { if (vivant) setIndex(r.donnees ?? null); }).catch(() => {});
    return () => { vivant = false; };
  }, []);
  return index;
}

/* Une séance du calendrier (27/11/2026, chantier Calendrier) : l'explication déjà relue du PREMIER dossier de son
   ordre du jour qui en a une. Jamais une explication du titre de la séance (invariant 4). Aucune : rien. */
export function ExpliquerDesDossiers({ index, dossiers }: { index: unknown; dossiers?: string[] }) {
  return <ExpliquerSimplement resume={resumeDesDossiers(index, dossiers || []) as Resume} />;
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

