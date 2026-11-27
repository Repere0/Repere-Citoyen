# Le budget en clair, calculé (27/11/2026)

Décision du porteur (27/11/2026) : l'explication d'un budget est **calculée par Repère**, sans IA, pour la neutralité
et la gratuité. Spec et plan validés : `claude/Repere_Spec_Plan_Budget_Calcule_27_11_2026.md` (projet).

## Ce qui est calculé, et où

- `repartitionDepenses(ex)` (core, `visuels.js`) : la répartition de 100 € dépensés (salaires, investissement,
  autres = le reste). C'est la **seule** règle, lue par Finances, « Chez vous », l'accueil (carte et accroche) et le
  tableau de bord du bureau. Avant le 27/11, cinq calculs : 46 communes d'IDF sur 1 262 affichaient 1 € d'écart
  entre l'accueil et Finances (exemple : Barcy, 6 € contre 7 € de salaires), et le bureau arrondissait chaque part à
  part.
- `explicationBudget(ex, { nom, an })` (core) : trois à cinq phrases, toujours dans le même ordre, chacune écrite
  seulement si ses agrégats sont publiés. Aucun qualificatif, aucune comparaison. `null` sans dépenses publiées.
- `mentionCalcul` (core, `source.js`) : « Calculé par Repère à partir des comptes publiés par l'OFGL, mis à jour le … ».

## Tâche 0 : que recouvre « Dépenses totales » ? (NON tranché)

- Le relevé (`outils/ofgl.py`) lit l'agrégat OFGL « Dépenses totales » du jeu `ofgl-base-communes`, budget principal.
- Dans les rapports de l'OFGL, « DÉPENSES TOTALES » sans autre précision désigne la ligne (10) = dépenses hors
  remboursements (6) + remboursements de dette (8) ; la version sans remboursements est toujours écrite « hors
  remboursements ». Indice fort que l'agrégat **inclut** le remboursement du capital, mais **non vérifié** sur la
  fiche du jeu : data.ofgl.fr refuse la lecture automatique (robots), la fiche data.gouv.fr n'a pas répondu.
- En attendant, le texte dit « autres dépenses », vrai dans les deux cas. Le jour où c'est vérifié (fiche des
  agrégats sur data.ofgl.fr, ouverte dans un navigateur), et si le remboursement y est, la phrase devient « autres
  dépenses, dont le remboursement des emprunts » (formulation validée par le porteur), avec son test.
