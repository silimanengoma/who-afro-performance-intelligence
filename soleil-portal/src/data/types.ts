// Modèle de données du portail — miroir TypeScript du schéma Supabase
// (voir docs/DATA_MODEL.md et supabase/migrations/). Les champs commerciaux
// non confirmés sont null et affichés « à confirmer ».

export type Locale = 'fr' | 'en'
export type Role = 'public' | 'buyer' | 'sales_admin' | 'content_admin' | 'super_admin'

export interface Localized {
  fr: string
  en: string
}

export type Availability = 'available' | 'on_request' | 'preorder' | 'sold_out' | 'tbc'
export type ProductStatus = 'draft' | 'active' | 'archived'
export type Visibility = 'public' | 'professional'
export type Category = 'ensemble' | 'robe' | 'boubou' | 'gilet' | 'haut'
export type Gender = 'femme' | 'homme' | 'mixte'
export type Occasion = 'professionnel' | 'representation' | 'ceremonie' | 'evenement' | 'quotidien'

export interface Capsule {
  id: string
  slug: string
  name: Localized
  manifesto: Localized
  displayOrder: number
}

export interface ProductMedia {
  id: string
  kind: 'packshot' | 'editorial'
  /** Chemin attendu sous public/ ; si absent, placeholder identifié. */
  assetPath: string
  /** Chemin Dropbox source (fichier de correspondance). */
  sourceNote: string
  alt: Localized
  displayOrder: number
  isPlaceholder: boolean
}

export interface ProductVariant {
  id: string
  color: Localized | null
  /** null = « à confirmer » */
  sizes: string[] | null
  availability: Availability
}

export interface WholesalePrice {
  id: string
  productId: string
  priceList: 'standard'
  currency: 'XAF' | 'EUR' | 'USD'
  /** null = à confirmer (jamais inventé) */
  wholesalePrice: number | null
  rrp: number | null
}

export interface Product {
  id: string
  reference: string
  capsuleId: string
  category: Category
  gender: Gender
  occasions: Occasion[]
  name: Localized
  description: Localized
  editorialText: Localized
  materials: Localized | null
  care: Localized | null
  customization: Localized | null
  leadTimeDays: number | null
  minOrderQty: number | null
  availability: Availability
  visibility: Visibility
  status: ProductStatus
  isFeatured: boolean
  displayOrder: number
  commercialPriority: number
  media: ProductMedia[]
  variants: ProductVariant[]
  createdAt: string
}

export type PipelineStatus =
  | 'nouveau_prospect' | 'contacte' | 'lookbook_consulte' | 'acces_demande'
  | 'acces_approuve' | 'showroom_consulte' | 'selection_commencee' | 'devis_demande'
  | 'devis_envoye' | 'negociation' | 'accord_conclu' | 'commande_preparation'
  | 'commande_expediee' | 'partenaire_actif' | 'opportunite_perdue'

export const PIPELINE_ORDER: PipelineStatus[] = [
  'nouveau_prospect', 'contacte', 'lookbook_consulte', 'acces_demande',
  'acces_approuve', 'showroom_consulte', 'selection_commencee', 'devis_demande',
  'devis_envoye', 'negociation', 'accord_conclu', 'commande_preparation',
  'commande_expediee', 'partenaire_actif', 'opportunite_perdue',
]

export interface Organization {
  id: string
  legalName: string
  tradeName: string
  shopType: string
  contactName: string
  address: string
  city: string
  country: string
  email: string
  whatsapp: string
  website: string
  instagram: string
  targetClientele: string
  priceRange: string
  brandsCarried: string
  deliveryCountries: string
  preferredModel: PartnershipModelCode | null
  potentialEstimate: 'faible' | 'moyen' | 'fort' | null
  /** Réservé admin — jamais exposé côté acheteur. */
  internalNotes: string
  pipelineStatus: PipelineStatus
  isDemo: boolean
  createdAt: string
}

export interface UserAccount {
  id: string
  email: string
  /** Démo uniquement — en production : Supabase Auth. */
  password: string
  fullName: string
  role: Role
  organizationId: string | null
  approved: boolean
}

export interface SelectionItem {
  id: string
  productId: string
  variantId: string | null
  sizeNotes: string
  colorNotes: string
  indicativeQty: number
  buyerNotes: string
}

