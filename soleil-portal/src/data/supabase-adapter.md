# Passage au backend Supabase

Le prototype fonctionne en mode démonstration (`VITE_DATA_MODE=local`) : toutes
les données vivent dans `localStorage`, structurées à l'identique du schéma SQL.

## Étapes d'activation

1. Créer un projet sur supabase.com et récupérer `URL` + `anon key`.
2. Exécuter les migrations dans l'ordre (`supabase db push` ou l'éditeur SQL) :
   `supabase/migrations/0001_schema.sql` → `0002_rls.sql` → `0003_seed.sql`.
3. Créer le bucket Storage `product-media` (privé, lecture via policies).
4. Renseigner `.env` : `VITE_DATA_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5. Installer le client : `npm install @supabase/supabase-js`.
6. Implémenter l'adaptateur dans `src/data/supabase/` en reprenant la surface de
   `store.tsx` (`db`, `update`, `logActivity`, `notify`, `audit`, `setPipeline`) :
   - lectures : `select` PostgREST sur les vues/tables autorisées par la RLS ;
   - écritures : `insert`/`update` (les policies contrôlent les droits réels) ;
   - formulaires publics : RPC `submit_access_request` / `submit_appointment` ;
   - liens partagés : RPC `resolve_shared_link` ;
   - auth : `supabase.auth` remplace `AuthContext` démo (le rôle vient de `profiles`).
7. Créer les comptes réels via Supabase Auth (invitations) puis insérer
   `profiles` + `buyer_accounts` correspondants.

## Garanties déjà en place côté SQL

- RLS deny-all : aucune table lisible sans policy explicite.
- Prix (`wholesale_prices`) et conditions (`commercial_terms`) : invisibles des
  anonymes, lisibles des acheteurs approuvés uniquement.
- `organizations.internal_notes` : exclu de la vue `organizations_buyer_v`.
- Devis en brouillon : invisibles de la boutique jusqu'à l'envoi.
- Insertion publique uniquement via RPC validées (`security definer`).
