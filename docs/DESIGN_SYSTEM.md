# Design System — Soleil Création Wholesale Portal

Identité premium, éditoriale, contemporaine. Brazzaville présente par la justesse, jamais par le cliché.

## 1. Palette

| Token | Hex | Usage |
|---|---|---|
| `nuit` | `#1B2237` | Fond des sections immersives, titres sur clair, header |
| `nuit-700` | `#2A3350` | Surfaces sombres secondaires, hover |
| `ivoire` | `#F7F3EC` | Fond principal clair |
| `sable` | `#E3D5BE` | Surfaces secondaires, séparateurs doux, cartes |
| `brun` | `#4A342A` | Texte éditorial sur clair, accents profonds |
| `or` | `#B8935C` | Or mat : filets, puces, accents, états actifs — **jamais en aplats criards** |
| `or-500` | `#A07E45` | Or accessible pour texte sur ivoire (contraste AA) |
| `encre` | `#23201B` | Texte courant |
| `succes` / `alerte` / `erreur` | `#3E6B4F` / `#9C6F1E` / `#8C3A2E` | États, badges sobres |

Les accents complémentaires seront échantillonnés dans les vêtements une fois les visuels intégrés (variable `--accent-capsule` par capsule, valeur par défaut `or`).

## 2. Typographie

- **Titres / éditorial** : serif éditoriale — pile `"Cormorant Garamond", "Playfair Display", Georgia, serif` (fichiers locaux dans `public/fonts/`, pas de CDN requis au build ; fallback Georgia toujours lisible).
- **Interface** : sans-serif contemporaine — pile `"Inter", "Helvetica Neue", Arial, sans-serif`.
- Échelle : `display 56/64 · h1 40/48 · h2 30/38 · h3 22/30 · body 16/26 · small 14/22 · caption 12/18`. Titres en graisse 500–600, jamais en capitales forcées sauf sur-titres (`letter-spacing: 0.14em`).

## 3. Grille et espaces

- Conteneur éditorial max 1240 px ; texte de lecture max 68 ch.
- Échelle d'espacement 4/8 : `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.
- Grandes images : ratios réservés (`3:4` produit, `16:9` éditorial, `21:9` couvertures) pour éviter tout saut de mise en page.
- Rayons : `2px` (champs), `4px` (cartes). Ombres quasi nulles — la hiérarchie vient de la couleur et de l'espace.

## 4. Composants clés

| Composant | Règles |
|---|---|
| Boutons | `primary` (nuit, texte ivoire), `secondary` (contour brun), `ghost`, `gold-line` (CTA lookbook). Hauteur 44 px min (tactile). |
| Cartes produit | Image 3:4, nom, référence, capsule ; prix pro visible **uniquement** en espace acheteur ; badge sobre (disponibilité). |
| Bandeau « Prochaine étape » | Fond sable, filet or, une phrase + un CTA — présent sur tout écran de parcours. |
| Filtres | Desktop : rail latéral ; mobile : tiroir plein écran, compteur de résultats permanent. |
| Tableaux | Desktop uniquement ; en dessous de `md`, transformation systématique en cartes empilées (Line Sheet inclus). |
| Formulaires | Colonne unique, labels au-dessus, validation en ligne FR/EN, messages d'erreur en phrase complète. |
| États vides | Illustration typographique (pas d'icônes criardes), phrase, CTA vers l'action suivante. |
| Badges statut | Teinte douce + point coloré ; jamais de rouge/vert saturés. |
| Placeholder image | Aplat `sable`, monogramme SC en filigrane, mention « Visuel à intégrer — {référence} » ; identifie sans tromper. |

## 5. Motion

Discrète : fondu + translation 8–16 px à l'entrée des sections du lookbook (IntersectionObserver), transitions 150–250 ms `ease-out`, `prefers-reduced-motion` respecté. Aucune animation décorative continue, aucun carrousel automatique.

## 6. Ton éditorial

- FR : phrases amples mais précises, vocabulaire de maison (« la maison », « les pièces », « la capsule »), jamais de superlatifs publicitaires.
- EN : copie commerciale internationale idiomatique (“wholesale enquiries”, “line sheet”, “minimum order”), pas de traduction littérale.
- Aucune promesse chiffrée non confirmée ; « à confirmer » assumé élégamment (« Sur demande » quand approprié).

## 7. Accessibilité

Contrastes AA minimum (or texte → `or-500` sur ivoire), focus visibles (`outline` or 2 px), navigation clavier complète, `alt` bilingues sur tous les médias, cibles tactiles ≥ 44 px, formulaires liés par `label/for`, langue du document synchronisée avec le sélecteur FR/EN (`<html lang>`).

## 8. À éviter (rappels contractuels)

Apparence marketplace ; promotions agressives ; badges criards ; accumulation de motifs « africains » décoratifs ; clichés visuels panafricains ; interfaces génériques de dropshipping ; animations excessives ; textes trop longs ; faux témoignages ; faux logos de partenaires.
