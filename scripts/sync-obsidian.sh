#!/usr/bin/env bash
# =============================================================================
# Synchro GitHub -> coffre Obsidian (docs/obsidian) — 28/11/2026.
#
# Ce que le script ECRIT, et rien d'autre :
#   01-ADR/NNNN-*.md          copie de docs/adr/ (docs/adr reste la reference :
#                             CLAUDE.md y renvoie et le sceau des invariants en depend)
#   04-Journal/AAAA-MM-JJ.md  le bloc entre <!-- sync-github:debut --> et
#                             <!-- sync-github:fin --> ; le reste de la note est a toi
#   00-Meta/github-etat.md    PR et issues ouvertes, derniers commits de main
#   03-Retours/github/issue-N.md  une fiche par issue portant le label des retours
#
# Il ne copie JAMAIS le corps d'une issue : le depot est public et un texte
# copie dans Git y reste meme si son auteur supprime l'issue.
#
# Passe par gh (API REST et GraphQL de GitHub). En local : « gh auth login » une fois.
#   bash scripts/sync-obsidian.sh                 # aujourd'hui (heure de Paris)
#   JOUR=2026-11-27 bash scripts/sync-obsidian.sh # un autre jour
#   HORS_LIGNE=1 bash scripts/sync-obsidian.sh    # copie des ADR seulement, sans reseau
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
export TZ=Europe/Paris

COFFRE="${COFFRE:-docs/obsidian}"
JOUR="${JOUR:-$(date +%F)}"
LABEL_RETOUR="${LABEL_RETOUR:-retour-testeur}"
HORS_LIGNE="${HORS_LIGNE:-0}"
DEBUT='<!-- sync-github:debut -->'
FIN='<!-- sync-github:fin -->'

[ -d "$COFFRE" ] || { echo "Coffre introuvable : $COFFRE" >&2; exit 1; }
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- 1. ADR : docs/adr -> 01-ADR (sans reseau) --------------------------------
# Un brouillon ecrit a la main dans 01-ADR (sans « genere: true ») n'est jamais
# touche, sauf s'il porte le meme nom qu'un ADR accepte : la copie le remplace.
LIENS="$TMP/liens.sed"
: > "$LIENS"
for src in docs/adr/[0-9][0-9][0-9][0-9]-*.md; do
  [ -e "$src" ] || continue
  nom="$(basename "$src" .md)"
  num="${nom%%-*}"
  dest="$COFFRE/01-ADR/$nom.md"
  {
    printf -- '---\ntype: adr\nnumero: "%s"\nsource: %s\ngenere: true\ntags: [adr]\n---\n\n' "$num" "$src"
    printf '> [!info] Copie générée par scripts/sync-obsidian.sh\n'
    printf '> La référence est `%s` : toute modification passe par une PR sur ce fichier.\n\n' "$src"
    cat "$src"
  } > "$TMP/adr.md"
  cmp -s "$TMP/adr.md" "$dest" 2>/dev/null || cp "$TMP/adr.md" "$dest"
  # « ADR 0014 » dans un titre de PR ou de commit devient un lien vers la note.
  printf 's/ADR %s/[[%s|ADR %s]]/g\n' "$num" "$nom" "$num" >> "$LIENS"
