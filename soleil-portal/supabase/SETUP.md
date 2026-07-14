# Activer la base Supabase du portail — mode d'emploi

Projet : `https://mmmyjhnonglffxggtrii.supabase.co`
(la clé « publishable » est déjà configurée dans `.env` ; elle est conçue pour
être exposée côté client — la sécurité vient des politiques RLS).

## 1. Créer le schéma (5 minutes, une seule fois)

Dans le tableau de bord Supabase → **SQL Editor** → « New query », copier-coller
puis exécuter **dans cet ordre** :

1. `supabase/migrations/0001_schema.sql` — tables et types ;
2. `supabase/migrations/0002_rls.sql` — sécurité (RLS deny-all + politiques + RPC) ;
3. `supabase/migrations/0003_seed.sql` — capsules, 16 références, modèles de
   partenariat, réglages (aucun prix inventé : tout reste « à confirmer »).

Chaque script doit se terminer par « Success ». En cas d'erreur au milieu d'un
script, corriger puis rejouer uniquement le script en échec.

## 2. Créer le bucket d'images

**Storage** → « New bucket » → nom : `product-media` → Public : **oui** (les
visuels produits sont destinés à être vus ; les documents confidentiels ne
passent pas par ce bucket).

## 3. Créer votre compte administrateur

1. **Authentication** → « Add user » → e-mail + mot de passe (votre compte réel).
2. **SQL Editor** :
   ```sql
   insert into profiles (user_id, role, full_name)
   select id, 'super_admin', 'Solina Rolla NGOMA'
   from auth.users where email = 'VOTRE_EMAIL_ICI';
   ```

## 4. Vérifier depuis l'application

`npm run dev` (le `.env` est déjà en `VITE_DATA_MODE=supabase`) : la page
d'accueil doit afficher le catalogue chargé depuis la base (mêmes 16 références
que le seed). Une demande d'accès envoyée depuis `/acces-professionnel`
apparaît dans **Table Editor → access_requests**.

## 5. Ce qui reste en mode local pour l'instant

La connexion applicative (comptes démo) et les écritures acheteur/admin
(sélections, devis, commandes, CRM) restent locales tant que l'étape 2 de
l'adaptateur n'est pas implémentée — voir `src/data/supabase-adapter.md`.
La base peut donc être remplie (produits, prix, contenus) via le SQL Editor ou
le Table Editor dès maintenant : l'application reflète ces données au
chargement.
