# Plan d'implémentation par sprints

Méthode : chaque sprint annonce son objectif, liste les fichiers concernés, implémente, teste, build, corrige, met à jour la documentation et produit un rapport. **Un sprint n'est jamais clos si le build échoue ou si le parcours principal concerné ne fonctionne pas.**

## Sprint 0 — Fondations documentaires ✅ (ce commit)
Livrables : les 8 documents `docs/`. Diagnostic Dropbox complet, curation v1, décisions ouvertes.

## Sprint 1 — Socle technique
**Objectif** : application qui build, design system opérationnel, données réelles de structure.
- Scaffold `soleil-portal/` (Vite + React 18 + TS + Tailwind + Router).
- Tokens design system, composants UI de base (boutons, cartes, badges, champs, bandeau « Prochaine étape », états vides).
- i18n FR/EN : provider, dictionnaires, sélecteur persistant (`localStorage` + `<html lang>`).
- Couche `DataProvider` : types complets (28 tables), adaptateur local (seed + localStorage), point d'extension Supabase.
- Seed : 16 produits (capsule v1), 4 capsules, 4 modèles de partenariat, `brand_settings` avec les 17 placeholders, conditions commerciales « à confirmer », comptes de démonstration, organisation de démonstration.
- Placeholders d'images générés + `asset-manifest.json` + `import-assets.md`.
**Sortie** : `npm run build` vert ; page d'accueil minimale navigable FR/EN.

## Sprint 2 — Expérience publique et authentification
**Objectif** : un prospect peut découvrir la maison et demander l'accès.
- Pages : Accueil, La Maison (dont Shop Plateau), Lookbook (narration verticale immersive, manifeste, portrait fondatrice, capsules, signatures, pourquoi, partenariats, CTA), Capsules (+détail), Pièces signatures, Devenir partenaire, Demander un accès, Prendre rendez-vous, Contact.
- Lien personnalisé `/l/:token` avec traçage `lookbook_viewed`.
- Auth démo : connexion, inscription pro, mot de passe oublié (simulé), garde de routes par rôle ; pages 403/404/erreur/lien expiré/maintenance.
- Vérification : aucun prix professionnel accessible sans rôle `buyer`.
**Sortie** : build vert ; parcours étapes 1–5 du parcours principal fonctionnel.

## Sprint 3 — Espace acheteur
**Objectif** : de l'exploration au devis.
- Showroom (filtres, recherche, tri, comparaison, favoris), fiche produit (galerie, zoom, variantes, demandes d'échantillon/personnalisation).
- Ma sélection (variantes, quantités, notes privées, persistance, partage) ; Line Sheet (tableau/cartes, filtres, synthèse commerciale, marges, impression PDF, export CSV, lien sécurisé filigrané) ; demande de devis (sélection + modèle de partenariat) ; Mes devis (accepter/modifier/refuser) ; Mes commandes ; Partnership Pack ; Mes documents ; Mon organisation ; Support ; tableau de bord acheteur.
**Sortie** : build vert ; étapes 6–13 et 17–19 fonctionnelles.

## Sprint 4 — Espace administrateur
**Objectif** : Soleil Création pilote tout sans toucher au code.
- Vue d'ensemble (KPI, filtres), produits (CRUD complet, variantes, médias, prix, visibilité, vedette, archivage), collections, capsules, médias, prix, conditions commerciales, demandes d'accès (approbation → création compte), prospects (pipeline 15 statuts, fiche complète, notes internes, tâches), partenaires, sélections, devis (ajustement, envoi, suivi), commandes, documents, contrats (génération avec disclaimer), contenus FR/EN, utilisateurs, statistiques (données démo marquées), paramètres (`brand_settings`), journal d'audit.
**Sortie** : build vert ; étapes 5, 14–16, 20 fonctionnelles ; boucle complète du parcours jouable de bout en bout.

## Sprint 5 — Backend, automatisations, guides, QA
**Objectif** : livraison.
- Migrations Supabase (schéma 29 tables + RLS deny-all + policies + seed) ; `.env.example` ; adaptateur Supabase documenté.
- Automatisations simulées (12 déclencheurs) + documentation de raccordement e-mail/WhatsApp.
- `soleil-portal/README.md` : installation, déploiement, comptes démo ; guide administrateur ; guide acheteur ; checklist des données à compléter ; rapport de contrôle qualité (20 critères d'acceptation vérifiés un à un).
- QA : parcours, rôles, responsive, bilinguisme, accessibilité, exports, confidentialité ; build de production final.

## Suivi
| Sprint | Statut |
|---|---|
| 0 — Fondations documentaires | ✅ Livré |
| 1 — Socle technique | ✅ Livré |
| 2 — Expérience publique | ✅ Livré |
| 3 — Espace acheteur | ✅ Livré |
| 4 — Espace administrateur | ✅ Livré |
| 5 — Backend/guides/QA | À venir |
