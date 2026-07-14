# Checklist des données à compléter avant lancement commercial

Aucune de ces données n'a été inventée : le portail affiche « à confirmer » partout où la maison n'a pas encore tranché. Tout se renseigne dans l'administration, sans toucher au code.

## A. Identité et contacts (Administration → Paramètres)
- [ ] Logo officiel (fichier disponible : Dropbox `/Perso/Soleil Creation/Logo Soleil Création.jpeg` → `public/assets/brand/logo.png`)
- [ ] Numéro WhatsApp professionnel
- [ ] Adresse e-mail commerciale
- [ ] Compte Instagram
- [ ] Compte Facebook
- [ ] Adresse de l'atelier
- [ ] Portrait et biographie de Solina Rolla NGOMA (page La Maison)

## B. Visuels (scripts/import-assets.md)
- [ ] 16 packshots détourés de la capsule v1 (correspondance exacte dans `asset-manifest.json`)
- [ ] Photos portées appariées à chaque référence (décision D2)
- [ ] Réexport de `Ensemble_Hommes_15.png` (fichier corrompu — 489 octets)
- [ ] 6 photos de la boutique Shop Plateau (page La Maison)
- [ ] Validation de la curation des 16 références (décision D1)

## C. Données commerciales (Administration → Prix / Conditions / Produits)
- [ ] Prix professionnels par référence
- [ ] Prix publics conseillés par référence
- [ ] Quantités minimales (par pièce et minimum global)
- [ ] Matières (par pièce)
- [ ] Tailles disponibles et grille de tailles
- [ ] Coloris par pièce (variantes)
- [ ] Délais de production
- [ ] Capacité de production
- [ ] Modalités de paiement (FR + EN)
- [ ] Modalités de livraison / transport (FR + EN)
- [ ] Position douanes (FR + EN)
- [ ] Politique de retour (FR + EN)
- [ ] Politique de réclamation (FR + EN)
- [ ] Conditions de réassort (FR + EN)
- [ ] Conditions d'exclusivité éventuelles (FR + EN)
- [ ] Devise(s) de facturation et validité des prix
- [ ] Instructions d'entretien par pièce

## D. Éditorial (Administration → Produits / Capsules)
- [ ] Validation des noms commerciaux des 16 pièces (noms de travail actuels)
- [ ] Validation des intitulés et manifestes des 4 capsules
- [ ] Relecture des descriptions FR et EN

## E. Juridique et technique
- [ ] Revue juridique des 15 documents types avant toute signature (OHADA + juridictions des partenaires)
- [ ] Activation éventuelle du modèle dépôt-vente (désactivé par défaut)
- [ ] Création du projet Supabase + exécution des migrations (voir README)
- [ ] Choix du fournisseur e-mail transactionnel / WhatsApp Business API (rien n'est envoyé sans autorisation)
- [ ] Nom de domaine et hébergement du front
- [ ] Remplacement des comptes de démonstration par les comptes réels
