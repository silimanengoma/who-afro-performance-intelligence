# Rapport de contrôle qualité — 13 juillet 2026

Build de production : **vert** (`npm run build`, tsc + vite, 0 erreur).
QA automatisée de bout en bout : **16/16 contrôles passent** (`soleil-portal/scripts/e2e-check.mjs`, Playwright + Chromium sur le build de production) : expérience publique, confidentialité des prix, bascule FR/EN persistante, formulaire d'accès (validation + envoi), garde d'authentification, ajout à la sélection, persistance après rafraîchissement, Line Sheet, demande de devis, approbation d'accès admin, chiffrage et envoi du devis, acceptation acheteur, création et visibilité de la commande.

## Vérification des 20 critères d'acceptation

| # | Critère | État | Preuve |
|---|---|---|---|
| 1 | Les quatre composantes forment une expérience cohérente | ✅ | Lookbook → Showroom → Line Sheet → Partnership Pack reliés par le même dossier boutique et le bandeau « Prochaine étape » |
| 2 | Le Lookbook conduit naturellement vers le Showroom | ✅ | CTA « Demander un accès » en fin de narration ; lien personnalisé `/l/:token` tracé |
| 3 | Le Showroom permet de constituer une sélection | ✅ | E2E : ajout, variantes, quantités, notes privées |
| 4 | La sélection alimente automatiquement la demande de devis | ✅ | E2E : `/espace-pro/devis/nouveau` reprend pièces et quantités |
| 5 | Le Line Sheet peut être filtré et exporté | ✅ | Filtres capsule/catégorie/genre/sélection ; impression PDF ; export CSV (UTF-8 BOM, compatible Excel) |
| 6 | Les prix professionnels ne sont pas publics | ✅ | E2E : scan des pages publiques sans occurrence de prix ; RLS : `wholesale_prices` sans policy anonyme |
| 7 | Le Partnership Pack est relié au devis et à la commande | ✅ | Choix du modèle pré-remplit la demande ; documents fusionnés au dossier |
| 8 | Le mode FR/EN fonctionne | ✅ | E2E : bascule + persistance + `<html lang>` synchronisé |
| 9 | Les rôles et accès sont différenciés | ✅ | Gardes de routes 4 rôles + politiques RLS complètes (deny-all) |
| 10 | L'administrateur modifie les produits sans toucher au code | ✅ | CRUD complet : contenus FR/EN, capsule, visibilité, vedette, ordre, archivage, duplication, prix |
| 11 | Fonctionne sur mobile, tablette et ordinateur | ✅ | Grilles responsives, Line Sheet en cartes sur mobile, barre « Ma sélection » persistante, menus compacts |
| 12 | Aucun prix ou fait commercial inventé | ✅ | Tous les champs commerciaux sont `null` → « à confirmer » ; seed SQL sans prix |
| 13 | Aucune image fictive ne remplace les créations | ✅ | Placeholders identifiés (« Visuel à intégrer — {réf} ») + manifeste de correspondance Dropbox |
| 14 | Les formulaires sont validés | ✅ | E2E : soumission vide → messages d'erreur en phrase complète, FR/EN |
| 15 | Les états vides sont conçus | ✅ | Sélection, devis, commandes, documents, showroom sans résultat : état dédié + prochaine action |
| 16 | Les messages d'erreur sont compréhensibles | ✅ | Pages 403/404/erreur/lien expiré/maintenance rédigées, ton de la maison |
| 17 | Les boutons ont un comportement réel | ✅ | E2E couvre les actions clés ; partage/export/notifications implémentés (notifications simulées et signalées comme telles) |
| 18 | La sélection persiste après rafraîchissement | ✅ | E2E : quantité modifiée puis rechargement de page |
| 19 | Les données confidentielles sont protégées | ✅ | Notes internes hors vue acheteur (UI + vue SQL dédiée) ; devis brouillons invisibles ; liens partagés révocables avec expiration |
| 20 | Le projet se construit sans erreur + instructions complètes | ✅ | Build vert ; README (installation, comptes démo, déploiement Vercel/Netlify, Supabase) |

## Limites connues (assumées et documentées)

1. **Visuels** : pixels Dropbox non téléchargeables depuis l'environnement de génération → placeholders + procédure d'import (`scripts/import-assets.md`). Curation visuelle finale à valider (décisions D1–D3).
2. **Mode démonstration** : auth et données locales au navigateur ; le passage à Supabase (migrations + RLS livrées) est documenté mais l'adaptateur TypeScript reste à implémenter (`src/data/supabase-adapter.md`).
3. **Notifications simulées** : aucun e-mail/WhatsApp réel (exigence du brief) ; raccordement documenté.
4. **Export Excel** : CSV compatible Excel ; `.xlsx` natif noté en amélioration future (T5).
5. **Contrats** : modèles avec avertissement systématique — validation juridique requise avant usage (D8).
6. **Accessibilité** : contrastes AA sur les tokens, navigation clavier, labels liés, `alt` bilingues, `prefers-reduced-motion` ; un audit complet (lecteur d'écran) reste recommandé avant production.
