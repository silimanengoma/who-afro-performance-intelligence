# Inventaire des contenus et correspondance des assets

Diagnostic réalisé le 13/07/2026 sur le Dropbox du compte propriétaire (`/Perso/Soleil Creation/`), dossier cible du lien partagé : `Foire 2024/Optimisées`.

## 1. État d'accès — important

L'inventaire complet (noms, tailles, structure, identifiants Dropbox) a été réalisé via le connecteur Dropbox. **Le téléchargement des pixels est impossible depuis l'environnement de développement** : la politique réseau bloque tous les hôtes de contenu Dropbox (`*.dl.dropboxusercontent.com`, `*.previews.dropboxusercontent.com` — connexion refusée). Conformément au plan de repli du cahier des charges :

- l'application embarque des **placeholders clairement identifiés** (aplat sable, monogramme, mention « Visuel à intégrer — {réf} ») ;
- la correspondance exacte **asset attendu → fichier Dropbox** figure en §5 et dans `soleil-portal/scripts/asset-manifest.json` ;
- un script d'import (`soleil-portal/scripts/import-assets.md`) documente la procédure depuis une machine disposant de l'accès Dropbox ;
- **aucun vêtement fictif généré par IA** ne remplace les créations.

Conséquence assumée : la curation visuelle fine (choix des « meilleures » images, appariement détouré ↔ photo portée) ne peut pas être arbitrée ici ; elle est préparée structurellement et listée dans `docs/OPEN_DECISIONS.md` (D1, D2).

## 2. Inventaire des visuels wholesale (Foire 2024)

### 2a. Visuels détourés « Optimisées » (PNG, fonds transparents, 1,4–3,3 Mo) — 59 fichiers
| Groupe | Fichiers | Compte | Observations |
|---|---|---|---|
| Ensembles hommes | `Ensemble_Hommes_3..32.png` + `Ensemble_2.png` | 31 exploitables | **`Ensemble_Hommes_15.png` corrompu (489 octets) — à réexporter** ; numérotation commençant à 2/3 (1 absent) |
| Robes | `Femmes/Robes_1..22.png` | 22 | Série complète |
| Boubous | `Boubou1.png`, `Boubou_2.png` | 2 | |
| Gilets | `Gilet_01.png`, `Gilet_02.png` | 2 | |
| Hauts | `Haut_02.png`, `Haut_03.png` | 2 | `Haut_01` absent |

### 2b. Shooting professionnel porté (JPG haute définition, 7,7–19,5 Mo) — 55 uniques
`Shooting/SOLEIL CREATION VETEMENTS FOND 1..30.jpg` et `49..74.jpg` (les numéros 31–48 sont absents du dossier).
**Doublons identifiés** : le sous-dossier `Shooting/wetransfer_soleil-creation-vetements_2024-12-11_2047/` duplique intégralement les FOND 49–74 (26 fichiers identiques, hachages égaux) ; l'archive `wetransfer_...zip` (291 Mo) est la source de ces mêmes fichiers. → **À ignorer pour l'intégration.**

### 2c. Typologie éditoriale
- *Visuels produits* : les PNG détourés (fond transparent) — base des fiches produit et du Line Sheet.
- *Visuels éditoriaux* : les JPG portés « FOND » — base du Lookbook, des couvertures de capsules et des ambiances.
- *Appariement détouré ↔ porté* : non arbitrable sans accès aux pixels ; le manifeste réserve pour chaque référence un emplacement `editorial` à compléter (décision D2).

## 3. Autres ressources utiles découvertes

| Ressource | Chemin Dropbox | Usage potentiel |
|---|---|---|
| Logo | `/Perso/Soleil Creation/Logo Soleil Création.jpeg` | `[LOGO OFFICIEL]` |
| Griffe | `/Perso/Soleil Creation/Griffe SOLEIL CREATION.jpeg` | Identité, filigrane |
| Présentation maison (2020) | `Présentation Soleil Création.docx` | Manifeste — mission authentique : « réconcilier les hommes et les femmes avec leur culture et leur patrimoine immatériel » ; collection Sénégal Thiakanam (téranga, soutoura, diom) |
| Lookbook PDF existant | `Soleil Création — Lookbook professionnel.pdf` | Référence de ton |
| Bannières | `Communication/Bannière.jpg`, `Bannière actualisée.png` | Couvertures |
| Cartes de visite (FR + EN) | `Communication/Cartes de visite/Card NGOMA*.pdf` | Coordonnées à extraire (décision D4) |
| Boutique « Shop Plateau » | `Shop Plateau/Images/Après/*.jpeg` (6 photos, oct. 2025) | Section « La Maison » (le showroom physique) |
| Collections antérieures | `Senegal Thiakanam/Shooting` (48), `Collection COJEPROC 2019` (10), `Modèles Hommes` (12) | Hors périmètre capsule wholesale v1 ; archives |
| Documents commerciaux existants | `PROFORMA MME NGOMA.pdf`, `Bon de Commande Chemises.docx`, `Formulaire_mesures_tailleur.*` | Références pour les modèles du Partnership Pack |

