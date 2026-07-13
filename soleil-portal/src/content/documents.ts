/* Les 15 documents types du Retail Partnership Pack.
 * Chaque document est généré à partir des données du dossier (organisation,
 * réglages de marque) et porte l'avertissement juridique obligatoire.
 * Les champs non confirmés restent « à confirmer ». */
import type { BrandSettings, Localized, Organization } from '../data/types'

export interface DocTemplate {
  code: string
  title: Localized
  intro: Localized
  sections: (org: Organization | null, s: BrandSettings) => { heading: Localized; body: Localized }[]
}

const tbc: Localized = { fr: 'à confirmer', en: 'to be confirmed' }
const orgName = (org: Organization | null) => org?.legalName ?? '[BOUTIQUE]'

function partiesSection(org: Organization | null): { heading: Localized; body: Localized } {
  return {
    heading: { fr: 'Parties', en: 'Parties' },
    body: {
      fr: `Entre : SOLEIL CRÉATION, Brazzaville, République du Congo (« la Maison ») — et : ${orgName(org)}${org ? `, ${org.city}, ${org.country}` : ''} (« le Partenaire »).`,
      en: `Between: SOLEIL CRÉATION, Brazzaville, Republic of the Congo (“the House”) — and: ${orgName(org)}${org ? `, ${org.city}, ${org.country}` : ''} (“the Partner”).`,
    },
  }
}

function termsSection(s: BrandSettings): { heading: Localized; body: Localized }[] {
  return [
    {
      heading: { fr: 'Conditions financières', en: 'Financial terms' },
      body: {
        fr: `Devise : ${s.currency}. Paiement : ${s.paymentTerms.fr}. Minimum global : ${s.globalMinimum}.`,
        en: `Currency: ${s.currency}. Payment: ${s.paymentTerms.en}. Global minimum: ${s.globalMinimum}.`,
      },
    },
    {
      heading: { fr: 'Livraison et douanes', en: 'Delivery and customs' },
      body: {
        fr: `Livraison : ${s.deliveryTerms.fr}. Douanes : ${s.customsNote.fr}.`,
        en: `Delivery: ${s.deliveryTerms.en}. Customs: ${s.customsNote.en}.`,
      },
    },
  ]
}

