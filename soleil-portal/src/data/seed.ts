// Données initiales du mode démonstration.
// Règle absolue : aucun fait commercial inventé. Les descriptions se limitent
// à ce que l'inventaire Dropbox établit (typologie, collection) ; matières,
// tailles, prix, délais et MOQ restent null → « à confirmer », administrables.

import type {
  BrandSettings, Capsule, Category, Gender, Occasion, Organization,
  Product, UserAccount, WholesalePrice,
} from './types'

export const SEED_VERSION = 3

export const capsules: Capsule[] = [
  {
    id: 'cap-executif',
    slug: 'executif-brazzaville',
    displayOrder: 1,
    name: { fr: "L'Exécutif de Brazzaville", en: 'The Brazzaville Executive' },
    manifesto: {
      fr: "Un vestiaire de fonction et de représentation, taillé pour les hommes qui portent leurs responsabilités avec allure. Des ensembles pensés à Brazzaville, pour les bureaux, les tribunes et les salles où l'on décide.",
      en: 'A wardrobe for office and representation — cut for men who carry responsibility with presence. Ensembles conceived in Brazzaville for boardrooms, podiums and the rooms where decisions are made.',
    },
  },
  {
    id: 'cap-femme-soleil',
    slug: 'femme-soleil',
    displayOrder: 2,
    name: { fr: 'La Femme Soleil', en: 'The Soleil Woman' },
    manifesto: {
      fr: "Des robes d'affirmation, du matin professionnel au soir des grandes occasions. La Femme Soleil ne suit pas la lumière : elle la porte.",
      en: 'Dresses of quiet assertion, from working mornings to evening occasions. The Soleil woman does not chase the light — she wears it.',
    },
  },
  {
    id: 'cap-ceremonie',
    slug: 'ceremonie-distinction',
    displayOrder: 3,
    name: { fr: 'Cérémonie & Distinction', en: 'Ceremony & Distinction' },
    manifesto: {
      fr: "Boubous et pièces d'apparat pour les jours qui comptent : mariages, cérémonies officielles, célébrations. L'étoffe des moments solennels.",
      en: 'Boubous and ceremonial pieces for the days that matter: weddings, official ceremonies, celebrations. The fabric of solemn moments.',
    },
  },
  {
    id: 'cap-signatures',
    slug: 'signatures-brazzaville',
    displayOrder: 4,
    name: { fr: 'Signatures de Brazzaville', en: 'Brazzaville Signatures' },
    manifesto: {
      fr: "Gilets et hauts qui signent une silhouette. Les pièces d'appoint qui font reconnaître une maison au premier regard.",
      en: 'Waistcoats and tops that sign a silhouette — the finishing pieces by which a house is recognised at first glance.',
    },
  },
]

interface SeedProductInput {
  reference: string
  capsuleId: string
  category: Category
  gender: Gender
  occasions: Occasion[]
  dropboxFile: string
  nameFr: string
  nameEn: string
  editoFr: string
  editoEn: string
  isFeatured?: boolean
}

const catLabel: Record<Category, { fr: string; en: string }> = {
  ensemble: { fr: 'Ensemble deux pièces pour homme', en: 'Two-piece ensemble for men' },
  robe: { fr: 'Robe', en: 'Dress' },
  boubou: { fr: 'Boubou', en: 'Boubou' },
  gilet: { fr: 'Gilet', en: 'Waistcoat' },
  haut: { fr: 'Haut', en: 'Top' },
}

