# Modèle de données — Soleil Création Wholesale Portal

Implémentation : `soleil-portal/supabase/migrations/*.sql` (schéma, RLS, seed démo). Le mode démo local reproduit fidèlement ces structures en TypeScript (`src/data/types.ts`).

## 1. Principes

- **Identifiants stables** : UUID générés (`gen_random_uuid()`), jamais de noms de fichiers ni de libellés comme identifiants métier. Les produits portent en plus une référence commerciale lisible unique (`reference`, ex. `SC-H-003`).
- **Multilingue** : colonnes `*_fr` / `*_en` pour les contenus ; les valeurs techniques (références, codes, montants) ne sont pas dupliquées.
- **Aucune valeur inventée** : les champs commerciaux non confirmés sont `NULL` et affichés « à confirmer » ; ils sont administrables.
- **Multi-devises et grilles tarifaires** : les prix vivent dans `wholesale_prices` (produit/variante × grille × devise), pas sur le produit.
- **Traçabilité** : `activities` (événements), `audit_logs` (mutations admin), horodatage `created_at`/`updated_at` partout.

## 2. Tables (28)

### Identité et comptes
| Table | Rôle | Champs clés |
|---|---|---|
| `profiles` | Extension de `auth.users` | `user_id (PK→auth)`, `role (public/buyer/sales_admin/content_admin/super_admin)`, `full_name`, `locale`, `organization_id` |
| `organizations` | Boutiques / distributeurs | raison sociale, nom commercial, type de boutique, adresse, ville, pays, e-mail, whatsapp, site, instagram, clientèle cible, gamme de prix, marques distribuées, pays de livraison, modèle de partenariat préféré, `potential_estimate`, `internal_notes` (admin only), `pipeline_status` (15 statuts) |
| `buyer_accounts` | Lien utilisateur ↔ organisation + état d'approbation | `organization_id`, `user_id`, `status (pending/approved/suspended)`, `approved_by`, `approved_at` |

