---
type: meta
tags: [meta]
---

# Conventions du coffre

## Deux coffres, deux rôles

| coffre | sert à | publié dans l'app ? |
|---|---|---|
| `data/` | les faits, résumés et brouillons de contenu (le geste éditorial) | oui, après relecture |
| `docs/obsidian/` (ici) | décisions, specs, retours testeurs, journal de bord | non |

Ne jamais déplacer une note d'un coffre à l'autre : la collecte lit `data/`, pas `docs/obsidian/`.

## Noms de fichiers

| dossier | nom | exemple |
|---|---|---|
| `01-ADR` | `NNNN-titre-court.md` (numéro suivant de `docs/adr/`) | `0015-coffre-obsidian.md` |
| `02-Specs` | `AAAA-MM-JJ-sujet.md` | `2026-12-02-calendrier-filtres.md` |
| `03-Retours` | `AAAA-MM-JJ-Tnn-ecran.md` | `2026-12-02-T03-calendrier.md` |
| `04-Journal` | `AAAA-MM-JJ.md` (note du jour, Ctrl+P → « Note du jour ») | `2026-11-28.md` |

## La chaîne de traçabilité

retour testeur → spec → ADR (si un invariant bouge) → PR → commit → journal

Chaque maillon cite le précédent par un lien `[[…]]` ou un numéro `#NN`. Dans un titre de PR ou de
commit, écrire « ADR 0014 » suffit : la synchro le transforme en lien vers la note de l'ADR.

## Ce qui est généré (ne pas modifier à la main, ce serait écrasé)

- `01-ADR/*` portant `genere: true` (copie de `docs/adr/`, qui reste la référence) ;
- `00-Meta/github-etat.md` ;
- `03-Retours/github/*` ;
- dans `04-Journal/AAAA-MM-JJ.md`, le bloc entre `<!-- sync-github:debut -->` et `<!-- sync-github:fin -->`.

## Tags des retours

`#retour/a-trier` · `#retour/bug` · `#retour/comprehension` · `#retour/donnee` · `#retour/accessibilite` ·
`#retour/idee` · `#retour/neutralite` — un seul par retour, plus la gravité `p0` à `p3` en propriété.

## Ce qu'on n'écrit jamais ici

Le dépôt est **public** et Git garde tout. Jamais : nom, prénom, courriel, téléphone ou ville d'un testeur ;
secret, jeton, clé ; capture d'écran qui montre une notification, un contact ou une adresse. Les testeurs
sont T01 à T10 ; la correspondance reste hors du dépôt.
