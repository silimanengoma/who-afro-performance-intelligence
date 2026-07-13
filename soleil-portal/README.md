# SOLEIL CRÉATION — Wholesale Portal

Portail de développement commercial B2B de la maison Soleil Création
(Brazzaville, République du Congo) : Lookbook, Showroom interactif, Line Sheet
et Retail Partnership Pack dans une seule expérience bilingue FR/EN.

Documentation produit complète : dossier [`../docs/`](../docs/) —
brief, architecture, parcours, modèle de données, design system, inventaire
des contenus, décisions ouvertes, guides et rapport qualité.

## Installation

```bash
cd soleil-portal
npm install
npm run dev        # http://localhost:5173
```

Aucun backend requis : le portail démarre en **mode démonstration**
(`VITE_DATA_MODE=local`), avec persistance dans le navigateur (localStorage).
Les données de démonstration sont clairement marquées comme fictives.

## Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Acheteur (boutique) | `boutique@demo.example` | `soleil2026` |
| Admin ventes | `ventes@soleilcreation.example` | `soleil2026` |
| Admin contenus | `contenus@soleilcreation.example` | `soleil2026` |
| Direction (super admin) | `direction@soleilcreation.example` | `soleil2026` |

Réinitialisation des données : Administration → Paramètres → « Réinitialiser la démonstration ».

## Build et contrôle qualité

```bash
npm run build            # build de production (tsc + vite)
npm run preview          # sert le build
node scripts/e2e-check.mjs   # QA de bout en bout (Playwright + Chromium)
```

## Images produits

Les visuels de la collection (Dropbox `/Perso/Soleil Creation/Foire 2024/`)
n'ont pas pu être téléchargés depuis l'environnement de génération (politique
réseau) : l'application affiche des **placeholders clairement identifiés** et
remplace automatiquement chaque emplacement dès que le fichier est déposé.

- Correspondance exacte : [`scripts/asset-manifest.json`](scripts/asset-manifest.json)
- Procédure d'import : [`scripts/import-assets.md`](scripts/import-assets.md)

## Passage au backend Supabase

1. Créer un projet Supabase, exécuter les migrations de
   [`supabase/migrations/`](supabase/migrations/) dans l'ordre
   (schéma → RLS → seed).
2. Copier `.env.example` en `.env` et renseigner `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY`, puis `VITE_DATA_MODE=supabase`.
3. Suivre [`src/data/supabase-adapter.md`](src/data/supabase-adapter.md).

La sécurité est portée par les politiques RLS (deny-all par défaut) : prix
professionnels et conditions invisibles du public, dossiers cloisonnés par
boutique, notes internes réservées à l'administration.

## Déploiement (front statique)

```bash
npm run build      # produit dist/
```

- **Vercel** : importer le dossier `soleil-portal`, framework « Vite »,
  build `npm run build`, output `dist`. Ajouter une réécriture SPA
  (`/* → /index.html`).
- **Netlify** : build `npm run build`, publish `dist`, fichier `_redirects` :
  `/* /index.html 200`.
- Renseigner les variables d'environnement du `.env.example` dans l'hébergeur.
- Les routes professionnelles ne doivent pas être indexées : conserver la
  balise robots par défaut et éviter tout sitemap sur `/espace-pro` et `/admin`.

## Automatisations

Les 12 notifications du cycle commercial sont **simulées** (centre de
notifications interne). Raccordement e-mail/WhatsApp documenté dans
[`src/data/notifications.md`](src/data/notifications.md) — rien n'est envoyé
sans configuration et autorisation explicites.

## Structure

```
src/
  components  content  data  i18n  pages/{public,buyer,admin,system}  utils
supabase/migrations/   # 0001_schema.sql · 0002_rls.sql · 0003_seed.sql
scripts/               # asset-manifest.json · import-assets.md · e2e-check.mjs
```
