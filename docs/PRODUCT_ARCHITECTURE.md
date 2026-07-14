# Architecture produit et technique — Soleil Création Wholesale Portal

## 1. Emplacement dans le dépôt

Ce dépôt hébergeait déjà une application distincte (« SAM 1 », répertoires `client/` et `server/`, conservés intacts). Le portail Soleil Création est **autonome** :

```
soleil-portal/          # Application complète (Vite + React + TS + Tailwind)
  src/
    app/                # Routing, providers, layouts
    modules/            # lookbook, showroom, lineSheet, partnership, crm, admin…
    components/         # Design system (UI réutilisable)
    data/               # Couche d'accès aux données (voir §4)
    i18n/               # Dictionnaires FR/EN + provider
    content/            # Contenus éditoriaux bilingues structurés
  public/assets/        # Images produits (placeholders + emplacements réels)
  supabase/
    migrations/         # SQL (schéma + RLS + seed démo)
  scripts/              # Génération placeholders, manifeste assets
docs/                   # Documentation de référence (ce dossier)
```

Build : `cd soleil-portal && npm install && npm run build`. Aucun couplage avec le workspace pnpm existant.

## 2. Stack

| Couche | Choix | Justification |
|---|---|---|
| Front | React 18 + TypeScript + Vite | Standard demandé, DX rapide, build fiable |
| Styles | Tailwind CSS + tokens du design system | Palette/typo centralisées (`DESIGN_SYSTEM.md`) |
| Routing | React Router v6 (routes imbriquées + guards par rôle) | Trois espaces distincts |
| État | Contexts + reducers (auth, langue, sélection, notifications) | Structuré sans dépendance lourde |
| Formulaires | Validation maison typée (règles déclaratives, messages FR/EN) | Formulaires courts, messages compréhensibles |
| Images | Chargement différé (`loading="lazy"`), ratios réservés | Mobile d'abord (WhatsApp/Instagram) |
| Backend cible | Supabase (PostgreSQL, Auth, Storage, RLS) | Demandé ; migrations livrées |
| Mode prototype | Adaptateur local (données seed + localStorage) | Fonctionne sans Supabase configuré |

## 3. Les trois espaces et leur routing

