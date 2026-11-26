# Résumés « En clair » rédigés avec une IA (Mistral)

Décisions du porteur, 26/11/2026 : voie 2 (génération par script), fournisseur **Mistral**, et **rien ne s'affiche
sans sa validation**. Conception d'origine : `claude/Repere_Conception_Resumes_Votes_12_11_2026.md` (projet).

## La chaîne

```
texte officiel (fichier .txt)  ──►  scripts/generer_resumes.mjs  ──►  contrôles (resumes-clairs.mjs)
                                     (consigne fixe, Mistral)          nombres, noms, jugement, longueur
                                                                         │ refusé : rien n'est écrit
                                                                         ▼
                              data/resumes/<dossier>.json   valide: false, methode.voie = "ia:<modèle>"
                                                                         │ le porteur relit et pose valide: true
                                                                         ▼
                     node scripts/resumes-clairs.mjs --publier ./data  ──►  data/resumes-clairs.json
                                                                         │ l'application LIT ce fichier,
                                                                         ▼ n'appelle jamais une IA
                     Vote : bulle « En clair » (étincelle) ; Finances : clé « budget:<insee> »
```

- **Aucune clé dans le dépôt ni dans l'application.** La clé vit dans l'environnement : `MISTRAL_API_KEY`, en local
  (terminal) ou en secret GitHub si un jour le script tourne sur le runner. Ne la colle jamais dans un fichier
  suivi par git ni dans la conversation.
- **La consigne** (constante `CONSIGNE`) reprend mot pour mot celle du porteur : « Explique ce texte à un jeune de
  15 ans, en 3 phrases maximum, sans aucun jugement de valeur, en te basant UNIQUEMENT sur les faits présents dans
  ce texte. » Température 0.
- **Les contrôles** ne voient ni un contresens ni une omission : la relecture du porteur reste le garde-fou qui
  compte. À l'écran, la mention « Résumé généré avec l'aide de l'IA… » est toujours écrite, avec le lien vers le
  texte officiel et sa date (invariant 4 ; transparence exigée par le règlement européen sur l'IA, art. 50).

## Lancer

Depuis `mono/` :

```bash
# 1. Préparer lots.json, automatiquement (voir plus bas) :
#    node scripts/textes-officiels.mjs --archive ../data/brut_Dossiers_Legislatifs --scrutins data/scrutins.json --sortie officiels --deja ../data/resumes
#    ou à la main, au format : [{ "dossier": "DLR5L17N51670", "texte": "officiels/DLR5L17N51670.txt",
#                            "url": "https://www.assemblee-nationale.fr/dyn/17/dossiers/DLR5L17N51670",
#                            "titre": "…", "scrutins": ["9759"] }]
# 2. Éprouver la chaîne sans clé ni dépense :
node scripts/generer_resumes.mjs --liste lots.json --mock --essai
# 3. Mesurer sur 20 textes, sans rien écrire (coûte des jetons) :
MISTRAL_API_KEY=… node scripts/generer_resumes.mjs --liste lots.json --essai
# 4. Écrire les brouillons :
MISTRAL_API_KEY=… node scripts/generer_resumes.mjs --liste lots.json
# 5. Relire chaque data/resumes/<dossier>.json ; poser "valide": true et "valide_le" à la main ; puis :
node scripts/resumes-clairs.mjs --verifier && node scripts/resumes-clairs.mjs --publier ./data
```

## Récupérer les textes officiels sans intervention (26/11/2026)

**Méthode retenue : l'open data de l'Assemblée, puis le PDF officiel du texte déposé.** Ni flux RSS ni lecture de
page HTML : l'Assemblée publie déjà tout ce qu'il faut sous licence ouverte.

1. **Quels dossiers.** Chaque scrutin publié porte `dr`, la référence du dossier législatif (`DLR5L17N…`).
2. **Quel document.** L'archive `Dossiers_Legislatifs.json.zip` (data.assemblee-nationale.fr, déjà téléchargée
   chaque matin par `outils/collecte.py`) contient un fichier JSON par document, racine `document`. Pour un dossier,
   on garde le document dont `dossierRef` est la référence, `provenance` vaut « Texte Déposé » et le type est un
   projet ou une proposition de loi (`classification.type.code` `PRJL`/`PION`, ou `famille.classe.code`
   `PRJLOI`/`PIONLOI`), le plus ancien dépôt. Champs décrits sur l'archive réelle : `docs/schema_dossiers.md`.
3. **Le texte.** `https://www.assemblee-nationale.fr/dyn/opendata/<uid>.pdf` : version PDF officielle du document
   (adresse **vérifiée le 26/11/2026** sur `PRJLANR5L17BTC2357.pdf`, texte de CMP de la loi de simplification).
   `pdftotext` (poppler-utils) en tire le texte brut.
4. **La partie à résumer : l'exposé des motifs**, de l'intitulé « EXPOSÉ DES MOTIFS » jusqu'au dispositif
   (« PROPOSITION DE LOI » / « Article 1er »), borné à 12 000 caractères (un appel, coût borné). C'est la partie
   écrite en langue courante qui dit ce que le texte veut faire ; le dispositif seul (« l'article L. 123 est
   modifié… ») ne se résume pas honnêtement.