done
# Une copie dont la source a disparu de docs/adr est retiree.
for dest in "$COFFRE"/01-ADR/*.md; do
  [ -e "$dest" ] || continue
  grep -q '^genere: true$' "$dest" || continue
  [ -e "docs/adr/$(basename "$dest")" ] || rm -f "$dest"
done
echo "ADR : $(ls docs/adr/[0-9]*.md 2>/dev/null | wc -l | tr -d ' ') copies a jour."

[ "$HORS_LIGNE" = "1" ] && exit 0

# --- Reseau : gh obligatoire -------------------------------------------------
command -v gh >/dev/null || { echo "gh introuvable : installe GitHub CLI." >&2; exit 1; }
DEPOT="${DEPOT:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
ETATS='{"OPEN":"ouverte","CLOSED":"fermée","MERGED":"fusionnée"}'

# --- 2. Journal du jour ------------------------------------------------------
DEPUIS="$(date -u -d "TZ=\"Europe/Paris\" $JOUR 00:00" +%FT%TZ)"
JUSQUA="$(date -u -d "TZ=\"Europe/Paris\" $JOUR 00:00 +1 day" +%FT%TZ)"

# Les commits du coffre lui-meme ne sont pas de l'activite : on les ecarte.
gh api --paginate "repos/$DEPOT/commits?sha=main&since=$DEPUIS&until=$JUSQUA&per_page=100" \
  --jq '.[] | select(.commit.message | startswith("Coffre Obsidian") | not)
        | "- [`\(.sha[0:7])`](\(.html_url)) \(.commit.message | split("\n")[0])"' \
  > "$TMP/commits"
gh pr list -R "$DEPOT" --state all --search "updated:>=$JOUR" --limit 100 \
  --json number,title,state,url \
  --jq ".[] | \"- [#\(.number)](\(.url)) \(.title) — \(${ETATS}[.state])\"" > "$TMP/pr"
gh issue list -R "$DEPOT" --state all --search "updated:>=$JOUR" --limit 100 \
  --json number,title,state,url \
  --jq ".[] | \"- [#\(.number)](\(.url)) \(.title) — \(${ETATS}[.state])\"" > "$TMP/issues"

section() { # $1 titre, $2 fichier (### pour le journal, ## ailleurs : sans importance pour Obsidian)
  printf '### %s\n\n' "$1"
  if [ -s "$2" ]; then sed -f "$LIENS" "$2"; else echo "- (rien)"; fi
  echo
}
{
  printf '## Activité GitHub (générée — ne pas écrire dans ce bloc)\n\n'
  section "Commits sur main" "$TMP/commits"
  section "PR mises à jour" "$TMP/pr"
  section "Issues mises à jour" "$TMP/issues"
} > "$TMP/bloc"

NOTE="$COFFRE/04-Journal/$JOUR.md"
if [ ! -e "$NOTE" ]; then
  sed "s/{{date}}/$JOUR/g; s/{{title}}/$JOUR/g" "$COFFRE/00-Meta/Templates/Journal.md" > "$NOTE"
fi
if grep -qF "$DEBUT" "$NOTE" && grep -qF "$FIN" "$NOTE"; then
  awk -v bloc="$TMP/bloc" -v d="$DEBUT" -v f="$FIN" '
    index($0, d) { print; while ((getline l < bloc) > 0) print l; saute = 1; next }
    index($0, f) { saute = 0 }
    !saute { print }' "$NOTE" > "$TMP/note"
else
  { cat "$NOTE"; printf '\n%s\n' "$DEBUT"; cat "$TMP/bloc"; printf '%s\n' "$FIN"; } > "$TMP/note"
fi
cmp -s "$TMP/note" "$NOTE" || cp "$TMP/note" "$NOTE"
echo "Journal : $NOTE ($(wc -l < "$TMP/commits" | tr -d ' ') commits, $(wc -l < "$TMP/pr" | tr -d ' ') PR, $(wc -l < "$TMP/issues" | tr -d ' ') issues)."

# --- 3. Etat du depot --------------------------------------------------------
# Chaque appel ecrit d'abord dans un fichier : un echec de gh arrete le script
# (set -e) au lieu de s'afficher « (aucune) ».
gh pr list -R "$DEPOT" --state open --limit 100 --json number,title,url,isDraft \
  --jq '.[] | "- [#\(.number)](\(.url)) \(.title)\(if .isDraft then " (brouillon)" else "" end)"' > "$TMP/pr_ouvertes"
gh issue list -R "$DEPOT" --state open --limit 100 --json number,title,url,labels \
  --jq '.[] | "- [#\(.number)](\(.url)) \(.title)\(if (.labels|length) > 0 then " · " + ([.labels[].name] | join(", ")) else "" end)"' > "$TMP/issues_ouvertes"
gh api "repos/$DEPOT/commits?sha=main&per_page=15" \
  --jq '.[] | "- [`\(.sha[0:7])`](\(.html_url)) \(.commit.author.date[0:10]) — \(.commit.message | split("\n")[0])"' > "$TMP/derniers"
{
  printf -- '---\ntype: etat\ngenere: true\n---\n\n# État GitHub de %s\n\n' "$DEPOT"
  printf '> [!info] Note générée par scripts/sync-obsidian.sh — réécrite à chaque synchro.\n\n'
  section "PR ouvertes" "$TMP/pr_ouvertes"
  section "Issues ouvertes" "$TMP/issues_ouvertes"
  section "15 derniers commits de main" "$TMP/derniers"
} > "$TMP/etat"
cmp -s "$TMP/etat" "$COFFRE/00-Meta/github-etat.md" 2>/dev/null || cp "$TMP/etat" "$COFFRE/00-Meta/github-etat.md"

# --- 4. Retours testeurs deposes en issue -------------------------------------
# Titre, etat, labels et lien seulement. Jamais le corps ni l'auteur.
mkdir -p "$COFFRE/03-Retours/github"
gh issue list -R "$DEPOT" --state all --label "$LABEL_RETOUR" --limit 200 \
  --json number,title,state,url,labels,createdAt \
  --jq '.[] | [.number, .state, .createdAt[0:10], .url, ([.labels[].name] | join(", ")), .title] | @tsv' \
  > "$TMP/retours"
while IFS=$'\t' read -r num etat cree url labels titre; do
  [ -n "$num" ] || continue
  dest="$COFFRE/03-Retours/github/issue-$num.md"
  statut=$([ "$etat" = "OPEN" ] && echo ouvert || echo ferme)
  {
    printf -- '---\ntype: retour\nsource: github\ngenere: true\nissue: %s\nstatut: %s\ndate: %s\ntags: [retour/github]\n---\n\n' "$num" "$statut" "$cree"
    printf '# Issue #%s — %s\n\n' "$num" "$titre"
    printf -- '- Lien : %s\n- Labels : %s\n\n' "$url" "$labels"
    printf '> [!info] Fiche générée : le texte de l'"'"'issue reste sur GitHub, il n'"'"'est pas copié ici.\n'
  } > "$TMP/retour"
  cmp -s "$TMP/retour" "$dest" 2>/dev/null || cp "$TMP/retour" "$dest"
done < "$TMP/retours"
echo "Retours : $(wc -l < "$TMP/retours" | tr -d ' ') issues « $LABEL_RETOUR »."
