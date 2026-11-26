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
# 1. Préparer lots.json : [{ "dossier": "DLR5L17N51670", "texte": "officiels/DLR5L17N51670.txt",
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

## Ce qui n'est pas fait (et pourquoi)

- **La récupération automatique des textes officiels** : le conteneur de développement ne joint pas
  assemblee-nationale.fr. Le champ exploitable (exposé des motifs ou résumé du dossier) reste à repérer sur le
  runner. Les textes sont aujourd'hui fournis en fichiers.
- **Le coût** : le script affiche les jetons que renvoie l'API, pas d'euros (le tarif change). Mesurer sur 20 textes
  avant tout lot complet ; **aucune dépense sans l'accord du porteur**.
- **Finances** : l'écran a déjà ses phrases claires, calculées sans IA. La bulle n'y apparaît que si un résumé
  `budget:<insee>` validé existe. Le générateur, lui, n'accepte aujourd'hui que des dossiers législatifs
  (référence `DLR5L…`) : l'étendre aux budgets demande d'abord de choisir le texte source (il n'y a pas de « texte
  officiel » d'un budget communal dans les données de Repère, seulement des chiffres OFGL) et d'accepter 1 264
  relectures. À décider avant d'écrire le code.