export const docTemplates: DocTemplate[] = [
  {
    code: 'presentation',
    title: { fr: '1. Présentation du partenariat', en: '1. Partnership overview' },
    intro: {
      fr: 'Document de présentation des modalités de collaboration entre la Maison et ses partenaires professionnels.',
      en: 'Overview of the collaboration terms between the House and its professional partners.',
    },
    sections: (org) => [
      partiesSection(org),
      {
        heading: { fr: 'Objet', en: 'Purpose' },
        body: {
          fr: 'Présenter les quatre modèles de partenariat (achat en gros, précommande, retail test, pop-up/vente privée), leurs étapes et leurs documents associés.',
          en: 'To present the four partnership models (wholesale, pre-order, retail test, pop-up/private sale), their steps and associated documents.',
        },
      },
    ],
  },
  {
    code: 'identification',
    title: { fr: "2. Formulaire d'identification de la boutique", en: '2. Retailer identification form' },
    intro: { fr: 'Fiche d’identité commerciale du partenaire.', en: 'Commercial identity sheet of the partner.' },
    sections: (org) => [
      {
        heading: { fr: 'Identification', en: 'Identification' },
        body: org
          ? {
              fr: `Raison sociale : ${org.legalName}. Nom commercial : ${org.tradeName}. Type : ${org.shopType}. Contact : ${org.contactName}. Adresse : ${org.address}, ${org.city}, ${org.country}. E-mail : ${org.email}. WhatsApp : ${org.whatsapp}. Site : ${org.website}. Instagram : ${org.instagram}.`,
              en: `Legal name: ${org.legalName}. Trade name: ${org.tradeName}. Type: ${org.shopType}. Contact: ${org.contactName}. Address: ${org.address}, ${org.city}, ${org.country}. Email: ${org.email}. WhatsApp: ${org.whatsapp}. Website: ${org.website}. Instagram: ${org.instagram}.`,
            }
          : { fr: 'Champs à compléter par la boutique.', en: 'Fields to be completed by the retailer.' },
      },
      {
        heading: { fr: 'Profil commercial', en: 'Commercial profile' },
        body: org
          ? {
              fr: `Clientèle cible : ${org.targetClientele}. Gamme de prix : ${org.priceRange}. Marques distribuées : ${org.brandsCarried}. Pays de livraison : ${org.deliveryCountries}.`,
              en: `Target clientele: ${org.targetClientele}. Price range: ${org.priceRange}. Brands carried: ${org.brandsCarried}. Delivery countries: ${org.deliveryCountries}.`,
            }
          : tbcBody(),
      },
    ],
  },
  {
    code: 'fiche_selection',
    title: { fr: '3. Fiche de sélection', en: '3. Selection sheet' },
    intro: {
      fr: 'Liste des références retenues par le partenaire (générée depuis « Ma sélection »).',
      en: 'List of references chosen by the partner (generated from “My Selection”).',
    },
    sections: () => [
      {
        heading: { fr: 'Contenu', en: 'Contents' },
        body: {
          fr: 'Références, variantes souhaitées, quantités indicatives — voir la sélection en ligne ou l’export du Line Sheet.',
          en: 'References, requested variants, indicative quantities — see the online selection or the Line Sheet export.',
        },
      },
    ],
  },
  {
    code: 'demande_devis',
    title: { fr: '4. Demande de devis', en: '4. Quote request' },
    intro: { fr: 'Formalisation de la demande de chiffrage.', en: 'Formal record of the pricing request.' },
    sections: (org) => [
      partiesSection(org),
      {
        heading: { fr: 'Demande', en: 'Request' },
        body: {
          fr: 'Le Partenaire sollicite un devis pour la sélection jointe, selon le modèle de partenariat indiqué dans sa demande en ligne.',
          en: 'The Partner requests a quote for the attached selection, under the partnership model indicated in their online request.',
        },
      },
    ],
  },
  {
    code: 'devis',
    title: { fr: '5. Devis', en: '5. Quote' },
    intro: { fr: 'Proposition commerciale chiffrée de la Maison.', en: 'The House’s priced commercial proposal.' },
    sections: (org, s) => [partiesSection(org), ...termsSection(s)],
  },
  {
    code: 'bon_commande',
    title: { fr: '6. Bon de commande', en: '6. Purchase order' },
    intro: { fr: 'Confirmation de commande sur la base du devis accepté.', en: 'Order confirmation based on the accepted quote.' },
    sections: (org, s) => [partiesSection(org), ...termsSection(s)],
  },
  {
    code: 'proforma',
    title: { fr: '7. Facture pro forma', en: '7. Pro forma invoice' },
    intro: { fr: 'Document préalable à l’expédition, utile aux formalités.', en: 'Pre-shipment document, useful for formalities.' },
    sections: (org, s) => [partiesSection(org), ...termsSection(s)],
  },
  {
    code: 'accord_gros',
    title: { fr: '8. Accord de vente en gros', en: '8. Wholesale agreement' },
    intro: { fr: 'Cadre de la relation d’achat-revente.', en: 'Framework for the buy-and-resell relationship.' },
    sections: (org, s) => [
      partiesSection(org),
      {
        heading: { fr: 'Objet', en: 'Purpose' },
        body: {
          fr: 'Le Partenaire achète les pièces aux conditions professionnelles convenues et les revend à sa clientèle. Prix, quantités et délais figurent au devis et bon de commande.',
          en: 'The Partner buys the pieces at the agreed trade terms and resells them to its clientele. Prices, quantities and lead times are set in the quote and purchase order.',
        },
      },
      ...termsSection(s),
      {
        heading: { fr: 'Exclusivité', en: 'Exclusivity' },
        body: { fr: s.exclusivityTerms.fr, en: s.exclusivityTerms.en },
      },
    ],
  },
  {
    code: 'accord_precommande',
    title: { fr: '9. Accord de précommande', en: '9. Pre-order agreement' },
    intro: { fr: 'Cadre de la collaboration en précommande.', en: 'Framework for the pre-order collaboration.' },
    sections: (org) => [
      partiesSection(org),
      {
        heading: { fr: 'Objet', en: 'Purpose' },
        body: {
          fr: 'Le Partenaire consolide les demandes de sa clientèle ; la Maison produit les pièces confirmées. Acomptes et délais : à confirmer.',
          en: 'The Partner consolidates customer demand; the House produces confirmed pieces. Deposits and lead times: to be confirmed.',
        },
      },
    ],
  },
  {
    code: 'accord_depot',
    title: { fr: '10. Accord de dépôt-vente (option)', en: '10. Consignment agreement (optional)' },
    intro: {
      fr: 'Modèle désactivé par défaut — à activer si la Maison retient ce mode.',
      en: 'Disabled by default — to be activated should the House adopt this model.',
    },
    sections: (org) => [
      partiesSection(org),
      { heading: { fr: 'Conditions', en: 'Terms' }, body: tbc },
    ],
  },
  {
    code: 'accord_retail_test',
    title: { fr: '11. Accord Retail Test', en: '11. Retail Test agreement' },
    intro: { fr: 'Cadre de la sélection pilote en boutique.', en: 'Framework for the in-store pilot selection.' },
    sections: (org) => [
      partiesSection(org),
      {
        heading: { fr: 'Objet', en: 'Purpose' },
        body: {
          fr: 'Sélection pilote de 5 à 8 références (volume à confirmer), période de test à convenir, bilan conjoint des ventes et retours clients, puis réassort ou collaboration régulière.',
          en: 'Pilot selection of 5–8 references (volume to be confirmed), trial period to be agreed, joint review of sales and customer feedback, then reorder or regular collaboration.',
        },
      },
    ],
  },
  {
    code: 'politique_expedition',
    title: { fr: "12. Politique d'expédition", en: '12. Shipping policy' },
    intro: { fr: 'Modalités d’expédition des commandes.', en: 'Order shipping terms.' },
    sections: (_org, s) => [
      {
        heading: { fr: 'Modalités', en: 'Terms' },
        body: { fr: `${s.deliveryTerms.fr} — Douanes : ${s.customsNote.fr}`, en: `${s.deliveryTerms.en} — Customs: ${s.customsNote.en}` },
      },
    ],
  },
  {
    code: 'politique_reclamation',
    title: { fr: '13. Politique de réclamation', en: '13. Claims policy' },
    intro: { fr: 'Traitement des réclamations et non-conformités.', en: 'Handling of claims and non-conformities.' },
    sections: (_org, s) => [
      { heading: { fr: 'Modalités', en: 'Terms' }, body: { fr: `Réclamations : ${s.claimsPolicy.fr}. Retours : ${s.returnPolicy.fr}.`, en: `Claims: ${s.claimsPolicy.en}. Returns: ${s.returnPolicy.en}.` } },
    ],
  },
  {
    code: 'pv_reception',
    title: { fr: '14. Procès-verbal de réception', en: '14. Receipt report' },
    intro: { fr: 'Constat contradictoire à la réception des pièces.', en: 'Joint record upon receipt of the pieces.' },
    sections: (org) => [
      partiesSection(org),
      {
        heading: { fr: 'Constat', en: 'Record' },
        body: {
          fr: 'Le Partenaire déclare avoir réceptionné la commande référencée, et consigne ici toute réserve (quantités, état, conformité) : ____________________',
          en: 'The Partner acknowledges receipt of the referenced order and records any reservations here (quantities, condition, conformity): ____________________',
        },
      },
    ],
  },
  {
    code: 'demande_reassort',
    title: { fr: '15. Formulaire de demande de réassort', en: '15. Reorder request form' },
    intro: { fr: 'Demande de réapprovisionnement de références déjà commandées.', en: 'Request to restock previously ordered references.' },
    sections: (_org, s) => [
      {
        heading: { fr: 'Modalités', en: 'Terms' },
        body: { fr: `Références, quantités et délais souhaités à préciser. Politique de réassort : ${s.restockPolicy.fr}.`, en: `References, quantities and requested lead times to be specified. Reorder policy: ${s.restockPolicy.en}.` },
      },
    ],
  },
]

function tbcBody(): { fr: string; en: string } {
  return { fr: 'à confirmer', en: 'to be confirmed' }
}
