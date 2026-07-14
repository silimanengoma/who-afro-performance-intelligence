/* Gestion des produits : édition complète sans toucher au code
 * (critère d'acceptation), archivage, pièce vedette, visibilité. */
import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { uid, useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Button, FieldWrap, SectionTitle, Select, TextArea, TextInput } from '../../components/ui'
import { ProductImage } from '../../components/ProductImage'
import { NotFound } from '../system/NotFound'
import type { Availability, Category, Gender, Product, ProductStatus, Visibility } from '../../data/types'

export function ProductsAdmin() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const [showArchived, setShowArchived] = useState(false)
  const list = db.products.filter((p) => (showArchived ? true : p.status !== 'archived'))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle overline={t('admin.products')} title={lx({ fr: 'Catalogue', en: 'Catalogue' })} />
        <label className="flex items-center gap-2 text-sm text-brun">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          {lx({ fr: 'Afficher les archivés', en: 'Show archived' })}
        </label>
      </div>
      <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
        {list.map((p) => (
          <li key={p.id}>
            <Link to={`/admin/produits/${p.id}`} className="flex items-center gap-4 px-4 py-2.5 hover:bg-sable-100/50">
              <ProductImage media={p.media[0]} reference={p.reference} className="w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-nuit">{p.reference} — {lx(p.name)}</p>
                <p className="text-xs text-brun/70">{t(`category.${p.category}`)} · {t(`gender.${p.gender}`)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {p.isFeatured && <Badge tone="gold">{t('product.featured')}</Badge>}
                <Badge tone={p.status === 'active' ? 'success' : p.status === 'draft' ? 'warning' : 'neutral'}>{p.status}</Badge>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs italic text-brun/70">
        {lx({
          fr: '43 autres visuels détourés restent disponibles dans Dropbox pour créer de nouvelles fiches (voir docs/CONTENT_INVENTORY.md).',
          en: '43 more cut-out visuals remain available in Dropbox to create new sheets (see docs/CONTENT_INVENTORY.md).',
        })}
      </p>
    </div>
  )
}

export function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lx, lang } = useI18n()
  const { db, update, audit } = useStore()
  const { user } = useAuth()
  const product = db.products.find((p) => p.id === id)
  const [draft, setDraft] = useState<Partial<Product>>({})
  const [saved, setSaved] = useState(false)

  if (!product) return <NotFound />
  const v = { ...product, ...draft }

  const setLoc = (field: 'name' | 'description' | 'editorialText', locale: 'fr' | 'en', value: string) =>
    setDraft((d) => ({ ...d, [field]: { ...(d[field] ?? product[field]), [locale]: value } }))

  const save = () => {
    update((d) => ({ ...d, products: d.products.map((p) => (p.id === product.id ? { ...p, ...draft } : p)) }))
    audit(user?.email ?? '', 'product_updated', 'products', product.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const duplicate = () => {
    const copyRef = `${product.reference}-COPIE`
    if (db.products.some((p) => p.reference === copyRef)) return
    const copy: Product = {
      ...product, ...draft,
      id: uid('prod'), reference: copyRef,
      status: 'draft', isFeatured: false,
      media: product.media.map((m) => ({ ...m, id: uid('med') })),
      variants: product.variants.map((x) => ({ ...x, id: uid('var') })),
      createdAt: new Date().toISOString(),
    }
    update((d) => ({ ...d, products: [copy, ...d.products], prices: [...d.prices, { id: uid('wp'), productId: copy.id, priceList: 'standard', currency: d.settings.currency, wholesalePrice: null, rrp: null }] }))
    audit(user?.email ?? '', 'product_duplicated', 'products', copy.id)
    navigate(`/admin/produits/${copy.id}`)
  }

  return (
    <div className="max-w-3xl">
      <Link to="/admin/produits" className="text-sm text-or-500 underline-offset-4 hover:underline">← {t('admin.products')}</Link>
      <h1 className="mt-3 font-editorial text-3xl text-nuit">{product.reference}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FieldWrap htmlFor="name-fr" label="Nom (FR)"><TextInput id="name-fr" value={v.name.fr} onChange={(e) => setLoc('name', 'fr', e.target.value)} /></FieldWrap>
        <FieldWrap htmlFor="name-en" label="Name (EN)"><TextInput id="name-en" value={v.name.en} onChange={(e) => setLoc('name', 'en', e.target.value)} /></FieldWrap>
        <div className="sm:col-span-2">
          <FieldWrap htmlFor="desc-fr" label="Description (FR)"><TextArea id="desc-fr" value={v.description.fr} onChange={(e) => setLoc('description', 'fr', e.target.value)} /></FieldWrap>
        </div>
        <div className="sm:col-span-2">
          <FieldWrap htmlFor="desc-en" label="Description (EN)"><TextArea id="desc-en" value={v.description.en} onChange={(e) => setLoc('description', 'en', e.target.value)} /></FieldWrap>
        </div>
        <FieldWrap htmlFor="edito-fr" label="Texte éditorial (FR)"><TextArea id="edito-fr" rows={2} value={v.editorialText.fr} onChange={(e) => setLoc('editorialText', 'fr', e.target.value)} /></FieldWrap>
        <FieldWrap htmlFor="edito-en" label="Editorial text (EN)"><TextArea id="edito-en" rows={2} value={v.editorialText.en} onChange={(e) => setLoc('editorialText', 'en', e.target.value)} /></FieldWrap>

        <FieldWrap htmlFor="category" label={t('product.category')}>
          <Select id="category" value={v.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as Category }))}>
            {(['ensemble', 'robe', 'boubou', 'gilet', 'haut'] as Category[]).map((c) => <option key={c} value={c}>{t(`category.${c}`)}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="gender" label={t('product.gender')}>
          <Select id="gender" value={v.gender} onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value as Gender }))}>
            {(['femme', 'homme', 'mixte'] as Gender[]).map((g) => <option key={g} value={g}>{t(`gender.${g}`)}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="capsule" label={t('product.capsule')}>
          <Select id="capsule" value={v.capsuleId} onChange={(e) => setDraft((d) => ({ ...d, capsuleId: e.target.value }))}>
            {db.capsules.map((c) => <option key={c.id} value={c.id}>{lx(c.name)}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="availability" label={t('product.availability')}>
          <Select id="availability" value={v.availability} onChange={(e) => setDraft((d) => ({ ...d, availability: e.target.value as Availability }))}>
            {(['available', 'on_request', 'preorder', 'sold_out', 'tbc'] as Availability[]).map((a) => <option key={a} value={a}>{t(`availability.${a}`)}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="visibility" label={lang === 'fr' ? 'Visibilité' : 'Visibility'}>
          <Select id="visibility" value={v.visibility} onChange={(e) => setDraft((d) => ({ ...d, visibility: e.target.value as Visibility }))}>
            <option value="public">{lang === 'fr' ? 'Publique (lookbook)' : 'Public (lookbook)'}</option>
            <option value="professional">{lang === 'fr' ? 'Professionnelle' : 'Professional'}</option>
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="status" label={t('common.status')}>
          <Select id="status" value={v.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ProductStatus }))}>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">{lang === 'fr' ? 'archivé' : 'archived'}</option>
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="moq" label={t('product.moq')} hint={t('common.tbc')}>
          <TextInput id="moq" type="number" min={0} value={v.minOrderQty ?? ''} onChange={(e) => setDraft((d) => ({ ...d, minOrderQty: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) }))} />
        </FieldWrap>
        <FieldWrap htmlFor="leadtime" label={`${t('product.leadTime')} (jours)`} hint={t('common.tbc')}>
          <TextInput id="leadtime" type="number" min={0} value={v.leadTimeDays ?? ''} onChange={(e) => setDraft((d) => ({ ...d, leadTimeDays: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) }))} />
        </FieldWrap>
        <FieldWrap htmlFor="order" label={lang === 'fr' ? "Ordre d'affichage" : 'Display order'}>
          <TextInput id="order" type="number" value={v.displayOrder} onChange={(e) => setDraft((d) => ({ ...d, displayOrder: Number(e.target.value) || 0 }))} />
        </FieldWrap>
        <div className="flex items-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-brun">
            <input type="checkbox" checked={v.isFeatured} onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))} />
            {t('product.featured')}
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={save}>{t('common.save')}</Button>
        <Button variant="secondary" onClick={duplicate}>{lang === 'fr' ? 'Dupliquer en brouillon' : 'Duplicate as draft'}</Button>
        {saved && <span className="self-center text-sm text-succes">✓</span>}
      </div>

      <section className="mt-8">
        <h2 className="mb-2 font-editorial text-xl text-nuit">{t('admin.media')}</h2>
        <ul className="space-y-2 text-sm">
          {product.media.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border border-sable bg-white p-3">
              <ProductImage media={m} reference={product.reference} className="w-14 shrink-0" />
              <div>
                <p className="text-nuit">{m.kind} — <code className="text-xs">{m.assetPath}</code></p>
                <p className="text-xs text-brun/70">{m.sourceNote}</p>
                {m.isPlaceholder && <Badge tone="warning">{lang === 'fr' ? 'Placeholder — visuel à importer' : 'Placeholder — visual to import'}</Badge>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
