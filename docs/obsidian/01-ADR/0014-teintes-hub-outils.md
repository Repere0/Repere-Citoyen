---
type: adr
numero: "0014"
source: docs/adr/0014-teintes-hub-outils.md
genere: true
tags: [adr]
---

> [!info] Copie générée par scripts/sync-obsidian.sh
> La référence est `docs/adr/0014-teintes-hub-outils.md` : toute modification passe par une PR sur ce fichier.

# ADR 0014 — Une teinte par catégorie dans le Hub des outils citoyens

- Date : 27 novembre 2026
- Statut : accepté (décision du porteur du 27/11/2026, 19:36, option (a) de la spec)
- Amende : invariant 7 (« l'interface reste neutre »)
- Spec : `claude/Repere_Specs_3_Chantiers_UX_27_11_2026.md` (projet claude.ai), chantier 3

## La décision

Le Hub des outils citoyens (onglet « Outils ») regroupe dix services publics en six catégories fixes
(Identité et connexion, Démarches et droits, Impôts, Santé, Aides et famille, Emploi et formation). Le
porteur a choisi de donner **une teinte pastel à chaque catégorie**, pour que la page se lise d'un coup d'œil.

## Les limites qui rendent l'amendement compatible avec le reste de l'invariant 7

- Une teinte code une **catégorie de service public**, jamais un vote, une opinion, un élu, un parti, un
  territoire, un score ou un classement.
- **La couleur n'est jamais seule** : le nom de la catégorie est écrit sur chaque carte, sous le nom du
  service (`outils-web.mjs` le vérifie).
- Valeurs dans `palette.ts` seulement (`TEINTES_OUTILS`) : clair et sombre, variante daltonienne tirée de la
  palette d'Okabe-Ito, choisie par le réglage « mode daltonien » déjà présent dans `repere.profil`.
- Aucune teinte n'est une couleur de vote ni de groupe politique (`outils.test.mjs`).
- Contraste du pictogramme (encre) sur sa teinte : 3:1 au moins dans les quatre jeux (WCAG 1.4.11).
- Le texte reste à l'encre sur la carte neutre : la teinte habille la pastille du pictogramme et le filet du
  haut de la carte, jamais un fond de texte.

## Ce qui n'est pas permis par cet ADR

Une couleur par catégorie ailleurs que dans le Hub ; une couleur qui distinguerait un service « meilleur »
ou « recommandé » ; un ordre des catégories autre que l'ordre fixe de `outils-citoyens.json`.
