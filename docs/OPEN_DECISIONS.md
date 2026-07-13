# Décisions ouvertes et points bloquants

Aucun de ces points ne bloque le développement du prototype (des placeholders administrables sont en place), mais tous doivent être arbitrés avant une mise en production commerciale.

## Décisions nécessitant la fondatrice / le propriétaire

| # | Décision | Contexte | Impact si non tranchée |
|---|---|---|---|
| D1 | **Curation visuelle finale des 16 références** | L'environnement de développement ne peut pas télécharger les pixels Dropbox (politique réseau). La sélection v1 est structurelle (équilibre des typologies). | La capsule wholesale peut contenir des pièces non prioritaires commercialement. Valider/replacer les références dans `docs/CONTENT_INVENTORY.md` §4 puis importer les images (`soleil-portal/scripts/import-assets.md`). |
| D2 | **Appariement détouré ↔ photo portée** | 55 photos éditoriales « FOND » non associées aux 59 détourés. | Fiches produit sans vue portée ; lookbook avec emplacements éditoriaux à compléter. |
| D3 | **Réexport de `Ensemble_Hommes_15.png`** | Fichier corrompu dans Dropbox (489 octets). | Référence inutilisable tant que non réexportée. |
| D4 | **Coordonnées officielles** | WhatsApp, e-mail commercial, Instagram, Facebook, adresse atelier figurent probablement sur les cartes de visite (`Communication/Cartes de visite/`) mais n'ont pas été extraites automatiquement (données personnelles → validation requise). | Placeholders visibles (`brand_settings`). |
| D5 | **Prix professionnels, PPC, MOQ, tailles, matières, délais** | Aucune donnée tarifaire confirmée. Le brief l'interdit explicitement : rien n'a été inventé. | Line Sheet fonctionnel mais affichant « à confirmer » ; marges non calculables. À saisir dans l'admin (`Prix`, `Conditions commerciales`). |
| D6 | **Noms commerciaux des pièces et intitulés de capsules** | Noms de travail proposés (administrables). | Publication possible telle quelle, mais validation de marque recommandée. |
| D7 | **Modèle dépôt-vente** | Prévu dans le pack (document 10) mais désactivé par défaut. | Activer dans l'admin si souhaité. |
| D8 | **Validation juridique des 15 documents/contrats types** | Mention obligatoire apposée sur chaque document généré. | Aucun document ne doit être signé sans revue juridique (OHADA / juridictions des partenaires). |

## Décisions techniques en attente

| # | Décision | Recommandation |
|---|---|---|
| T1 | **Création du projet Supabase** (URL + clés, exécution des migrations) | Dès la validation du prototype ; le mode démo reste utilisable pour la prospection hors ligne. |
| T2 | **Hébergement des images produits** | Supabase Storage (bucket `product-media`) en production ; `public/assets/` suffit pour le prototype. |
| T3 | **Fournisseur d'e-mails transactionnels + WhatsApp Business API** | Resend/Brevo pour l'e-mail ; ne rien envoyer sans configuration et autorisation explicites (notifications simulées en attendant). |
| T4 | **Domaine et hébergement front** | Vercel/Netlify (statique) ; `noindex` conservé sur les routes professionnelles. |
| T5 | **Export Excel natif (.xlsx)** | CSV compatible Excel livré ; `.xlsx` en amélioration future si besoin réel. |
| T6 | **Emplacement du code** | Le portail vit dans `soleil-portal/` de ce dépôt (qui héberge aussi « SAM 1 » sur `main`). Si Soleil Création doit vivre dans son propre dépôt, extraire le dossier tel quel — il est autonome. |

## Hypothèses prises (à infirmer si besoin)

- Devise par défaut du Line Sheet : **XAF (franc CFA)**, modifiable par grille tarifaire (EUR/USD prévus).
- Langue par défaut : FR (marché primaire), bascule EN persistante.
- La collection « Foire 2024 » constitue la base de la capsule wholesale v1 ; « Sénégal Thiakanam » et « COJEPROC » restent en archives.
- Les comptes de démonstration sont fictifs et marqués comme tels ; les statistiques du tableau de bord utilisent des données de démonstration étiquetées.
