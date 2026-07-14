# Import des visuels depuis Dropbox

L'environnement qui a généré ce prototype ne pouvait pas télécharger les binaires Dropbox (politique réseau). L'application est prête à recevoir les images : chaque emplacement attendu est décrit dans `asset-manifest.json`, et tout emplacement vide affiche un placeholder clairement identifié.

## Procédure (depuis une machine avec accès Dropbox)

1. Ouvrir `scripts/asset-manifest.json` : chaque entrée donne le fichier Dropbox source (`dropboxPath`) et la destination dans le projet (`target`).
2. Télécharger les fichiers sources depuis Dropbox (`/Perso/Soleil Creation/…`).
3. Optimiser avant dépôt :
   - packshots détourés : PNG (ou WebP) — largeur max 1600 px ;
   - photos éditoriales : JPEG qualité ~80 — largeur max 1600 px (les originaux font 8–20 Mo, inutilisables tels quels sur le web) ;
   - exemple avec ImageMagick : `magick "SOLEIL CREATION VETEMENTS FOND 1.jpg" -resize 1600x1600\> -quality 80 editorial-1.jpg`.
4. Déposer chaque fichier exactement au chemin `target` (créer les dossiers `public/assets/products/<REF>/`).
5. Relancer l'application : les images remplacent automatiquement les placeholders (aucun code à modifier).
6. Dans l'administration → Médias, passer `is_placeholder` à faux pour tracer l'avancement (optionnel en mode démo).

## Points d'attention

- `Ensemble_Hommes_15.png` est corrompu dans Dropbox (489 octets) : le réexporter avant usage.
- Le sous-dossier `Shooting/wetransfer_…/` et l'archive `.zip` sont des doublons des photos FOND 49–74 : ne pas les importer.
- L'appariement photo portée ↔ produit détouré n'est pas encore arbitré (décision D2, `docs/OPEN_DECISIONS.md`) : choisir pour chaque référence la photo « FOND » correspondante et la déposer en `editorial-1.jpg`.
- En production Supabase, déposer plutôt les fichiers dans le bucket `product-media` et renseigner `product_media.storage_path` ; `public/assets/` reste la solution du prototype.
