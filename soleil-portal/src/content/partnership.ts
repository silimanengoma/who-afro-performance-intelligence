import type { Localized, PartnershipModelCode } from '../data/types'

export interface PartnershipModelContent {
  code: PartnershipModelCode
  name: Localized
  summary: Localized
  how: Localized[]
  profile: Localized
  benefits: Localized[]
  scResponsibilities: Localized[]
  shopResponsibilities: Localized[]
  steps: Localized[]
  documents: Localized[]
  conditionsTbc: Localized[]
  enabled: boolean
}

export const partnershipModels: PartnershipModelContent[] = [
  {
    code: 'gros',
    enabled: true,
    name: { fr: 'A. Achat en gros', en: 'A. Wholesale purchase' },
    summary: {
      fr: 'La boutique achète les pièces aux conditions professionnelles et les revend à sa clientèle.',
      en: 'The retailer buys the pieces at trade terms and sells them on to its clientele.',
    },
    how: [
      { fr: 'La boutique constitue sa sélection dans le showroom.', en: 'The retailer builds a selection in the showroom.' },
      { fr: 'Les conditions (prix, quantités, transport, délais) sont précisées dans un devis.', en: 'Terms (prices, quantities, shipping, lead times) are set out in a quote.' },
      { fr: 'Après acceptation, la commande est produite ou préparée puis expédiée.', en: 'Once accepted, the order is produced or prepared, then shipped.' },
      { fr: 'La boutique revend librement à sa clientèle, au prix public conseillé ou à sa main.', en: 'The retailer sells freely to its clientele, at the RRP or at its own discretion.' },
    ],
    profile: {
      fr: 'Boutiques et concept stores installés, capables d’engager un volume ferme et de porter le stock.',
      en: 'Established boutiques and concept stores able to commit to firm volume and carry stock.',
    },
    benefits: [
      { fr: 'Meilleures conditions tarifaires (barème gros).', en: 'Best trade terms (wholesale scale).' },
      { fr: 'Exclusivités possibles sur une zone — à convenir.', en: 'Territorial exclusivity possible — to be agreed.' },
      { fr: 'Marge pleine à la revente.', en: 'Full retail margin.' },
    ],
    scResponsibilities: [
      { fr: 'Produire et contrôler la qualité des pièces commandées.', en: 'Produce and quality-check ordered pieces.' },
      { fr: 'Respecter les délais convenus au devis.', en: 'Meet the lead times agreed in the quote.' },
      { fr: 'Fournir visuels et argumentaires de vente.', en: 'Provide visuals and selling points.' },
    ],
    shopResponsibilities: [
      { fr: 'Régler selon les modalités convenues.', en: 'Pay according to the agreed terms.' },
      { fr: 'Présenter la marque conformément à son positionnement.', en: 'Present the brand in line with its positioning.' },
      { fr: 'Remonter les retours clients.', en: 'Share customer feedback.' },
    ],
    steps: [
      { fr: 'Sélection → demande de devis → devis → acceptation → production → expédition → réception.', en: 'Selection → quote request → quote → acceptance → production → shipping → receipt.' },
    ],
    documents: [
      { fr: 'Devis, bon de commande, facture pro forma, accord de vente en gros, politique d’expédition, PV de réception.', en: 'Quote, purchase order, pro forma invoice, wholesale agreement, shipping policy, receipt report.' },
    ],
    conditionsTbc: [
      { fr: 'Minimum de commande, modalités de paiement, délais de production, transport et douanes : à confirmer au devis.', en: 'Order minimum, payment terms, production lead times, shipping and customs: to be confirmed in the quote.' },
    ],
  },
  {
    code: 'precommande',
    enabled: true,
    name: { fr: 'B. Précommande', en: 'B. Pre-order' },
    summary: {
      fr: 'La boutique présente la sélection à sa clientèle et consolide les demandes ; Soleil Création produit les pièces confirmées.',
      en: 'The retailer presents the selection to its clientele and consolidates demand; Soleil Création produces the confirmed pieces.',
    },
    how: [
      { fr: 'La boutique présente une sélection (line sheet, visuels, échantillons éventuels).', en: 'The retailer presents a selection (line sheet, visuals, possibly samples).' },
      { fr: 'Elle collecte ou consolide les demandes de sa clientèle.', en: 'It collects or consolidates customer demand.' },
      { fr: 'Soleil Création produit ou prépare uniquement les pièces confirmées.', en: 'Soleil Création produces or prepares only the confirmed pieces.' },
    ],
    profile: {
      fr: 'Boutiques, personal shoppers et distributeurs qui préfèrent limiter le risque de stock.',
      en: 'Retailers, personal shoppers and distributors who prefer to limit stock risk.',
    },
    benefits: [
      { fr: 'Pas de stock immobilisé.', en: 'No capital tied up in stock.' },
      { fr: 'Offre ajustée à la demande réelle.', en: 'Offer adjusted to actual demand.' },
    ],
    scResponsibilities: [
      { fr: 'Confirmer la faisabilité et les délais pour chaque pièce.', en: 'Confirm feasibility and lead times per piece.' },
      { fr: 'Produire les pièces confirmées au niveau de qualité de la maison.', en: 'Produce confirmed pieces to the house’s quality standard.' },
    ],
    shopResponsibilities: [
      { fr: 'Consolider des demandes fermes avec acompte éventuel — à convenir.', en: 'Consolidate firm demand, possibly with deposits — to be agreed.' },
      { fr: 'Communiquer les mesures ou tailles nécessaires.', en: 'Provide the required measurements or sizes.' },
    ],
    steps: [
      { fr: 'Sélection → campagne de précommande → consolidation → devis → production → livraison.', en: 'Selection → pre-order campaign → consolidation → quote → production → delivery.' },
    ],
    documents: [
      { fr: 'Accord de précommande, fiche de sélection, devis, facture pro forma.', en: 'Pre-order agreement, selection sheet, quote, pro forma invoice.' },
    ],
    conditionsTbc: [
      { fr: 'Acomptes, délais de production par pièce, conditions d’annulation : à confirmer.', en: 'Deposits, per-piece production lead times, cancellation terms: to be confirmed.' },
    ],
  },
  {
    code: 'retail_test',
    enabled: true,
    name: { fr: 'C. Retail Test', en: 'C. Retail Test' },
    summary: {
      fr: 'Une sélection pilote de 5 à 8 références (volume à confirmer) pour tester la marque en boutique avant une collaboration régulière.',
      en: 'A pilot selection of 5–8 references (volume to be confirmed) to test the brand in store before a regular collaboration.',
    },
    how: [
      { fr: 'Sélection pilote resserrée, définie avec la maison.', en: 'A tight pilot selection, defined with the house.' },
      { fr: 'Période de test en boutique — durée à convenir.', en: 'In-store trial period — duration to be agreed.' },
      { fr: 'Analyse conjointe des ventes et retours clients.', en: 'Joint review of sales and customer feedback.' },
      { fr: 'Possibilité de réassort ou de passage à une collaboration régulière.', en: 'Option to reorder or move to a regular collaboration.' },
    ],
    profile: {
      fr: 'Boutiques qui découvrent la maison et veulent valider l’adéquation avec leur clientèle.',
      en: 'Retailers discovering the house and wanting to validate fit with their clientele.',
    },
    benefits: [
      { fr: 'Engagement limité et cadré.', en: 'Limited, well-framed commitment.' },
      { fr: 'Décision fondée sur des ventes réelles.', en: 'Decisions based on actual sales.' },
    ],
    scResponsibilities: [
      { fr: 'Composer une sélection pilote adaptée à la clientèle de la boutique.', en: 'Curate a pilot selection suited to the store’s clientele.' },
      { fr: 'Partager un bilan de fin de test.', en: 'Share an end-of-test review.' },
    ],
    shopResponsibilities: [
      { fr: 'Mettre en valeur les pièces pendant la période convenue.', en: 'Showcase the pieces during the agreed period.' },
      { fr: 'Partager les données de vente et les retours clients.', en: 'Share sales data and customer feedback.' },
    ],
    steps: [
      { fr: 'Définition du pilote → devis → test en boutique → bilan → réassort ou accord régulier.', en: 'Pilot definition → quote → in-store test → review → reorder or regular agreement.' },
    ],
    documents: [
      { fr: 'Accord Retail Test, fiche de sélection, devis, formulaire de réassort.', en: 'Retail Test agreement, selection sheet, quote, reorder form.' },
    ],
    conditionsTbc: [
      { fr: 'Volume exact, durée du test, conditions de reprise éventuelle des invendus : à confirmer.', en: 'Exact volume, test duration, possible terms for unsold items: to be confirmed.' },
    ],
  },
  {
    code: 'popup',
    enabled: true,
    name: { fr: 'D. Pop-up / Vente privée', en: 'D. Pop-up / Private sale' },
    summary: {
      fr: 'Un événement physique ou digital autour d’une sélection adaptée à la clientèle locale.',
      en: 'A physical or digital event built around a selection tailored to the local clientele.',
    },
    how: [
      { fr: 'Définition conjointe du format (pop-up en boutique, vente privée, événement digital).', en: 'Jointly define the format (in-store pop-up, private sale, digital event).' },
      { fr: 'Sélection adaptée à la clientèle locale.', en: 'Selection tailored to the local clientele.' },
      { fr: 'Responsabilités et partage des recettes définis à l’avance.', en: 'Responsibilities and revenue share defined upfront.' },
    ],
    profile: {
      fr: 'Concept stores, lieux éphémères, personal shoppers et communautés de la diaspora.',
      en: 'Concept stores, temporary venues, personal shoppers and diaspora communities.',
    },
    benefits: [
      { fr: 'Fort impact d’image et test grandeur nature.', en: 'Strong brand impact and a full-scale market test.' },
      { fr: 'Événementialisation de la marque.', en: 'The brand as an event.' },
    ],
    scResponsibilities: [
      { fr: 'Fournir la sélection, les visuels et le récit de la maison.', en: 'Provide the selection, visuals and the house narrative.' },
      { fr: 'Participer à l’animation selon le format convenu.', en: 'Take part in the event as agreed.' },
    ],
    shopResponsibilities: [
      { fr: 'Organiser le lieu, la logistique locale et l’invitation de la clientèle.', en: 'Handle venue, local logistics and guest outreach.' },
      { fr: 'Assurer l’encaissement selon le partage convenu.', en: 'Handle payment collection per the agreed split.' },
    ],
    steps: [
      { fr: 'Cadrage → sélection → devis/accord → événement → bilan et suite.', en: 'Framing → selection → quote/agreement → event → review and next steps.' },
    ],
    documents: [
      { fr: 'Présentation du partenariat, accord dédié, fiche de sélection, PV de réception.', en: 'Partnership deck, dedicated agreement, selection sheet, receipt report.' },
    ],
    conditionsTbc: [
      { fr: 'Partage des recettes, prise en charge des frais, assurance : à définir avant l’événement.', en: 'Revenue share, cost coverage, insurance: to be defined before the event.' },
    ],
  },
]
