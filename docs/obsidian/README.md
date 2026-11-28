# Coffre Obsidian de Repère

Le « cerveau » du projet : décisions (ADR), specs, retours testeurs et journal de bord, reliés entre eux et
au code. But : pouvoir répondre en un clic à « pourquoi ce code ? » (commit → PR → spec → retour) et
« qu'est-ce qui a changé depuis cette décision ? » (ADR → PR → commits).

```
docs/obsidian/
├── 00-Meta/       Conventions, modèles (Templates/), état GitHub généré
├── 01-ADR/        copie de docs/adr/ + brouillons d'ADR
├── 02-Specs/      une spec par fonctionnalité
├── 03-Retours/    un retour testeur par note (github/ = fiches générées depuis les issues)
└── 04-Journal/    une note par jour, avec l'activité GitHub du jour ajoutée par la synchro
```

À lire d'abord : [[Conventions]].

> [!warning] Ce n'est pas le seul coffre du dépôt
> `data/` est aussi un coffre Obsidian : celui du **contenu publié** dans l'application (faits, résumés).
> Ici, c'est la **documentation du projet**, jamais publiée. Ouvre-les comme deux coffres séparés.

---

## 1. Avant tout : deux pièges, à régler une fois

### Piège 1 — ne pas ouvrir le coffre dans ton clone de travail

Dans ton clone de travail (celui où tourne `pousser.bat`, a priori `C:\Users\APina\repere`), le script tourne toutes les heures sur **la branche courante** : tes
notes partiraient dans la PR de la fonctionnalité en cours. Et selon sa version, Obsidian Git peut aussi
enregistrer des changements hors du coffre (ton code en cours) — je ne l'ai pas vérifié, la règle ci-dessous
rend la question sans objet.

**Donc : un clone dédié au coffre**, qui ne sert qu'à ça.

```bat
cd C:\Users\APina
git clone https://github.com/Repere0/repere-citoyen.git repere-coffre
```

Puis dans Obsidian : **Ouvrir un dossier comme coffre** → `C:\Users\APina\repere-coffre\docs\obsidian`.

### Piège 2 — la protection de `main`

D'après `docs/github-protection.md`, `main` exige une PR, et seule l'App `repere-collecte` passe outre.
**Je n'ai pas pu vérifier si cette règle est active** (pas d'accès à l'API du dépôt depuis ma session).
Regarde dans GitHub : **Settings → Rules → Rulesets**.

- **Aucune règle active** : rien à faire, Obsidian Git pousse sur `main`.
- **Règle active** : ton push depuis Obsidian sera refusé. Deux choix, c'est à toi de trancher :
  - **(a) ajouter ton compte à la liste de contournement** (« Bypass list », mode *Always*). Simple, mais
    tous tes pushs sur `main`, code compris, échappent alors à la PR et aux contrôles verts.
  - **(b) garder la protection** : dans le clone du coffre, travaille sur une branche `coffre`
    (`git switch -c coffre`), laisse Obsidian Git pousser cette branche, et fusionne une PR
    `coffre → main` quand tu veux (une par semaine suffit). Les mises à jour du robot arrivent par
    `git merge origin/main` (commande Obsidian Git « Pull » sur `main`, puis retour sur `coffre`).

La synchro automatique (section 4), elle, n'est pas concernée : elle pousse avec l'App `repere-collecte`,
comme la collecte du matin.

---

## 2. Installer et régler Obsidian Git

1. Obsidian → **Paramètres → Extensions de la communauté** → désactiver le mode restreint →
   **Parcourir** → « Git » (auteur : Vinzent) → **Installer** → **Activer**.
2. Paramètres de l'extension (les noms ont changé selon les versions : « backup » = « commit-and-sync ») :