5. Un dossier sans document reconnu, sans PDF ou sans exposé lisible est **écarté, et le compte rendu dit
   pourquoi**. Un dossier qui a déjà un fichier dans `data/resumes/` est sauté (on ne repaie pas).

Script : `mono/scripts/textes-officiels.mjs` (contrôles : `mono/tests/textes-officiels.test.mjs`, réseau et
pdftotext simulés). Il écrit `<sortie>/<dossier>.txt` et `<sortie>/lots.json`, que lit `generer_resumes.mjs`.

**Non vérifié** (le conteneur de développement ne joint pas l'Assemblée) : que l'exposé des motifs soit lisible tel
quel dans les PDF des textes déposés de la 17e législature, et que tous les scrutins publiés aient leur texte déposé
dans l'archive (une proposition venue du Sénat peut n'avoir à l'Assemblée qu'un texte « transmis »). Le premier
lancement en simulation le dira.

**Première simulation sur le runner (26/11/2026, run 45829490647, modèle simulé)** : 12 dossiers, 6 textes prêts,
6 écartés. Trois écarts venaient du tri (un avis du Conseil d'État ou une étude d'impact pris pour le texte, car ils
portent aussi la classe `PRJLOI`) ; trois de textes nés au Sénat (`PRJLSN…`, PDF absent à l'AN : 404). Deux projets
de loi de finances donnaient leur sommaire au lieu de l'exposé. Corrigé : seul `type.code` compte, seuls les
documents de l'Assemblée (`…ANR5L…`), une occurrence suivie d'une table (« ARTICLE 12 : … ») est sautée, la formule
« Mesdames, Messieurs » est ôtée. **La simulation ne dit rien de la qualité d'un résumé** : son « modèle » recopie
les premières phrases du texte. Seul un essai avec la clé le dira.

Après correctif (run 45829816955) : **9 textes sur 12**.

**Limite assumée : les textes nés au Sénat** (décision du porteur, 26/11/2026 : on laisse tomber pour l'instant).
Le texte que le Sénat transmet à l'Assemblée n'a pas d'exposé des motifs ; celui-ci n'existe que sur senat.fr.
Ces dossiers sont écartés (« pas d'exposé des motifs lisible ») et n'ont pas de résumé « En clair » : l'écran du vote
reste ce qu'il est sans lui.

**Exception factuelle** (porteur, 26/11/2026) : « jeunes majeurs » (âge légal) n'est pas un mot de jugement.
`FAITS_RESUME` (invariants.js) ôte l'expression avant le contrôle ; « un enjeu majeur » reste refusé.

**Limite de fond** : l'exposé des motifs est écrit par les **auteurs** du texte. Il dit ce qu'ils veulent faire,
pas ce que le texte voté contient après amendements. La consigne interdit le jugement, mais un résumé de l'exposé
reste « ce que le texte propose », et l'écran doit le dire ainsi ; la relecture du porteur vérifie qu'il ne reprend
pas un argument des auteurs comme un fait.

## Le workflow `.github/workflows/generer-resumes.yml`

Lancement **manuel seulement** (Actions > « Résumés en clair » > Run workflow), parce que chaque lancement réel coûte
des jetons. Un menu `mode` (26/11/2026, pour lancer depuis un téléphone) :
- `simulation` : modèle simulé, aucun appel, aucun coût ;
- `essai` (**par défaut**) : Mistral répond, les contrôles tournent, **rien n'est écrit** ; chaque résumé se lit dans
  le résumé du run, avec le titre du texte et l'adresse du PDF lu ;
- `brouillons` : Mistral répond ; le workflow pousse une branche `data/resumes-…` et ouvre une pull request de
  brouillons, tous `valide: false` (il refuse s'il en voit un à `true`). Si le réglage du dépôt interdit au jeton
  du workflow d'ouvrir une PR (**non vérifié**), la branche est poussée et le run le dit.

Et `limite` (5 dossiers par défaut). Secret : `MISTRAL_API_KEY`. Les textes extraits et le compte rendu restent
7 jours en artefact du run.

Le brancher sur la collecte quotidienne : possible (même archive, même runner), **pas fait**, et à ne faire qu'après
une semaine de lancements manuels relus : une erreur qui part chaque matin coûte chaque matin.

## Ce qui n'est pas fait (et pourquoi)

- **Le coût** : le script affiche les jetons que renvoie l'API, pas d'euros (le tarif change). Mesurer sur 20 textes
  avant tout lot complet ; **aucune dépense sans l'accord du porteur**.
- **Finances** : **décision du porteur le 26/11/2026 : non**, pas de résumé IA des budgets pour l'instant. L'écran
  garde ses phrases claires calculées sans IA ; le code qui afficherait un résumé `budget:<insee>` validé reste
  inerte (aucun fichier ne le nourrit).
