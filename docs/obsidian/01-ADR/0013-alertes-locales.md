---
type: adr
numero: "0013"
source: docs/adr/0013-alertes-locales.md
genere: true
tags: [adr]
---

> [!info] Copie générée par scripts/sync-obsidian.sh
> La référence est `docs/adr/0013-alertes-locales.md` : toute modification passe par une PR sur ce fichier.

# ADR 0013 — Alertes locales, sans notification poussée

- Date : 25 novembre 2026
- Statut : accepté (décision du porteur du 25/11/2026, Step Up, chantier 3)
- Amende : invariant 2 (contenu de `repere.profil`)

## La décision

Le porteur demandait des notifications (« Votes importants », « Budgets », « Élections », « Actus de
mon maire ») sans traçage. Une notification poussée exige un serveur qui garde un abonnement par
appareil : c'est contraire à l'invariant 1 (aucun serveur applicatif) et à l'invariant 2 (rien n'est
transmis). Le porteur a choisi des **alertes locales** :

- à l'ouverture, l'accueil compare les fichiers publics déjà publiés par Repère aux sujets choisis, et
  le dit dans un bandeau (« 3 nouveautés sur vos sujets ») ;
- les sujets choisis vivent dans `repere.profil`, champ `alertes`, sur l'appareil, jamais transmis.

C'est ce champ qu'amende cet ADR : pas de troisième clé, un champ de plus dans la deuxième.

## Ce qui est construit

- `packages/core/src/alertes.js` : `ALERTES` (quatre sujets fixes), `nettoyerAlertes`, `nouveautes`.
- `alertes` vaut `null` tant que la question n'a pas été posée, `[]` si le lecteur a dit « Non merci » :
  la proposition ne revient pas. Tout autre contenu est filtré sur la liste fixe.
- **Aucune date de visite n'est gardée.** « Nouveau » veut dire « publié ces 7 derniers jours » (à l'heure
  de Paris), et l'écran l'écrit. On aurait pu compter « depuis votre dernière visite » : ce serait garder
  une trace de l'usage, ce que Repère ne fait pas.
- Rien n'est trié par importance (invariant 3) : les nouveautés vont de la plus récente à la plus ancienne ;
  une élection dans les 30 jours vient en tête, parce que c'est un rappel et pas une publication.
- « Votes à l'Assemblée » et non « votes importants » : Repère ne juge pas l'importance d'un vote. Ce sont
  les scrutins du catalogue publié, ceux que l'accueil montrait déjà (« Dernières publications »).

## Preuve

`tests/profil.test.mjs` (alertes) : liste fixe, `null` gardé, `[]` gardé, intrus filtrés, fenêtre de
7 jours (garde vue rouge à 8 jours), sujet non choisi absent.
