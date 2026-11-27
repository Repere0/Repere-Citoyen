/* LA TEINTE D'UNE CATEGORIE DU HUB (27/11/2026, ADR 0014), selon le mode et le reglage « mode daltonien »
 * (repere.profil, comme useCouleurVote). Une categorie inconnue n'a pas de teinte : la carte reste neutre. */
import { useProfil } from "./profil";
import { modeActuel } from "./theme";
import { TEINTES_OUTILS } from "./palette";

export function useTeinteOutil(): (categorie: string) => string | null {
  const { profil } = useProfil();
  const teintes: Record<string, string> = TEINTES_OUTILS[modeActuel()][profil?.modeDaltonien ? "daltonien" : "normal"];
  return categorie => teintes[categorie] || null;
}