export interface Selection {
  id: string
  organizationId: string
  status: 'open' | 'quoted'
  items: SelectionItem[]
  updatedAt: string
}

export interface AccessRequest {
  id: string
  legalName: string
  tradeName: string
  shopType: string
  contactName: string
  email: string
  whatsapp: string
  city: string
  country: string
  website: string
  instagram: string
  targetClientele: string
  priceRange: string
  brandsCarried: string
  preferredModel: PartnershipModelCode | null
  message: string
  status: 'pending' | 'approved' | 'rejected'
  decidedAt: string | null
  rejectionReason: string
  createdAt: string
}

export interface Appointment {
  id: string
  name: string
  organization: string
  email: string
  whatsapp: string
  channel: 'visio' | 'whatsapp' | 'showroom'
  slots: string
  message: string
  status: 'pending' | 'confirmed' | 'done' | 'cancelled'
  createdAt: string
}

export type PartnershipModelCode = 'gros' | 'precommande' | 'retail_test' | 'popup'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'change_requested' | 'rejected' | 'expired'

export interface QuoteItem {
  id: string
  productId: string
  variantLabel: string
  qty: number
  /** Prix unitaire négocié — null tant que non renseigné par l'admin. */
  unitPrice: number | null
}

export interface Quote {
  id: string
  number: string
  organizationId: string
  selectionId: string | null
  partnershipModel: PartnershipModelCode
  currency: 'XAF' | 'EUR' | 'USD'
  items: QuoteItem[]
  shippingNote: string
  leadTimeNote: string
  validUntil: string | null
  status: QuoteStatus
  buyerMessage: string
  buyerComment: string
  adminNotes: string
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 'preparing' | 'confirmed' | 'shipped' | 'delivered' | 'closed'

export interface Order {
  id: string
  number: string
  quoteId: string
  organizationId: string
  status: OrderStatus
  trackingNote: string
  createdAt: string
  updatedAt: string
}

export interface ActivityEvent {
  id: string
  type:
    | 'lookbook_viewed' | 'access_requested' | 'access_approved' | 'access_rejected'
    | 'showroom_viewed' | 'selection_started' | 'selection_updated'
    | 'quote_requested' | 'quote_sent' | 'quote_accepted' | 'quote_change_requested' | 'quote_rejected'
    | 'order_created' | 'order_status_changed'
    | 'sample_requested' | 'customization_requested' | 'appointment_requested'
    | 'product_viewed' | 'admin_edit'
  organizationId: string | null
  refId: string | null
  detail: string
  at: string
}

export interface AppNotification {
  id: string
  audience: 'admin' | 'buyer'
  organizationId: string | null
  templateCode: string
  title: Localized
  body: Localized
  readAt: string | null
  simulated: true
  createdAt: string
}

export interface AdminTask {
  id: string
  title: string
  dueDate: string | null
  organizationId: string | null
  done: boolean
  createdAt: string
}

export interface SharedLink {
  id: string
  token: string
  scope: 'lookbook' | 'selection' | 'linesheet'
  organizationId: string | null
  watermark: string
  expiresAt: string | null
  revokedAt: string | null
  views: number
  createdAt: string
}

export interface AuditLog {
  id: string
  actorEmail: string
  action: string
  entity: string
  entityId: string
  at: string
}

export interface CommunicationLog {
  id: string
  organizationId: string
  channel: 'email' | 'whatsapp' | 'phone' | 'meeting' | 'portal'
  direction: 'in' | 'out'
  summary: string
  at: string
}

/** Configuration administrable — centralise les 17 placeholders du brief. */
export interface BrandSettings {
  logoNote: string
  whatsapp: string
  email: string
  instagram: string
  facebook: string
  atelierAddress: string
  defaultMaterials: string
  defaultSizes: string
  productionCapacity: string
  productionLeadTime: string
  paymentTerms: Localized
  deliveryTerms: Localized
  returnPolicy: Localized
  exclusivityTerms: Localized
  currency: 'XAF' | 'EUR' | 'USD'
  priceValidity: string
  globalMinimum: string
  customsNote: Localized
  claimsPolicy: Localized
  restockPolicy: Localized
}

export const TBC = 'à confirmer' // marqueur : ne jamais remplacer par une invention
