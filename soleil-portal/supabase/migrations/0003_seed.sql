-- Seed initial : collection, capsules, 16 références de la capsule wholesale v1,
-- modèles de partenariat, réglages de marque (placeholders administrables).
-- AUCUN prix ni fait commercial n'est inséré : les valeurs restent NULL
-- (« à confirmer ») jusqu'à validation par la maison.

insert into collections (id, name_fr, name_en, season) values
  ('c0000000-0000-0000-0000-000000000001', 'Foire 2024', 'Foire 2024', '2024');

insert into capsules (id, collection_id, slug, name_fr, name_en, manifesto_fr, manifesto_en, display_order) values
  ('ca000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'executif-brazzaville',
   'L''Exécutif de Brazzaville', 'The Brazzaville Executive',
   'Un vestiaire de fonction et de représentation, taillé pour les hommes qui portent leurs responsabilités avec allure.',
   'A wardrobe for office and representation — cut for men who carry responsibility with presence.', 1),
  ('ca000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'femme-soleil',
   'La Femme Soleil', 'The Soleil Woman',
   'Des robes d''affirmation, du matin professionnel au soir des grandes occasions.',
   'Dresses of quiet assertion, from working mornings to evening occasions.', 2),
  ('ca000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'ceremonie-distinction',
   'Cérémonie & Distinction', 'Ceremony & Distinction',
   'Boubous et pièces d''apparat pour les jours qui comptent.',
   'Boubous and ceremonial pieces for the days that matter.', 3),
  ('ca000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'signatures-brazzaville',
   'Signatures de Brazzaville', 'Brazzaville Signatures',
   'Gilets et hauts qui signent une silhouette.',
   'Waistcoats and tops that sign a silhouette.', 4);

-- Produits (référence stable, contenus bilingues, données commerciales NULL)
with rows(reference, capsule, category, gender, name_fr, name_en, featured, dropbox) as (
  values
    ('SC-H-003','ca000000-0000-0000-0000-000000000001','ensemble','homme','Ensemble Exécutif N°3','Executive Ensemble No. 3',true,'Ensemble_Hommes_3.png'),
    ('SC-H-005','ca000000-0000-0000-0000-000000000001','ensemble','homme','Ensemble Exécutif N°5','Executive Ensemble No. 5',false,'Ensemble_Hommes_5.png'),
    ('SC-H-008','ca000000-0000-0000-0000-000000000001','ensemble','homme','Ensemble Exécutif N°8','Executive Ensemble No. 8',false,'Ensemble_Hommes_8.png'),
    ('SC-H-011','ca000000-0000-0000-0000-000000000001','ensemble','homme','Ensemble Exécutif N°11','Executive Ensemble No. 11',false,'Ensemble_Hommes_11.png'),
    ('SC-H-017','ca000000-0000-0000-0000-000000000003','ensemble','homme','Ensemble Cérémonie N°17','Ceremony Ensemble No. 17',true,'Ensemble_Hommes_17.png'),
    ('SC-H-024','ca000000-0000-0000-0000-000000000003','ensemble','homme','Ensemble Cérémonie N°24','Ceremony Ensemble No. 24',false,'Ensemble_Hommes_24.png'),
    ('SC-H-028','ca000000-0000-0000-0000-000000000004','ensemble','homme','Ensemble Signature N°28','Signature Ensemble No. 28',false,'Ensemble_Hommes_28.png'),
    ('SC-F-001','ca000000-0000-0000-0000-000000000002','robe','femme','Robe Soleil N°1','Soleil Dress No. 1',true,'Femmes/Robes_1.png'),
    ('SC-F-004','ca000000-0000-0000-0000-000000000002','robe','femme','Robe Soleil N°4','Soleil Dress No. 4',false,'Femmes/Robes_4.png'),
    ('SC-F-007','ca000000-0000-0000-0000-000000000002','robe','femme','Robe Soleil N°7','Soleil Dress No. 7',false,'Femmes/Robes_7.png'),
    ('SC-F-012','ca000000-0000-0000-0000-000000000003','robe','femme','Robe Cérémonie N°12','Ceremony Dress No. 12',true,'Femmes/Robes_12.png'),
    ('SC-F-016','ca000000-0000-0000-0000-000000000002','robe','femme','Robe Soleil N°16','Soleil Dress No. 16',false,'Femmes/Robes_16.png'),
    ('SC-F-020','ca000000-0000-0000-0000-000000000003','robe','femme','Robe Cérémonie N°20','Ceremony Dress No. 20',false,'Femmes/Robes_20.png'),
    ('SC-B-001','ca000000-0000-0000-0000-000000000003','boubou','mixte','Boubou Distinction N°1','Distinction Boubou No. 1',true,'Boubou1.png'),
    ('SC-G-001','ca000000-0000-0000-0000-000000000004','gilet','homme','Gilet Signature N°1','Signature Waistcoat No. 1',false,'Gilet_01.png'),
    ('SC-T-002','ca000000-0000-0000-0000-000000000004','haut','femme','Haut Signature N°2','Signature Top No. 2',false,'Haut_02.png')
)
insert into products (reference, capsule_id, category, gender, occasions,
  name_fr, name_en, description_fr, description_en,
  availability, visibility, status, is_featured)