function makeProduct(i: number, p: SeedProductInput): Product {
  const c = catLabel[p.category]
  return {
    id: `prod-${p.reference.toLowerCase()}`,
    reference: p.reference,
    capsuleId: p.capsuleId,
    category: p.category,
    gender: p.gender,
    occasions: p.occasions,
    name: { fr: p.nameFr, en: p.nameEn },
    description: {
      fr: `${c.fr} de la collection Foire 2024. Fiche détaillée en cours de constitution — matières, tailles et finitions à confirmer par la maison.`,
      en: `${c.en} from the Foire 2024 collection. Full details being finalised — materials, sizes and finishes to be confirmed by the house.`,
    },
    editorialText: { fr: p.editoFr, en: p.editoEn },
    materials: null,
    care: null,
    customization: null,
    leadTimeDays: null,
    minOrderQty: null,
    availability: 'on_request',
    visibility: 'professional',
    status: 'active',
    isFeatured: p.isFeatured ?? false,
    displayOrder: i,
    commercialPriority: p.isFeatured ? 1 : 2,
    media: [
      {
        id: `med-${p.reference.toLowerCase()}-1`,
        kind: 'packshot',
        assetPath: `/assets/products/${p.reference}/packshot.png`,
        sourceNote: `Dropbox : /Perso/Soleil Creation/Foire 2024/Optimisées/${p.dropboxFile}`,
        alt: { fr: `${p.nameFr} — visuel détouré`, en: `${p.nameEn} — cut-out visual` },
        displayOrder: 1,
        isPlaceholder: true,
      },
      {
        id: `med-${p.reference.toLowerCase()}-2`,
        kind: 'editorial',
        assetPath: `/assets/products/${p.reference}/editorial-1.jpg`,
        sourceNote: 'Dropbox : /Perso/Soleil Creation/Foire 2024/Shooting/ — photo portée à apparier (décision D2)',
        alt: { fr: `${p.nameFr} — photo portée`, en: `${p.nameEn} — worn editorial photo` },
        displayOrder: 2,
        isPlaceholder: true,
      },
    ],
    variants: [
      {
        id: `var-${p.reference.toLowerCase()}-1`,
        color: null,
        sizes: null,
        availability: 'on_request',
      },
    ],
    createdAt: '2026-07-13T00:00:00Z',
  }
}