### Catalogue
| Table | Rôle | Champs clés |
|---|---|---|
| `collections` | Collections (ex. Foire 2024) | `name_fr/en`, `season`, `is_active` |
| `capsules` | Capsules éditoriales | `slug`, `name_fr/en`, `manifesto_fr/en`, `display_order`, `collection_id` |
| `products` | Pièces | `reference (unique)`, `capsule_id`, `category (ensemble/robe/boubou/gilet/haut)`, `gender (femme/homme/mixte)`, `occasions[]`, `name_fr/en`, `description_fr/en`, `editorial_text_fr/en`, `materials_fr/en (nullable)`, `care_fr/en (nullable)`, `customization_fr/en (nullable)`, `lead_time_days (nullable)`, `min_order_qty (nullable)`, `availability (available/on_request/preorder/sold_out/tbc)`, `visibility (public/professional)`, `status (draft/active/archived)`, `is_featured`, `display_order`, `commercial_priority` |
| `product_variants` | Variantes | `product_id`, `color_fr/en`, `size_scale`, `sizes[] (nullable)`, `sku (nullable)`, `availability` |
| `product_media` | Médias multiples | `product_id`, `kind (packshot/editorial/video)`, `storage_path`, `source_note` (chemin Dropbox d'origine), `alt_fr/en`, `display_order`, `is_placeholder` |
| `wholesale_prices` | Grilles tarifaires | `product_id`, `variant_id (nullable)`, `price_list (standard/…)`, `currency`, `wholesale_price (nullable)`, `rrp (nullable)`, `valid_from/until` — marges calculées, jamais stockées |
| `commercial_terms` | Synthèse commerciale administrable | devise par défaut, validité des prix, minimum global, paiement, délais, production, transport, douanes, retours, réclamations, réassort, exclusivité — tous `nullable` (« à confirmer ») ; versionné FR/EN |

### Cycle commercial
| Table | Rôle | Champs clés |
|---|---|---|
| `selections` | « Ma sélection » | `organization_id`, `created_by`, `name`, `status (open/shared/quoted/abandoned)` |
| `selection_items` | Lignes de sélection | `selection_id`, `product_id`, `variant_id`, `size_notes`, `color_notes`, `indicative_qty`, `buyer_notes` (privées acheteur) |
| `access_requests` | Demandes d'accès pro | données formulaire, `status (pending/approved/rejected)`, `decided_by/at`, `rejection_reason` |
| `appointments` | Rendez-vous | canal (visio/WhatsApp/showroom), créneaux souhaités, `status` |
| `quote_requests` | Demandes de devis | `selection_id`, `partnership_model`, message, `status` |
| `quotes` | Devis | `quote_request_id`, `number`, devise, remise, transport, douanes estimées, délais, `valid_until`, `status (draft/sent/accepted/change_requested/rejected/expired)`, `buyer_comment` |
| `quote_items` | Lignes de devis | produit/variante, qty, prix unitaire négocié, total ligne |
| `orders` | Commandes | `quote_id`, `number`, `status (preparing/confirmed/shipped/delivered/closed)`, incoterm (nullable), suivi expédition |
| `order_items` | Lignes de commande | idem quote_items |
| `partnership_models` | 4 modèles A–D | `code`, contenus FR/EN structurés (fonctionnement, profils, avantages, responsabilités, étapes, documents, conditions à confirmer), `is_active` |
| `partnership_applications` | Choix de modèle par une organisation | `organization_id`, `model_code`, `status` |

### Documents et suivi
| Table | Rôle | Champs clés |
|---|---|---|
| `documents` | Bibliothèque (15 types du pack + pièces jointes) | `kind`, `organization_id (nullable)`, `storage_path`, visibilité, version |
| `contracts` | Contrats générés | `template_code`, `organization_id`, données de fusion, `legal_disclaimer` toujours affiché, `status (draft/sent/signed_offline)` |
| `communications` | Échanges tracés | organisation, canal, direction, résumé, horodatage |
| `activities` | Événements produit/CRM | `type` (lookbook_viewed, showroom_viewed, selection_started, quote_requested…), acteur, cible, métadonnées JSON |
| `tasks` | Tâches de suivi admin | assigné, échéance, lien prospect/devis, `status` |
| `notifications` | Notifications simulées | destinataire, `template_code`, payload, `read_at`, `simulated=true` |
| `shared_links` | Liens sécurisés | `token (unique)`, portée (lookbook/selection/linesheet), `organization_id`, filigrane, `expires_at`, `revoked_at`, compteur de vues |
| `audit_logs` | Journal d'audit | acteur, action, table, `record_id`, diff JSON |

### Configuration
`brand_settings` (clé/valeur typée, FR/EN) : les 17 placeholders du brief (logo, WhatsApp, e-mail, Instagram, Facebook, adresse atelier, matières par défaut, tailles, politique de retour, exclusivité…) + textes institutionnels. *(29ᵉ table, support des placeholders centralisés.)*

## 3. Capacités produit exigées (vérification)

Chaque produit gère : plusieurs images (`product_media`), plusieurs langues (colonnes `_fr/_en`), plusieurs variantes (`product_variants`), plusieurs devises et grilles (`wholesale_prices`), statuts de disponibilité, visibilité publique/professionnelle, ordre d'affichage, pièce vedette, archivage (`status=archived`).

## 4. Formules (calculées à l'affichage)

```
marge_brute = rrp - wholesale_price                     -- valeur, même devise
taux_marge_pv = (rrp - wholesale_price) / rrp * 100     -- % sur prix de vente
```
Affichées uniquement si les deux prix sont renseignés ; sinon « à confirmer ».

## 5. Row Level Security (résumé des politiques)

Helpers SQL : `current_role()` (depuis `profiles`), `current_org()` ; `is_admin()` = rôle ∈ {sales_admin, content_admin, super_admin}.

| Domaine | public (anon) | buyer | sales_admin | content_admin | super_admin |
|---|---|---|---|---|---|
| `products` visibles | `visibility='public' AND status='active'` (sans prix) | `status='active'` | tout | tout (write) | tout |
| `wholesale_prices`, `commercial_terms` | aucun accès | lecture (compte `approved`) | lecture/écriture | lecture | tout |
| `selections`, `selection_items`, `quote_requests`, `quotes`, `orders`, `documents`, `contracts` | — | lignes de **son** `organization_id` uniquement | tout | lecture | tout |
| `organizations.internal_notes`, `communications`, `tasks`, `activities`, `audit_logs`, `notifications` admin | — | **jamais** (colonne/table exclues des vues buyer) | oui | partiel | oui |
| `access_requests`, `appointments` | insertion seule (formulaire) | ses lignes | tout | lecture | tout |
| `brand_settings`, `partnership_models`, `capsules`, `collections` | lecture (champs publics) | lecture | lecture | écriture | tout |
| `shared_links` | résolution par token (fonction `security definer`) | ses liens | tout | — | tout |

Notes d'implémentation : `internal_notes` est exposé via une vue admin distincte (jamais dans la vue lue par les buyers) ; l'insertion publique de `access_requests` passe par une fonction RPC avec validation ; toutes les tables ont `ENABLE ROW LEVEL SECURITY` et **aucune** policy par défaut (deny-all).

## 6. Diagramme des relations principales

```
organizations 1─n buyer_accounts n─1 profiles(auth)
organizations 1─n selections 1─n selection_items n─1 products
selections 1─1 quote_requests 1─1 quotes 1─n quote_items
quotes 1─1 orders 1─n order_items
products n─1 capsules n─1 collections
products 1─n product_variants / product_media / wholesale_prices
organizations 1─n documents / contracts / communications / activities / tasks / shared_links
partnership_models 1─n partnership_applications n─1 organizations
```
