/* Étape 1 de l'adaptateur Supabase : hydratation du catalogue public/pro
 * (capsules, produits, variantes, médias, prix, conditions, réglages de
 * marque) depuis la base réelle, mappée vers le modèle applicatif.
 * Les autres collections (sélections, devis, commandes, CRM) restent en mode
 * local tant que l'étape 2 (écritures + auth Supabase) n'est pas activée —
 * voir src/data/supabase-adapter.md. */
import { supabase, storagePublicUrl } from './client'
import type {
  Availability, BrandSettings, Capsule, Category, Gender, Occasion, Product,
  ProductStatus, Visibility, WholesalePrice,
} from '../types'

interface CatalogueHydration {
  capsules: Capsule[]
  products: Product[]
  prices: WholesalePrice[]
  settingsPatch: Partial<BrandSettings>
}

const loc = (fr: unknown, en: unknown) => ({ fr: String(fr ?? ''), en: String(en ?? '') })
const locOrNull = (fr: unknown, en: unknown) => (fr == null && en == null ? null : loc(fr, en))

export async function hydrateCatalogue(): Promise<CatalogueHydration | null> {
  if (!supabase) return null
  const [caps, prods, variants, media, prices, terms, settings] = await Promise.all([
    supabase.from('capsules').select('*').order('display_order'),
    supabase.from('products').select('*').order('display_order'),
    supabase.from('product_variants').select('*'),
    supabase.from('product_media').select('*').order('display_order'),
    supabase.from('wholesale_prices').select('*'),
    supabase.from('commercial_terms').select('*').limit(1),
    supabase.from('brand_settings').select('*'),
  ])
  const failed = [caps, prods, variants, media, prices, terms, settings].find((r) => r.error)
  if (failed?.error) {
    console.warn('[supabase] hydratation impossible :', failed.error.message)
    return null
  }

  const capsules: Capsule[] = (caps.data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: loc(c.name_fr, c.name_en),
    manifesto: loc(c.manifesto_fr, c.manifesto_en),
    displayOrder: c.display_order ?? 0,
  }))

  const products: Product[] = (prods.data ?? []).map((p) => ({
    id: p.id,
    reference: p.reference,
    capsuleId: p.capsule_id ?? '',
    category: p.category as Category,
    gender: p.gender as Gender,
    occasions: (p.occasions ?? []) as Occasion[],
    name: loc(p.name_fr, p.name_en),
    description: loc(p.description_fr, p.description_en),
    editorialText: loc(p.editorial_text_fr, p.editorial_text_en),
    materials: locOrNull(p.materials_fr, p.materials_en),
    care: locOrNull(p.care_fr, p.care_en),
    customization: locOrNull(p.customization_fr, p.customization_en),
    leadTimeDays: p.lead_time_days,
    minOrderQty: p.min_order_qty,
    availability: p.availability as Availability,
    visibility: p.visibility as Visibility,
    status: p.status as ProductStatus,
    isFeatured: Boolean(p.is_featured),
    displayOrder: p.display_order ?? 0,
    commercialPriority: p.commercial_priority ?? 2,
    media: (media.data ?? [])
      .filter((m) => m.product_id === p.id)
      .map((m) => ({
        id: m.id,
        kind: (m.kind === 'editorial' ? 'editorial' : 'packshot') as 'packshot' | 'editorial',
        assetPath: m.is_placeholder ? `/assets/products/${p.reference}/${m.kind}.png` : storagePublicUrl(m.storage_path),
        sourceNote: m.source_note ?? '',
        alt: loc(m.alt_fr, m.alt_en),
        displayOrder: m.display_order ?? 0,
        isPlaceholder: Boolean(m.is_placeholder),
      })),
    variants: (variants.data ?? [])
      .filter((v) => v.product_id === p.id)
      .map((v) => ({
        id: v.id,
        color: locOrNull(v.color_fr, v.color_en),
        sizes: v.sizes,
        availability: v.availability as Availability,
      })),
    createdAt: p.created_at,
  }))

  const wholesalePrices: WholesalePrice[] = (prices.data ?? []).map((w) => ({
    id: w.id,
    productId: w.product_id,
    priceList: 'standard',
    currency: (w.currency ?? 'XAF') as WholesalePrice['currency'],
    wholesalePrice: w.wholesale_price == null ? null : Number(w.wholesale_price),
    rrp: w.rrp == null ? null : Number(w.rrp),
  }))

  const settingsPatch: Partial<BrandSettings> = {}
  const t = terms.data?.[0]
  if (t) {
    settingsPatch.currency = (t.currency ?? 'XAF') as BrandSettings['currency']
    if (t.price_validity) settingsPatch.priceValidity = t.price_validity
    if (t.global_minimum) settingsPatch.globalMinimum = t.global_minimum
    if (t.lead_times) settingsPatch.productionLeadTime = t.lead_times
    if (t.production_terms) settingsPatch.productionCapacity = t.production_terms
    if (t.payment_fr || t.payment_en) settingsPatch.paymentTerms = loc(t.payment_fr, t.payment_en)
    if (t.shipping_fr || t.shipping_en) settingsPatch.deliveryTerms = loc(t.shipping_fr, t.shipping_en)
    if (t.customs_fr || t.customs_en) settingsPatch.customsNote = loc(t.customs_fr, t.customs_en)
    if (t.returns_fr || t.returns_en) settingsPatch.returnPolicy = loc(t.returns_fr, t.returns_en)
    if (t.claims_fr || t.claims_en) settingsPatch.claimsPolicy = loc(t.claims_fr, t.claims_en)
    if (t.restock_fr || t.restock_en) settingsPatch.restockPolicy = loc(t.restock_fr, t.restock_en)
    if (t.exclusivity_fr || t.exclusivity_en) settingsPatch.exclusivityTerms = loc(t.exclusivity_fr, t.exclusivity_en)
  }
  for (const row of settings.data ?? []) {
    const v = row.value_fr ?? row.value_en ?? ''
    switch (row.key) {
      case 'logo': settingsPatch.logoNote = v; break
      case 'whatsapp': settingsPatch.whatsapp = v; break
      case 'email': settingsPatch.email = v; break
      case 'instagram': settingsPatch.instagram = v; break
      case 'facebook': settingsPatch.facebook = v; break
      case 'atelier_address': settingsPatch.atelierAddress = v; break
      case 'materials': settingsPatch.defaultMaterials = v; break
      case 'sizes': settingsPatch.defaultSizes = v; break
      case 'production_capacity': settingsPatch.productionCapacity = v; break
      case 'production_lead_time': settingsPatch.productionLeadTime = v; break
    }
  }

  return { capsules, products, prices: wholesalePrices, settingsPatch }
}

/* Formulaires publics → RPC sécurisées (security definer, validation SQL). */
export async function submitAccessRequestRemote(payload: Record<string, string | null>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('submit_access_request', { payload })
  if (error) console.warn('[supabase] submit_access_request :', error.message)
}

export async function submitAppointmentRemote(payload: Record<string, string | null>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('submit_appointment', { payload })
  if (error) console.warn('[supabase] submit_appointment :', error.message)
}
