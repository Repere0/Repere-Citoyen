# ADR 0012 — Un lien partagé ouvre son contenu avant la bienvenue

- Date : 23 novembre 2026
- Statut : accepté (décision du porteur du 23/11/2026, réponse 2 à l'audit pré-bêta)
- Amende : la « barrière physique » de bienvenue du 14/11/2026 (dite ADR 0011 dans le code, `app/_layout.tsx`).
  Aucun invariant de `CLAUDE.md` n'est touché.

## La décision

> « Lien avant bienvenue : OUI. Un lien partagé ouvre directement le contenu, sans passer par les 3 écrans de
> bienvenue. » (porteur, 23/11/2026)

## Ce qui était mesuré

Le 23/11/2026, `…/finances#melun` ouvert par un nouveau visiteur (iPhone 13 émulé) montrait d'abord la
bienvenue : le logo, puis le prénom, puis « Ce que Repère ne fait pas ». Il fallait trois écrans avant de voir
Finances. La commune du lien était bien gardée à la fin, mais sur un réseau social la plupart des gens s'arrêtent
avant.

## Ce qui est construit

- La bienvenue couvre l'écran **seulement sur l'accueil** (l'ouverture directe), tant qu'aucun prénom n'est
  gardé : `bienvenueDressee(barriere, chemin, demandee)` dans `lib/bienvenue.tsx`, une seule fonction.
- Toute autre page (un lien partagé, la confidentialité) montre son contenu, avec un bandeau en tête
  (`ui/bandeau-decouverte.tsx`) : ce qu'est Repère en une phrase, et « Personnaliser », qui pose la bienvenue
  par-dessus la page. Une fois le prénom gardé (ou « Passer »), le lecteur reste sur la page et le bandeau disparaît.
- Rien n'est gardé sur l'appareil tant que le lecteur ne l'a pas demandé (invariant 2 inchangé) : l'état
  « bienvenue demandée » vit en mémoire.
- La coquille ne navigue toujours pas (aucun `router.replace` au lancement : la panne de l'iPhone du 13/11).

## Preuves

`apps/mobile/tests/onboarding-web.mjs` : lien `/finances#melun` sans profil → contenu lu tout de suite,
aucune bienvenue, bandeau visible, rien gardé ; « Personnaliser » → bienvenue ; après « Passer », retour sur
Finances sans bandeau. Accueil sans profil → bienvenue complète.