| réglage | valeur | pourquoi |
|---|---|---|
| Pull on startup | activé | voir l'activité du robot dès l'ouverture |
| Auto pull interval (minutes) | 10 | idem, en continu |
| Auto commit-and-sync interval (minutes) | 10 | tes notes partent sans y penser |
| Commit message | `Coffre Obsidian : notes du {{date}}` | le préfixe « Coffre Obsidian » écarte ces commits du journal |
| Pull before push | activé | évite les refus quand le robot vient d'écrire |
| Sync method | Merge | jamais de rebase automatique (leçon de `pousser.bat`, 13/09/2026) |

3. Si l'extension dit qu'elle ne trouve pas de dépôt Git : réglage **Custom base path (Git repository
   path)** → `../..` (le coffre est deux dossiers sous la racine du dépôt). Non vérifié sur ton poste.
4. Le dossier `.obsidian/plugins/` est ignoré par Git : l'extension s'installe sur chaque poste et son
   réglage reste local.

Le dépôt est public. Avant d'activer la synchro automatique, relis la section « Ce qu'on n'écrit jamais
ici » de [[Conventions]] : un texte poussé reste dans l'historique Git même après suppression.

---

## 3. Utiliser les modèles

Réglages déjà livrés dans `.obsidian/` : modèles dans `00-Meta/Templates`, note du jour dans `04-Journal`.

| je veux | je fais |
|---|---|
| le journal du jour | Ctrl+P → « Ouvrir la note du jour » |
| une spec | nouvelle note dans `02-Specs` → Ctrl+P → « Modèles : insérer » → **Spec** |
| un ADR | nouvelle note `NNNN-titre.md` dans `01-ADR` → modèle **ADR** |
| un retour testeur | nouvelle note `AAAA-MM-JJ-Tnn-ecran.md` dans `03-Retours` → modèle **Retour-testeur** |

Les signets (étoile, barre de gauche) ouvrent directement : Conventions, État GitHub, retours à trier, ADR
proposés, specs à valider.

---

## 4. La synchro avec GitHub

`scripts/sync-obsidian.sh` lit GitHub par `gh` et met à jour :

- `01-ADR/` : copie de `docs/adr/` (la référence ne bouge pas : `CLAUDE.md` et le sceau des invariants en dépendent) ;
- `04-Journal/AAAA-MM-JJ.md` : le bloc « Activité GitHub » (commits, PR et issues du jour) — **le reste de la note n'est jamais touché** ;
- `00-Meta/github-etat.md` : PR et issues ouvertes, 15 derniers commits ;
- `03-Retours/github/issue-N.md` : une fiche par issue portant le label `retour-testeur` — titre, état,
  lien, **jamais le texte ni l'auteur** de l'issue.

**Automatique** : `.github/workflows/sync-obsidian.yml` le lance à chaque push sur `main` et enregistre le
résultat. Il ignore ses propres commits (`paths-ignore: docs/obsidian/**`) : pas de boucle. Il refuse
d'enregistrer quoi que ce soit hors de `docs/obsidian/`.

**À la main** (Git Bash, depuis la racine du clone, après `gh auth login` une fois) :

```bash
bash scripts/sync-obsidian.sh                  # aujourd'hui
JOUR=2026-11-27 bash scripts/sync-obsidian.sh  # un autre jour
HORS_LIGNE=1 bash scripts/sync-obsidian.sh     # copie des ADR seulement
```

Ou depuis GitHub : **Actions → Synchro du coffre Obsidian → Run workflow** (champ « jour » facultatif).

Limites connues :

- les PR et issues « du jour » sont filtrées par GitHub sur la date **UTC** : entre minuit et 1 h (2 h
  l'été), une mise à jour peut apparaître dans le journal de la veille ;
- sous Git Bash, si le fuseau `Europe/Paris` est absent du poste, le jour est compté en UTC (non vérifié) ;
- chaque synchro est un commit sur `main` : CodeQL et gitleaks, qui tournent à chaque push sur `main`,
  repartent une fois de plus (gratuit sur un dépôt public, juste du bruit dans Actions).

---

## 5. Créer le label des retours (une fois)

GitHub → **Issues → Labels → New label** → `retour-testeur`. Sans lui, `03-Retours/github/` reste vide.
Un autre nom ? Variable `LABEL_RETOUR` du script.