const seedInputs: SeedProductInput[] = [
  {
    reference: 'SC-H-003', capsuleId: 'cap-executif', category: 'ensemble', gender: 'homme',
    occasions: ['professionnel', 'representation'], dropboxFile: 'Ensemble_Hommes_3.png',
    nameFr: 'Ensemble Exécutif N°3', nameEn: 'Executive Ensemble No. 3', isFeatured: true,
    editoFr: "Ouverture de la capsule Exécutif : la silhouette de fonction selon Soleil Création.",
    editoEn: 'The opening statement of the Executive capsule: office presence, the Soleil Création way.',
  },
  {
    reference: 'SC-H-005', capsuleId: 'cap-executif', category: 'ensemble', gender: 'homme',
    occasions: ['professionnel', 'representation'], dropboxFile: 'Ensemble_Hommes_5.png',
    nameFr: 'Ensemble Exécutif N°5', nameEn: 'Executive Ensemble No. 5',
    editoFr: "Pour les journées où l'on représente plus que soi-même.",
    editoEn: 'For the days when you represent more than yourself.',
  },
  {
    reference: 'SC-H-008', capsuleId: 'cap-executif', category: 'ensemble', gender: 'homme',
    occasions: ['professionnel', 'quotidien'], dropboxFile: 'Ensemble_Hommes_8.png',
    nameFr: 'Ensemble Exécutif N°8', nameEn: 'Executive Ensemble No. 8',
    editoFr: 'Du bureau au dîner, sans changer de tenue ni de tenue de route.',
    editoEn: 'From office to dinner without changing clothes — or composure.',
  },
  {
    reference: 'SC-H-011', capsuleId: 'cap-executif', category: 'ensemble', gender: 'homme',
    occasions: ['professionnel', 'representation'], dropboxFile: 'Ensemble_Hommes_11.png',
    nameFr: 'Ensemble Exécutif N°11', nameEn: 'Executive Ensemble No. 11',
    editoFr: "L'autorité tranquille d'une coupe pensée à Brazzaville.",
    editoEn: 'The quiet authority of a cut conceived in Brazzaville.',
  },
  {
    reference: 'SC-H-017', capsuleId: 'cap-ceremonie', category: 'ensemble', gender: 'homme',
    occasions: ['ceremonie', 'evenement'], dropboxFile: 'Ensemble_Hommes_17.png',
    nameFr: 'Ensemble Cérémonie N°17', nameEn: 'Ceremony Ensemble No. 17', isFeatured: true,
    editoFr: 'Pour les jours de fête et les photographies qui restent.',
    editoEn: 'For celebration days and the photographs that endure.',
  },
  {
    reference: 'SC-H-024', capsuleId: 'cap-ceremonie', category: 'ensemble', gender: 'homme',
    occasions: ['ceremonie', 'evenement'], dropboxFile: 'Ensemble_Hommes_24.png',
    nameFr: 'Ensemble Cérémonie N°24', nameEn: 'Ceremony Ensemble No. 24',
    editoFr: "L'apparat sans l'ostentation.",
    editoEn: 'Ceremonial presence without ostentation.',
  },
  {
    reference: 'SC-H-028', capsuleId: 'cap-signatures', category: 'ensemble', gender: 'homme',
    occasions: ['evenement', 'quotidien'], dropboxFile: 'Ensemble_Hommes_28.png',
    nameFr: 'Ensemble Signature N°28', nameEn: 'Signature Ensemble No. 28',
    editoFr: 'Une pièce qui se reconnaît de loin — et se retient de près.',
    editoEn: 'Recognised from afar, remembered up close.',
  },
  {
    reference: 'SC-F-001', capsuleId: 'cap-femme-soleil', category: 'robe', gender: 'femme',
    occasions: ['professionnel', 'quotidien'], dropboxFile: 'Femmes/Robes_1.png',
    nameFr: 'Robe Soleil N°1', nameEn: 'Soleil Dress No. 1', isFeatured: true,
    editoFr: 'La première robe de la capsule : celle qui donne le ton.',
    editoEn: 'The capsule opener: the dress that sets the tone.',
  },
  {
    reference: 'SC-F-004', capsuleId: 'cap-femme-soleil', category: 'robe', gender: 'femme',
    occasions: ['professionnel', 'representation'], dropboxFile: 'Femmes/Robes_4.png',
    nameFr: 'Robe Soleil N°4', nameEn: 'Soleil Dress No. 4',
    editoFr: 'Pensée pour les journées qui enchaînent réunions et apparitions.',
    editoEn: 'Made for days that run from meetings to appearances.',
  },
  {
    reference: 'SC-F-007', capsuleId: 'cap-femme-soleil', category: 'robe', gender: 'femme',
    occasions: ['quotidien', 'evenement'], dropboxFile: 'Femmes/Robes_7.png',
    nameFr: 'Robe Soleil N°7', nameEn: 'Soleil Dress No. 7',
    editoFr: "L'élégance qui ne demande pas la permission.",
    editoEn: 'Elegance that asks no permission.',
  },
  {
    reference: 'SC-F-012', capsuleId: 'cap-ceremonie', category: 'robe', gender: 'femme',
    occasions: ['ceremonie', 'evenement'], dropboxFile: 'Femmes/Robes_12.png',
    nameFr: 'Robe Cérémonie N°12', nameEn: 'Ceremony Dress No. 12', isFeatured: true,
    editoFr: 'Pour entrer dans une salle et que la salle s’en souvienne.',
    editoEn: 'To enter a room — and have the room remember.',
  },
  {
    reference: 'SC-F-016', capsuleId: 'cap-femme-soleil', category: 'robe', gender: 'femme',
    occasions: ['professionnel', 'quotidien'], dropboxFile: 'Femmes/Robes_16.png',
    nameFr: 'Robe Soleil N°16', nameEn: 'Soleil Dress No. 16',
    editoFr: 'Une ligne nette pour les agendas chargés.',
    editoEn: 'A clean line for full agendas.',
  },
  {
    reference: 'SC-F-020', capsuleId: 'cap-ceremonie', category: 'robe', gender: 'femme',
    occasions: ['ceremonie'], dropboxFile: 'Femmes/Robes_20.png',
    nameFr: 'Robe Cérémonie N°20', nameEn: 'Ceremony Dress No. 20',
    editoFr: "L'étoffe des grands jours.",
    editoEn: 'The fabric of great days.',
  },
  {
    reference: 'SC-B-001', capsuleId: 'cap-ceremonie', category: 'boubou', gender: 'mixte',
    occasions: ['ceremonie', 'representation'], dropboxFile: 'Boubou1.png',
    nameFr: 'Boubou Distinction N°1', nameEn: 'Distinction Boubou No. 1', isFeatured: true,
    editoFr: 'Le boubou selon Soleil Création : ampleur maîtrisée, présence immédiate.',
    editoEn: 'The boubou, the Soleil Création way: mastered volume, immediate presence.',
  },
  {
    reference: 'SC-G-001', capsuleId: 'cap-signatures', category: 'gilet', gender: 'homme',
    occasions: ['professionnel', 'evenement'], dropboxFile: 'Gilet_01.png',
    nameFr: 'Gilet Signature N°1', nameEn: 'Signature Waistcoat No. 1',
    editoFr: 'La pièce qui transforme une tenue en signature.',
    editoEn: 'The piece that turns an outfit into a signature.',
  },
  {
    reference: 'SC-T-002', capsuleId: 'cap-signatures', category: 'haut', gender: 'femme',
    occasions: ['quotidien', 'professionnel'], dropboxFile: 'Haut_02.png',
    nameFr: 'Haut Signature N°2', nameEn: 'Signature Top No. 2',
    editoFr: "L'appoint précis d'un vestiaire construit.",
    editoEn: 'The precise complement to a considered wardrobe.',
  },
]