### Public (`/`)
`/` Accueil · `/maison` La Maison · `/lookbook` Wholesale Lookbook (narration verticale) · `/capsules` + `/capsules/:slug` · `/signatures` Pièces signatures · `/devenir-partenaire` · `/acces-professionnel` (demande d'accès) · `/rendez-vous` · `/contact` · `/l/:token` (lien personnalisé de prospection → lookbook tracé).

### Acheteur (`/espace-pro`, rôle `buyer`)
`/espace-pro` Tableau de bord · `/espace-pro/showroom` · `/espace-pro/produit/:ref` · `/espace-pro/selection` Ma sélection · `/espace-pro/line-sheet` · `/espace-pro/devis/nouveau` · `/espace-pro/devis` Mes devis · `/espace-pro/commandes` · `/espace-pro/partenariat` Partnership Pack · `/espace-pro/documents` · `/espace-pro/organisation` · `/espace-pro/support`.

### Admin (`/admin`, rôles `sales_admin`/`content_admin`/`super_admin`)
`/admin` Vue d'ensemble · `produits` · `collections` · `capsules` · `medias` · `prix` · `conditions` · `demandes-acces` · `prospects` · `partenaires` · `selections` · `devis` · `commandes` · `documents` · `contrats` · `contenus` · `utilisateurs` · `statistiques` · `parametres` · `audit`.

### Système
`/connexion` · `/inscription` (création de compte professionnel) · `/mot-de-passe-oublie` · `/acces-refuse` (403) · `/lien-expire` · `*` (404) · `/erreur` (500) · `/maintenance`.

## 4. Couche de données isolée

Toute l'application consomme une interface unique `DataProvider` (`src/data/types.ts`) : `products`, `capsules`, `selections`, `accessRequests`, `quotes`, `orders`, `prospects`, `documents`, `activities`, `settings`…

- **Adaptateur démo** (`src/data/local/`) : seed structuré importé au premier lancement, mutations persistées en `localStorage` (la sélection survit au rafraîchissement — critère d'acceptation). Données de démonstration explicitement marquées « Données de démonstration / Demo data ».
- **Adaptateur Supabase** (`src/data/supabase/`) : même interface, appels PostgREST/Auth. Activation par `VITE_DATA_MODE=supabase` + variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

Le passage démo → réel ne modifie aucun composant d'interface.

## 5. Sécurité et confidentialité

- Prix professionnels, conditions commerciales, notes internes : **jamais** dans les routes publiques ; en mode Supabase, protégés par RLS (voir `DATA_MODEL.md` §5) — le masquage UI n'est qu'une seconde barrière.
- Notes internes CRM et champs `internal_*` : visibles uniquement des rôles admin (policy dédiée).
- Line Sheet : non indexé (`noindex`), accessible authentifié ou via `shared_links` (token, période de validité, désactivation, filigrane au nom de la boutique).
- Liens personnalisés `/l/:token` : consultation tracée (événement `lookbook_viewed`), révocables.
- Journal d'audit : toute mutation admin écrit dans `audit_logs`.

## 6. Modules fonctionnels

| Module | Contenu clé |
|---|---|
| Lookbook | Couverture immersive, manifeste, maison, portrait de Solina Rolla NGOMA, univers créatif, capsules éditoriales, pièces signatures, « Pourquoi Soleil Création », modèles de partenariat, CTA showroom ; partage ; export PDF léger (vue impression) ; générateur de liens personnalisés (admin). |
| Showroom | Grille premium ; filtres genre/capsule/catégorie/occasion/disponibilité ; recherche nom/référence ; tri nouveautés/disponibilité/priorité ; comparaison ; favoris ; demandes d'échantillon et de personnalisation. |
| Fiche produit | Galerie multi-vues + zoom, variantes, `name/description/editorial` FR-EN, prix pro + PPC, MOQ, délai, disponibilité, personnalisation, entretien, statut — champs inconnus : « à confirmer ». |
| Ma sélection | Lignes par produit/variante : tailles, couleurs, quantités indicatives, notes privées acheteur ; persistance ; partage ; conversion en demande de devis et en Line Sheet filtré. |
| Line Sheet | Vue tableau (desktop) / cartes (mobile), filtres, synthèse commerciale administrable (devise, validité, minimum global, paiement, délais, production, transport, douanes, retours, réclamations, réassort, exclusivité), calculs de marge, impression/PDF, export CSV (compatible Excel), lien sécurisé avec filigrane. |
| Partnership Pack | 4 modèles (gros, précommande, retail test, pop-up) ; « Choisir ce modèle » alimente la demande de devis ; bibliothèque des 15 documents types (voir §7). |
| Mini-CRM | 15 statuts pipeline (nouveau prospect → partenaire actif / opportunité perdue), fiche partenaire complète, historique d'interactions, tâches, documents liés. |
| Tableau de bord admin | Demandes d'accès, prospects récents, engagement, produits les plus vus/sélectionnés, sélections abandonnées, devis (volume/valeur/conversion), commandes, partenaires actifs, ventes par pays et capsule, réassorts, tâches ; filtres période/pays/type/statut/capsule/responsable ; données de démonstration marquées. |
| Automatisations | Centre de notifications simulé (voir §8). |

## 7. Documents du Partnership Pack (15 modèles)

1. Présentation du partenariat · 2. Formulaire d'identification de la boutique · 3. Fiche de sélection · 4. Demande de devis · 5. Devis · 6. Bon de commande · 7. Facture pro forma · 8. Accord de vente en gros · 9. Accord de précommande · 10. Accord de dépôt-vente (désactivé par défaut) · 11. Accord Retail Test · 12. Politique d'expédition · 13. Politique de réclamation · 14. Procès-verbal de réception · 15. Formulaire de demande de réassort.

Générés en HTML imprimable à partir des données du dossier ; chaque contrat porte l'avertissement : *« Modèle de document. Validation juridique requise avant toute utilisation ; ne constitue pas un conseil juridique et peut ne pas être suffisant dans toutes les juridictions. »*

## 8. Automatisations (simulées dans le prototype)

Événements → notifications internes (centre de notifications + `notifications`/`activities`) : demande d'accès, approbation, bienvenue, relance consultation sans sélection, relance sélection abandonnée, demande de devis, devis disponible, rappel avant expiration, acceptation, confirmation de commande, expédition, retour d'expérience.
Aucun message réel n'est envoyé. La connexion future (fournisseur e-mail type Resend/Brevo, WhatsApp Business API) est documentée dans le code (`src/data/notifications.ts`) et nécessitera configuration et autorisation explicites.

## 9. Exports

- **Line Sheet PDF** : feuille de styles d'impression dédiée (A4 paysage) → « Imprimer / Enregistrer en PDF ».
- **CSV** : généré côté client (UTF-8 BOM, séparateur `;`) — s'ouvre dans Excel ; un export `.xlsx` natif est noté en amélioration future.
- **Lookbook PDF léger** : vue impression éditoriale.

## 10. Déploiement

Cible : hébergement statique (Vercel/Netlify) + projet Supabase. `.env.example` fourni ; migrations dans `soleil-portal/supabase/migrations/` exécutables via `supabase db push` ou l'éditeur SQL. Instructions complètes dans `soleil-portal/README.md`.
