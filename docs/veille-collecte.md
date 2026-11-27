# Veille de la collecte (« Heartbeat »)

Décision du porteur, 27/11/2026. Spec et plan : `claude/Repere_Spec_Plan_Heartbeat_Collecte_27_11_2026.md` (projet).

## Pourquoi

Les deux alertes de collecte (`outils/sante_publique.sh`, `outils/alerte_collecte.mjs`) tournent **dans**
`collecte.yml`. Une collecte qui ne démarre pas ne les déclenche pas. La veille tourne dans un workflow séparé.

## Ce qu'elle regarde (deux fois par jour, 09:23 et 21:41 UTC)

| signal | alerte si |
|---|---|
| dernière collecte réussie sur `main` | plus de 40 h, ou aucune |
| état du workflow `collecte.yml` | autre chose que `active` (alerte immédiate) |
| `build.construit_le` de la production | plus de 40 h alors que la collecte réussit |

La production injoignable s'écrit « impossible à vérifier » et n'alerte jamais à elle seule.

## Le seuil de 40 h

Mesure du 27/11/2026 : le cron de 05:47 UTC démarre entre 13:37 et 16:30 UTC. Deux réussites peuvent être séparées
d'environ 35 h sans panne. Délai de détection au pire : environ 40 h + 12 h.

## L'alerte

Une seule issue, titre fixe « [ALERTE] veille : la collecte ne donne plus signe de vie », assignée au propriétaire
(donc un courriel), mise à jour sans bruit, fermée seule au retour. Le code d'issue est partagé avec
`alerte_collecte.mjs` (`publierIssue`).

## Prouver qu'elle marche

- Local : `node outils/veille_collecte.mjs --a-sec [--seuil 1]` (aucune issue touchée).
- Réel : Actions → « Veille de la collecte » → Run workflow, `seuil_heures` = 1. L'issue doit s'ouvrir et le courriel
  arriver. Attention : il faut que la dernière collecte réussie date de **plus de 2 h** (l'âge est arrondi à l'heure
  inférieure). Puis relancer avec 40 : l'issue doit se fermer.

## Ce qu'elle ne voit pas

Un arrêt de GitHub Actions pour tout le dépôt : la veille vit au même endroit que la collecte. Aucun service tiers
pour la V1 (décision du porteur) ; on réagit à la main.