select reference, capsule::uuid, category, gender,
  case category when 'robe' then array['professionnel','evenement'] else array['professionnel','ceremonie'] end,
  name_fr, name_en,
  'Pièce de la collection Foire 2024. Matières, tailles et finitions à confirmer par la maison.',
  'A piece from the Foire 2024 collection. Materials, sizes and finishes to be confirmed by the house.',
  'on_request', 'professional', 'active', featured
from rows;

-- Variante et grille de prix vides (à confirmer) pour chaque produit
insert into product_variants (product_id, availability)
select id, 'on_request' from products;

insert into wholesale_prices (product_id, price_list, currency)
select id, 'standard', 'XAF' from products;

-- Médias : emplacements avec correspondance Dropbox (placeholders)
insert into product_media (product_id, kind, storage_path, source_note, alt_fr, alt_en, display_order, is_placeholder)
select p.id, 'packshot',
  'product-media/' || p.reference || '/packshot.png',
  'Dropbox : /Perso/Soleil Creation/Foire 2024/Optimisées/ — voir scripts/asset-manifest.json',
  p.name_fr || ' — visuel détouré', p.name_en || ' — cut-out visual', 1, true
from products p;

insert into partnership_models (code, name_fr, name_en) values
  ('gros', 'A. Achat en gros', 'A. Wholesale purchase'),
  ('precommande', 'B. Précommande', 'B. Pre-order'),
  ('retail_test', 'C. Retail Test', 'C. Retail Test'),
  ('popup', 'D. Pop-up / Vente privée', 'D. Pop-up / Private sale');

insert into commercial_terms (currency) values ('XAF');

-- Placeholders centralisés (brief §17) — à renseigner dans l'admin
insert into brand_settings (key, value_fr, value_en) values
  ('logo', '[LOGO OFFICIEL]', '[OFFICIAL LOGO]'),
  ('whatsapp', '[NUMÉRO WHATSAPP PROFESSIONNEL]', '[BUSINESS WHATSAPP NUMBER]'),
  ('email', '[ADRESSE E-MAIL COMMERCIALE]', '[SALES EMAIL ADDRESS]'),
  ('instagram', '[COMPTE INSTAGRAM]', '[INSTAGRAM ACCOUNT]'),
  ('facebook', '[COMPTE FACEBOOK]', '[FACEBOOK ACCOUNT]'),
  ('atelier_address', '[ADRESSE DE L''ATELIER]', '[ATELIER ADDRESS]'),
  ('materials', '[MATIÈRES]', '[MATERIALS]'),
  ('sizes', '[TAILLES]', '[SIZES]'),
  ('public_prices', '[PRIX PUBLICS]', '[RETAIL PRICES]'),
  ('wholesale_prices', '[PRIX PROFESSIONNELS]', '[WHOLESALE PRICES]'),
  ('moq', '[QUANTITÉS MINIMALES]', '[MINIMUM QUANTITIES]'),
  ('production_capacity', '[CAPACITÉ DE PRODUCTION]', '[PRODUCTION CAPACITY]'),
  ('production_lead_time', '[DÉLAIS DE PRODUCTION]', '[PRODUCTION LEAD TIMES]'),
  ('payment_terms', '[MODALITÉS DE PAIEMENT]', '[PAYMENT TERMS]'),
  ('delivery_terms', '[MODALITÉS DE LIVRAISON]', '[DELIVERY TERMS]'),
  ('return_policy', '[POLITIQUE DE RETOUR]', '[RETURN POLICY]'),
  ('exclusivity', '[CONDITIONS D''EXCLUSIVITÉ]', '[EXCLUSIVITY TERMS]');
