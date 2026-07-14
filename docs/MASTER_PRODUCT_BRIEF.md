# SOLEIL CRÉATION — Wholesale Portal
## Master Product Brief (document de référence)

> Statut : fondation validée par diagnostic — 13 juillet 2026
> Ce document est la source de vérité produit. Toute évolution du périmètre doit y être reportée.

---

## 1. Mission du produit

Concevoir et livrer un **portail de développement commercial B2B** pour SOLEIL CRÉATION, maison de mode basée à Brazzaville (République du Congo), réunissant quatre composantes dans une seule expérience :

1. **Wholesale Lookbook** — séduction, identité, découverte de la marque ;
2. **Line Sheet** — références, prix professionnels et conditions commerciales ;
3. **Showroom interactif** — exploration, sélection de pièces, demande de devis ;
4. **Retail Partnership Pack** — modèles de partenariat, documents, contrats types, processus de commande.

Le portail n'est ni un site vitrine, ni une marketplace, ni un catalogue PDF : c'est un outil pour **identifier, convaincre, qualifier et convertir** des boutiques, concept stores, distributeurs et personal shoppers en partenaires commerciaux.

## 2. La marque (faits établis — ne pas extrapoler)

| Élément | Valeur | Source |
|---|---|---|
| Nom | SOLEIL CRÉATION | Cahier des charges |
| Fondatrice & directrice créative | Solina Rolla NGOMA | Cahier des charges |
| Localisation | Brazzaville, République du Congo | Cahier des charges |
| Mission historique | « Réconcilier les hommes et les femmes avec leur culture et leur patrimoine immatériel » | `Présentation Soleil Création.docx` (Dropbox, 2020) |
| Offre | Vêtements haut de gamme femmes et hommes, sur mesure et prêt-à-porter | idem |
| Collections passées | « Sénégal Thiakanam » (valeurs : téranga/hospitalité, soutoura/dignité, diom/détermination), COJEPROC 2019 & Saison 2, Foire 2024 | Arborescence Dropbox |
| Boutique | « Shop Plateau » (photos avant/après travaux, oct. 2025) | Arborescence Dropbox |
| Logo | Existant (`Logo Soleil Création.jpeg`, `Griffe SOLEIL CREATION.jpeg` dans Dropbox) — à intégrer | Arborescence Dropbox |

**Positionnement (verbatim à utiliser)**
- FR : « Une élégance africaine contemporaine, conçue à Brazzaville pour les femmes et les hommes qui veulent affirmer leur identité avec distinction. »
- EN : “Contemporary African elegance, created in Brazzaville for women and men who choose to stand apart.”

**Interdits absolus** : ne jamais présenter Soleil Création comme une maison de luxe historique ou une marque internationale établie ; ne jamais inventer histoire, dates, matières, capacités de production, prix, délais, tailles, distinctions, partenaires, points de vente ou techniques. Toute donnée non confirmée affiche « à confirmer » / “to be confirmed” et reste administrable.

## 3. Trois niveaux d'expérience

| Niveau | Accès | Contenu |
|---|---|---|
| 1 — Public | Sans compte | Identité, manifeste, maison, Lookbook, capsules, pièces vedettes, candidature professionnelle, demande d'accès showroom, rendez-vous, contact. **Aucun prix professionnel.** |
| 2 — Acheteur professionnel | Après validation ou lien sécurisé | Showroom, fiches complètes, Line Sheet, prix pro + prix publics conseillés, variantes, MOQ, conditions, sélection, devis, documents, Partnership Pack, historique. |
| 3 — Administrateur | Réservé Soleil Création | Produits, collections, prix, stocks, comptes pro, validation des accès, prospects (mini-CRM), sélections, devis, commandes, documents, statistiques, contenus FR/EN. |

## 4. Rôles

`public` (anonyme) · `buyer` · `sales_admin` · `content_admin` · `super_admin`.
Les autorisations sont définies au niveau données (RLS Supabase) — jamais uniquement par masquage d'interface.

## 5. Parcours principal (résumé)

Lien personnalisé → Lookbook → demande d'accès → validation par Soleil Création → Showroom → filtres → fiches → « Ma sélection » (tailles, couleurs, quantités indicatives) → Line Sheet → choix du modèle de partenariat → demande de devis → notification admin → ajustement (prix, quantités, transport, délais) → devis émis → acceptation / modification / refus → commande → documents conservés dans l'espace partenaire → suivi dans le tableau de bord admin.
**Règle transverse : l'interface indique toujours la prochaine action attendue.**
Détail complet : `docs/USER_JOURNEYS.md`.

