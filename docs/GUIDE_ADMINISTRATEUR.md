# Guide administrateur — Soleil Création Wholesale Portal

Connexion : `/connexion` avec un compte admin (démo : `direction@soleilcreation.example` / `soleil2026`). L'administration est sur `/admin`.

## 1. Prendre en main le portail (première semaine)

1. **Paramètres** : renseigner WhatsApp, e-mail, Instagram, Facebook, adresse de l'atelier — ces valeurs remplacent les placeholders partout (pied de page, contact, documents).
2. **Prix** : saisir prix professionnels et prix publics conseillés (les marges se calculent automatiquement ; champ vide = « à confirmer »).
3. **Conditions commerciales** : compléter la synthèse du Line Sheet (paiement, livraison, douanes, retours, réclamations, réassort, exclusivité) en FR et EN.
4. **Médias** : importer les visuels depuis Dropbox (procédure `soleil-portal/scripts/import-assets.md`) — chaque emplacement liste son fichier source exact.
5. **Produits** : relire les noms de travail, descriptions FR/EN, capsules, pièces vedettes ; compléter matières/tailles/délais/MOQ au fil des validations.

## 2. Cycle commercial quotidien

### Demandes d'accès (`/admin/demandes-acces`)
Chaque candidature affiche le profil complet de la boutique. **Approuver** crée automatiquement l'organisation, le compte acheteur (mot de passe démo : `soleil2026` ; en production : invitation Supabase) et la notification de bienvenue. **Refuser** exige un motif.

### Prospects (`/admin/prospects`)
Pipeline en 15 statuts — les statuts marqués automatiques avancent seuls (lookbook consulté, accès demandé, showroom consulté, sélection commencée, devis demandé…). Sur chaque fiche :
- **Notes internes** : jamais visibles par la boutique.
- **Tâches de suivi** : votre liste de relances.
- **Lien lookbook personnalisé** : bouton dédié → URL `/l/<token>` à envoyer par WhatsApp/e-mail ; chaque consultation est tracée et avance le pipeline.

### Devis (`/admin/devis`)
Une demande arrive avec les pièces, variantes et quantités indicatives de la sélection. Renseigner les prix unitaires, transport, délais et date de validité, puis **« Enregistrer et envoyer »** : la boutique est notifiée et peut accepter, demander une modification (commentaire visible sur le devis) ou refuser. L'acceptation crée la commande.

### Commandes (`/admin/commandes`)
Faire avancer le statut (préparation → confirmée → expédiée → livrée → clôturée). « Expédiée » notifie la boutique et met le pipeline à jour ; « Livrée » passe la boutique en Partenaire actif.

### Documents (`/admin/documents`)
Les 15 modèles du Partnership Pack se génèrent fusionnés avec le dossier d'une boutique et s'impriment en PDF. **Chaque document porte l'avertissement : validation juridique requise avant utilisation.**

## 3. Pilotage

- **Vue d'ensemble** : demandes à traiter, activité récente, tâches — avec la prochaine action prioritaire en tête de page.
- **Statistiques** : demandes, consultations lookbook, sélections abandonnées, valeur des devis, conversion, commandes, pipeline — filtres période/pays/statut/capsule. Les données du prototype sont marquées « données de démonstration ».
- **Journal d'audit** : chaque modification administrateur est consignée.

## 4. Contenus et catalogue

- **Produits** : tout est éditable sans code — noms/descriptions/éditoriaux FR-EN, capsule, catégorie, visibilité (publique = visible du lookbook sans prix ; professionnelle = showroom seulement), pièce vedette, ordre, disponibilité, archivage, duplication en brouillon pour créer une nouvelle fiche.
- **Capsules** : noms et manifestes FR/EN.
- Les 43 visuels non retenus dans la capsule v1 restent disponibles dans Dropbox pour de futures fiches (dupliquer une fiche existante puis adapter).

## 5. Rôles

| Rôle | Droits |
|---|---|
| `sales_admin` | Prospects, devis, commandes, prix, conditions, documents |
| `content_admin` | Produits, capsules, médias, contenus, paramètres |
| `super_admin` | Tout, y compris utilisateurs et suppressions |

En production, ces droits sont garantis par les politiques RLS de la base (pas seulement par l'interface).