## 4. Capsule wholesale v1 — sélection curatoriale (16 références)

Critères appliqués (structurels, faute d'accès visuel) : équilibre genres et typologies, couverture des 4 capsules éditoriales, numéros distincts pour minimiser le risque de doublon produit. Noms commerciaux = **noms de travail administrables** (aucun fait) ; prix, matières, tailles = à confirmer.

| Référence | Source détourée (Dropbox `Foire 2024/Optimisées/`) | Catégorie | Capsule proposée |
|---|---|---|---|
| SC-H-003 | `Ensemble_Hommes_3.png` | Ensemble homme | L'Exécutif de Brazzaville |
| SC-H-005 | `Ensemble_Hommes_5.png` | Ensemble homme | L'Exécutif de Brazzaville |
| SC-H-008 | `Ensemble_Hommes_8.png` | Ensemble homme | L'Exécutif de Brazzaville |
| SC-H-011 | `Ensemble_Hommes_11.png` | Ensemble homme | L'Exécutif de Brazzaville |
| SC-H-017 | `Ensemble_Hommes_17.png` | Ensemble homme | Cérémonie & Distinction |
| SC-H-024 | `Ensemble_Hommes_24.png` | Ensemble homme | Cérémonie & Distinction |
| SC-H-028 | `Ensemble_Hommes_28.png` | Ensemble homme | Signatures de Brazzaville |
| SC-F-001 | `Femmes/Robes_1.png` | Robe | La Femme Soleil |
| SC-F-004 | `Femmes/Robes_4.png` | Robe | La Femme Soleil |
| SC-F-007 | `Femmes/Robes_7.png` | Robe | La Femme Soleil |
| SC-F-012 | `Femmes/Robes_12.png` | Robe | Cérémonie & Distinction |
| SC-F-016 | `Femmes/Robes_16.png` | Robe | La Femme Soleil |
| SC-F-020 | `Femmes/Robes_20.png` | Robe | Cérémonie & Distinction |
| SC-B-001 | `Boubou1.png` | Boubou | Cérémonie & Distinction |
| SC-G-001 | `Gilet_01.png` | Gilet | Signatures de Brazzaville |
| SC-T-002 | `Haut_02.png` | Haut | Signatures de Brazzaville |

Les 43 autres visuels détourés restent importables (produits `draft` pré-créés pour les 16 retenus uniquement ; le reste s'ajoute via l'admin).

### Capsules éditoriales retenues (4)
1. **L'Exécutif de Brazzaville** / *The Brazzaville Executive* — vestiaire de fonction et de représentation masculin.
2. **La Femme Soleil** / *The Soleil Woman* — robes d'affirmation, du bureau au soir.
3. **Cérémonie & Distinction** / *Ceremony & Distinction* — pièces d'apparat, mariages, événements officiels.
4. **Signatures de Brazzaville** / *Brazzaville Signatures* — gilets, hauts et pièces d'appoint qui signent une silhouette.

Justification : la collection réelle est structurée hommes/robes/boubous/gilets/hauts ; ces quatre axes couvrent la vie professionnelle, la représentation, la cérémonie et la diaspora, conformément au positionnement. Les intitulés restent administrables.

## 5. Correspondance des assets applicatifs

Convention d'emplacement : `soleil-portal/public/assets/products/{REFERENCE}/packshot.png` (+ `editorial-1.jpg`…), `public/assets/brand/{logo.png, griffe.png, banner.jpg}`, `public/assets/maison/shop-plateau-{1..6}.jpg`.
Le manifeste machine-lisible `soleil-portal/scripts/asset-manifest.json` liste chaque emplacement attendu avec : chemin Dropbox source exact, `file_id` Dropbox stable, usage, statut (`placeholder`). Procédure d'import : `soleil-portal/scripts/import-assets.md` (téléchargement depuis Dropbox, redimensionnement ≤ 1600 px, compression, dépôt dans `public/assets/`, `is_placeholder=false`).

## 6. Données textuelles à extraire ultérieurement

Cartes de visite (téléphone/WhatsApp/e-mail/réseaux), plaquette « COOPERATION ECO », lookbook PDF existant — leur contenu texte n'a pas été intégré automatiquement ; à valider avec la fondatrice avant publication (décision D4).