## 6. Vocabulaire imposé

- « Ma sélection » / “My Selection” — jamais « panier »/“cart”. La sélection n'est pas une commande ferme : elle prépare une demande de devis.
- Marge brute boutique = PPC − prix professionnel. Taux de marge sur PV = (PPC − prix pro) / PPC × 100. Aucun prix pré-rempli avant validation.

## 7. Modèles de partenariat (Retail Partnership Pack)

A. **Achat en gros** · B. **Précommande** · C. **Retail Test** (5–8 références pilotes, volume à confirmer) · D. **Pop-up / Vente privée**.
Chaque modèle expose : fonctionnement, profil adapté, avantages, responsabilités des deux parties, étapes, documents, conditions à confirmer, bouton « Choisir ce modèle ». Les 15 documents types du pack sont listés dans `docs/PRODUCT_ARCHITECTURE.md` §7. **Tous les contrats générés portent la mention : modèle nécessitant validation juridique avant utilisation.**

## 8. Bilinguisme

Interface 100 % FR/EN, sélecteur persistant. Contenus EN rédigés comme copie commerciale internationale (pas de traduction littérale). Données produits : `name_fr/en`, `description_fr/en`, `editorial_text_fr/en` ; les références et codes techniques ne sont pas dupliqués.

## 9. Sources visuelles — état réel

Le dossier Dropbox (`/Perso/Soleil Creation/Foire 2024/`) a été **entièrement inventorié** : 59 visuels détourés PNG (31 ensembles hommes exploitables, 22 robes, 2 boubous, 2 gilets, 2 hauts — 1 fichier corrompu) et 55 photos HD portées uniques. **La politique réseau de l'environnement de développement bloque le téléchargement des binaires Dropbox** : le prototype embarque donc des placeholders clairement identifiés, et `docs/CONTENT_INVENTORY.md` fournit la correspondance exacte asset → fichier Dropbox ainsi que la procédure d'import. Aucun vêtement fictif généré par IA ne remplace les créations.

## 10. Placeholders centralisés

`[LOGO OFFICIEL]`, `[NUMÉRO WHATSAPP PROFESSIONNEL]`, `[ADRESSE E-MAIL COMMERCIALE]`, `[COMPTE INSTAGRAM]`, `[COMPTE FACEBOOK]`, `[ADRESSE DE L'ATELIER]`, `[MATIÈRES]`, `[TAILLES]`, `[PRIX PUBLICS]`, `[PRIX PROFESSIONNELS]`, `[QUANTITÉS MINIMALES]`, `[CAPACITÉ DE PRODUCTION]`, `[DÉLAIS DE PRODUCTION]`, `[MODALITÉS DE PAIEMENT]`, `[MODALITÉS DE LIVRAISON]`, `[POLITIQUE DE RETOUR]`, `[CONDITIONS D'EXCLUSIVITÉ]` — centralisés dans la configuration administrable (`brand_settings`), jamais dispersés dans le code.

## 11. Critères d'acceptation (contrôle final)

Le prototype est accepté uniquement si : les 4 composantes forment une expérience cohérente ; le Lookbook conduit au Showroom ; le Showroom alimente une sélection ; la sélection alimente la demande de devis ; le Line Sheet est filtrable et exportable ; les prix pro ne sont pas publics ; le Partnership Pack est relié au devis et à la commande ; FR/EN fonctionne ; les rôles sont différenciés ; l'admin modifie les produits sans code ; responsive mobile/tablette/desktop ; aucun prix ou fait inventé ; aucune image fictive ; formulaires validés ; états vides conçus ; erreurs compréhensibles ; boutons réels ; sélection persistante après rafraîchissement ; données confidentielles protégées ; build sans erreur ; instructions de déploiement complètes.

## 12. Documents liés

| Document | Rôle |
|---|---|
| `docs/PRODUCT_ARCHITECTURE.md` | Architecture technique et fonctionnelle |
| `docs/USER_JOURNEYS.md` | Cartographie des parcours |
| `docs/DATA_MODEL.md` | Schéma de données et RLS |
| `docs/DESIGN_SYSTEM.md` | Direction artistique et composants |
| `docs/IMPLEMENTATION_PLAN.md` | Plan par sprints |
| `docs/CONTENT_INVENTORY.md` | Inventaire visuel et correspondance assets |
| `docs/OPEN_DECISIONS.md` | Décisions bloquantes ou en attente |
