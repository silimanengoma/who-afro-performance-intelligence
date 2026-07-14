# Cartographie des parcours utilisateurs

Principe transverse : **chaque écran indique la prochaine action attendue** (bandeau « Prochaine étape » contextuel, piloté par le statut du dossier).

## 1. Parcours principal — de la prospection à la commande

| # | Étape | Acteur | Écran | Prochaine action affichée |
|---|---|---|---|---|
| 1 | Reçoit un lien personnalisé `/l/:token` | Boutique | Lookbook (tracé) | « Découvrir la collection » |
| 2 | Découvre le Wholesale Lookbook | Boutique | `/lookbook` | « Demander l'accès professionnel » |
| 3 | Consulte identité et capsules | Boutique | `/maison`, `/capsules` | idem |
| 4 | Demande l'accès professionnel | Boutique | `/acces-professionnel` | « Votre demande est à l'étude » |
| 5 | Examine et approuve | Admin | `/admin/demandes-acces` | « Approuver / Refuser » |
| 6 | Accède au Showroom | Acheteur | `/espace-pro/showroom` | « Explorer et constituer votre sélection » |
| 7 | Filtre les produits | Acheteur | Showroom (filtres) | — |
| 8 | Consulte les fiches détaillées | Acheteur | `/espace-pro/produit/:ref` | « Ajouter à ma sélection » |
| 9 | Ajoute des modèles à sa sélection | Acheteur | Fiche produit | « Voir ma sélection » |
| 10 | Précise tailles, couleurs, quantités | Acheteur | `/espace-pro/selection` | « Consulter le Line Sheet » / « Demander un devis » |
| 11 | Consulte le Line Sheet correspondant | Acheteur | `/espace-pro/line-sheet?selection=1` | « Demander un devis » |
| 12 | Choisit un modèle de partenariat | Acheteur | `/espace-pro/partenariat` | « Choisir ce modèle » |
| 13 | Transmet la demande de devis | Acheteur | `/espace-pro/devis/nouveau` | « Demande envoyée — réponse sous X jours (à confirmer) » |
| 14 | Reçoit une notification | Admin | Centre de notifications | « Traiter la demande » |
| 15 | Ajuste prix, quantités, transport, délais | Admin | `/admin/devis/:id` | « Envoyer le devis » |
| 16 | Devis généré et publié | Admin | idem | — |
| 17 | Accepte / demande modification / refuse | Acheteur | `/espace-pro/devis/:id` | 3 boutons explicites |
| 18 | Acceptation → processus de commande | Système | `/espace-pro/commandes/:id` | « Suivre la commande » |
| 19 | Documents commerciaux conservés | Acheteur | `/espace-pro/documents` | — |
| 20 | Suit l'opportunité | Admin | `/admin` + `/admin/prospects/:id` | Tâches de suivi |

## 2. Statuts pipeline (mini-CRM) et transitions

`Nouveau prospect` → `Contacté` → `Lookbook consulté` (auto via /l/:token) → `Accès demandé` (auto) → `Accès approuvé` → `Showroom consulté` (auto) → `Sélection commencée` (auto) → `Devis demandé` (auto) → `Devis envoyé` → `Négociation` → `Accord conclu` → `Commande en préparation` → `Commande expédiée` → `Partenaire actif`. Sortie possible à tout moment : `Opportunité perdue` (motif requis).
Les statuts marqués (auto) sont mis à jour par les événements applicatifs ; les autres manuellement par l'admin.

## 3. Parcours secondaires

### 3a. Candidature partenaire (sans lien personnalisé)
Accueil → « Devenir partenaire » → présentation des 4 modèles → formulaire d'identification (raison sociale, type de boutique, ville/pays, contacts, clientèle, gamme de prix, marques distribuées, modèle préféré) → accusé de réception → création du prospect (`Accès demandé`).

### 3b. Prise de rendez-vous
`/rendez-vous` : formulaire court (nom, organisation, canal préféré visioconférence/WhatsApp/showroom Brazzaville, créneaux souhaités) → notification admin → `appointments`. Confirmation manuelle par l'équipe (pas de calendrier temps réel dans le prototype).

### 3c. Demande d'échantillon / personnalisation
Depuis une fiche produit (acheteur connecté) → formulaire court → notification admin → tracé dans `activities` et visible dans le dossier prospect.

### 3d. Cycle de vie du devis
`brouillon` (admin) → `envoyé` → `accepté` | `modification demandée` (commentaire acheteur → retour brouillon) | `refusé` | `expiré` (date de validité dépassée ; rappel simulé avant expiration). Acceptation → création de commande `en préparation` → `confirmée` → `expédiée` → `livrée` (PV de réception disponible) ; réassort possible via formulaire dédié.

### 3e. Partage de sélection et de Line Sheet
Acheteur ou admin génère un lien sécurisé (`shared_links`) : token, portée (sélection ou line sheet), période de validité, filigrane nom de boutique, désactivation à tout moment. Consultation via `/partage/:token` sans indexation.

### 3f. Administration des contenus
`content_admin` édite textes FR/EN (manifeste, maison, capsules, produits), remplace les médias, réordonne l'affichage, marque les pièces vedettes, archive — sans toucher au code. Chaque champ inconnu affiche « à confirmer » tant qu'il n'est pas renseigné.

## 4. États d'erreur et vides (conçus, pas subis)

- Connexion refusée / compte non approuvé → `/acces-refuse` avec explication et lien « Prendre rendez-vous ».
- Lien de partage expiré ou révoqué → `/lien-expire` avec CTA « Demander un nouvel accès ».
- Sélection vide → invitation à explorer le showroom (CTA).
- Showroom sans résultat de filtre → « Aucune pièce ne correspond » + réinitialisation des filtres.
- Devis absents / commandes absentes / documents absents → états vides avec prochaine étape.
- 404 / erreur technique / maintenance : pages dédiées, ton de la maison, retour à l'accueil.

## 5. Responsive — priorités par appareil

- **Desktop** : acheteurs professionnels (tableaux complets, comparaison, exports).
- **Tablette** : rendez-vous showroom (navigation fiche à fiche, galerie).
- **Mobile** : prospects venant de WhatsApp/Instagram — menu compact, bouton « Ma sélection » persistant, filtres en tiroir, formulaires courts, actions WhatsApp/e-mail visibles, Line Sheet en cartes, aucune table à défilement horizontal illisible.