export const products: Product[] = seedInputs.map((p, i) => makeProduct(i + 1, p))

// Prix : volontairement null — à confirmer par la maison (jamais inventés).
export const wholesalePrices: WholesalePrice[] = products.map((p) => ({
  id: `wp-${p.reference.toLowerCase()}`,
  productId: p.id,
  priceList: 'standard',
  currency: 'XAF',
  wholesalePrice: null,
  rrp: null,
}))

export const brandSettings: BrandSettings = {
  logoNote: '[LOGO OFFICIEL] — fichier disponible : Dropbox /Perso/Soleil Creation/Logo Soleil Création.jpeg',
  whatsapp: '[NUMÉRO WHATSAPP PROFESSIONNEL]',
  email: '[ADRESSE E-MAIL COMMERCIALE]',
  instagram: '[COMPTE INSTAGRAM]',
  facebook: '[COMPTE FACEBOOK]',
  atelierAddress: "[ADRESSE DE L'ATELIER] — Brazzaville, République du Congo",
  defaultMaterials: '[MATIÈRES]',
  defaultSizes: '[TAILLES]',
  productionCapacity: '[CAPACITÉ DE PRODUCTION]',
  productionLeadTime: '[DÉLAIS DE PRODUCTION]',
  paymentTerms: { fr: '[MODALITÉS DE PAIEMENT]', en: '[PAYMENT TERMS — to be confirmed]' },
  deliveryTerms: { fr: '[MODALITÉS DE LIVRAISON]', en: '[DELIVERY TERMS — to be confirmed]' },
  returnPolicy: { fr: '[POLITIQUE DE RETOUR]', en: '[RETURN POLICY — to be confirmed]' },
  exclusivityTerms: { fr: "[CONDITIONS D'EXCLUSIVITÉ]", en: '[EXCLUSIVITY TERMS — to be confirmed]' },
  currency: 'XAF',
  priceValidity: 'à confirmer',
  globalMinimum: 'à confirmer',
  customsNote: { fr: 'Droits et taxes à la charge du destinataire, sauf accord contraire — à confirmer.', en: 'Duties and taxes borne by the recipient unless otherwise agreed — to be confirmed.' },
  claimsPolicy: { fr: 'à confirmer', en: 'to be confirmed' },
  restockPolicy: { fr: 'à confirmer', en: 'to be confirmed' },
}

// Organisation et comptes de démonstration — clairement fictifs.
export const demoOrganization: Organization = {
  id: 'org-demo',
  legalName: 'Boutique Démo SARL (fictive)',
  tradeName: 'Concept Store Démo',
  shopType: 'Concept store',
  contactName: 'Acheteuse Démo',
  address: '1 rue de la Démonstration',
  city: 'Paris',
  country: 'France',
  email: 'boutique@demo.example',
  whatsapp: '+00 0 00 00 00 00',
  website: 'https://demo.example',
  instagram: '@boutique.demo',
  targetClientele: 'Clientèle urbaine 25-55 ans (démo)',
  priceRange: 'Milieu / haut de gamme (démo)',
  brandsCarried: 'Marques de démonstration',
  deliveryCountries: 'France, Belgique (démo)',
  preferredModel: 'retail_test',
  potentialEstimate: 'moyen',
  internalNotes: 'Compte de démonstration — données fictives pour le prototype.',
  pipelineStatus: 'acces_approuve',
  isDemo: true,
  createdAt: '2026-07-01T09:00:00Z',
}

export const demoUsers: UserAccount[] = [
  {
    id: 'user-buyer', email: 'boutique@demo.example', password: 'soleil2026',
    fullName: 'Acheteuse Démo', role: 'buyer', organizationId: 'org-demo', approved: true,
  },
  {
    id: 'user-sales', email: 'ventes@soleilcreation.example', password: 'soleil2026',
    fullName: 'Responsable Ventes (démo)', role: 'sales_admin', organizationId: null, approved: true,
  },
  {
    id: 'user-content', email: 'contenus@soleilcreation.example', password: 'soleil2026',
    fullName: 'Responsable Contenus (démo)', role: 'content_admin', organizationId: null, approved: true,
  },
  {
    id: 'user-direction', email: 'direction@soleilcreation.example', password: 'soleil2026',
    fullName: 'Solina Rolla NGOMA (démo)', role: 'super_admin', organizationId: null, approved: true,
  },
]
