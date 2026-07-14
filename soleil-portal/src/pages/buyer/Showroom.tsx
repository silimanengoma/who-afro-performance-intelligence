/* Showroom interactif — filtres, recherche, tri, comparaison, favoris. */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { ProductImage } from '../../components/ProductImage'
import { Badge, Button, EmptyState, NextStep, Select, TextInput } from '../../components/ui'
import { LinkButton } from '../../components/ui'
import type { Availability, Category, Gender, Occasion, Product } from '../../data/types'

const FAV_KEY = 'soleil-portal-favorites'

export function Showroom() {
  const { t, lx } = useI18n()
  const { db, logActivity, setPipeline } = useStore()
  const { org, addItem, isSelected, selection } = useBuyer()

  const [q, setQ] = useState('')
  const [gender, setGender] = useState<'' | Gender>('')
  const [capsule, setCapsule] = useState('')
  const [category, setCategory] = useState<'' | Category>('')
  const [occasion, setOccasion] = useState<'' | Occasion>('')
  const [availability, setAvailability] = useState<'' | Availability>('')
  const [sort, setSort] = useState<'newest' | 'availability' | 'priority'>('priority')
  const [onlyFav, setOnlyFav] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') } catch { return [] }
  })
  const [compare, setCompare] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (!org) return
    logActivity({ type: 'showroom_viewed', organizationId: org.id, refId: null, detail: '' })
    if (org.pipelineStatus === 'acces_approuve') setPipeline(org.id, 'showroom_consulte')
    // volontairement une seule fois à l'ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFav = (id: string) =>
    setFavorites((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
      localStorage.setItem(FAV_KEY, JSON.stringify(next))
      return next
    })

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]))

  const items = useMemo(() => {
    let list = db.products.filter((p) => p.status === 'active')
    const needle = q.trim().toLowerCase()
    if (needle) {
      list = list.filter(
        (p) =>
          p.reference.toLowerCase().includes(needle) ||
          p.name.fr.toLowerCase().includes(needle) ||
          p.name.en.toLowerCase().includes(needle),
      )
    }
    if (gender) list = list.filter((p) => p.gender === gender)
    if (capsule) list = list.filter((p) => p.capsuleId === capsule)
    if (category) list = list.filter((p) => p.category === category)
    if (occasion) list = list.filter((p) => p.occasions.includes(occasion))
    if (availability) list = list.filter((p) => p.availability === availability)
    if (onlyFav) list = list.filter((p) => favorites.includes(p.id))
    const availRank: Record<Availability, number> = { available: 0, preorder: 1, on_request: 2, tbc: 3, sold_out: 4 }
    return [...list].sort((a, b) => {
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt) || a.displayOrder - b.displayOrder
      if (sort === 'availability') return availRank[a.availability] - availRank[b.availability]
      return a.commercialPriority - b.commercialPriority || a.displayOrder - b.displayOrder
    })
  }, [db.products, q, gender, capsule, category, occasion, availability, sort, onlyFav, favorites])

  const resetFilters = () => {
    setQ(''); setGender(''); setCapsule(''); setCategory(''); setOccasion(''); setAvailability(''); setOnlyFav(false)
  }

  const compared: Product[] = compare
    .map((id) => db.products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))

  const filters = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Select aria-label={t('product.gender')} value={gender} onChange={(e) => setGender(e.target.value as '' | Gender)}>
        <option value="">{t('product.gender')} — {t('common.all')}</option>
        {(['femme', 'homme', 'mixte'] as Gender[]).map((g) => <option key={g} value={g}>{t(`gender.${g}`)}</option>)}
      </Select>
      <Select aria-label={t('product.capsule')} value={capsule} onChange={(e) => setCapsule(e.target.value)}>
        <option value="">{t('product.capsule')} — {t('common.all')}</option>
        {db.capsules.map((c) => <option key={c.id} value={c.id}>{lx(c.name)}</option>)}
      </Select>
      <Select aria-label={t('product.category')} value={category} onChange={(e) => setCategory(e.target.value as '' | Category)}>
        <option value="">{t('product.category')} — {t('common.all')}</option>
        {(['ensemble', 'robe', 'boubou', 'gilet', 'haut'] as Category[]).map((c) => <option key={c} value={c}>{t(`category.${c}`)}</option>)}
      </Select>
      <Select aria-label={t('product.occasion')} value={occasion} onChange={(e) => setOccasion(e.target.value as '' | Occasion)}>
        <option value="">{t('product.occasion')} — {t('common.all')}</option>
        {(['professionnel', 'representation', 'ceremonie', 'evenement', 'quotidien'] as Occasion[]).map((o) => (
          <option key={o} value={o}>{t(`occasion.${o}`)}</option>
        ))}
      </Select>
      <Select aria-label={t('product.availability')} value={availability} onChange={(e) => setAvailability(e.target.value as '' | Availability)}>
        <option value="">{t('product.availability')} — {t('common.all')}</option>
        {(['available', 'on_request', 'preorder', 'sold_out', 'tbc'] as Availability[]).map((a) => (
          <option key={a} value={a}>{t(`availability.${a}`)}</option>
        ))}
      </Select>
      <Select aria-label="Tri" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
        <option value="priority">{t('sort.priority')}</option>
        <option value="newest">{t('sort.newest')}</option>
        <option value="availability">{t('sort.availability')}</option>
      </Select>
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-nuit">{t('buyer.showroom')}</h1>
          <p className="mt-1 text-sm text-brun">{t('common.results', { n: items.length })}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <TextInput
            aria-label={t('common.search')}
            placeholder={`${t('common.search')} — ${lx({ fr: 'nom ou référence', en: 'name or reference' })}`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:w-72"
          />
          <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
            {t('common.filters')}
          </Button>
        </div>
      </div>

      <div className={`mb-6 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
        {filters}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-brun">
            <input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} />
            {t('product.favorite')}s ({favorites.length})
          </label>
          <button className="text-or-500 underline-offset-4 hover:underline" onClick={resetFilters}>
            {t('common.reset')}
          </button>
        </div>
      </div>

      {selection && selection.items.length > 0 && (
        <div className="mb-6">
          <NextStep action={<LinkButton to="/espace-pro/selection" variant="gold">{t('buyer.selection')}</LinkButton>}>
            {t('selection.itemCount', { n: selection.items.length })} — {t('selection.notAnOrder')}
          </NextStep>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucune pièce ne correspond', en: 'No piece matches' })}
          body={lx({ fr: 'Essayez d’élargir vos filtres.', en: 'Try widening your filters.' })}
          action={<Button variant="secondary" onClick={resetFilters}>{t('common.reset')}</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => {
            const cap = db.capsules.find((c) => c.id === p.capsuleId)
            return (
              <article key={p.id} className="group border border-sable bg-white">
                <Link to={`/espace-pro/produit/${p.reference}`}>
                  <ProductImage media={p.media[0]} reference={p.reference} />
                </Link>
                <div className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/espace-pro/produit/${p.reference}`} className="font-editorial text-lg leading-tight text-nuit hover:text-or-500">
                      {lx(p.name)}
                    </Link>
                    <button
                      aria-label={t('product.favorite')}
                      aria-pressed={favorites.includes(p.id)}
                      onClick={() => toggleFav(p.id)}
                      className={`text-lg leading-none ${favorites.includes(p.id) ? 'text-or-500' : 'text-sable'}`}
                    >
                      ♥
                    </button>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-brun/60">
                    {p.reference}{cap ? ` · ${lx(cap.name)}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge tone={p.availability === 'available' ? 'success' : 'neutral'}>
                      {t(`availability.${p.availability}`)}
                    </Badge>
                    {p.isFeatured && <Badge tone="gold">{t('product.featured')}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant={isSelected(p.id) ? 'secondary' : 'primary'}
                      className="flex-1 !min-h-9 !px-3 !py-1.5 text-xs"
                      onClick={() => addItem(p.id)}
                      disabled={isSelected(p.id)}
                    >
                      {isSelected(p.id) ? t('product.inSelection') : t('product.addToSelection')}
                    </Button>
                    <label className="flex items-center gap-1 text-xs text-brun/70">
                      <input
                        type="checkbox"
                        checked={compare.includes(p.id)}
                        onChange={() => toggleCompare(p.id)}
                        aria-label={`${t('product.compare')} ${p.reference}`}
                      />
                      {t('product.compare')}
                    </label>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {compared.length >= 2 && (
        <section aria-label={t('product.compare')} className="mt-10 border border-or/40 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-editorial text-xl text-nuit">{t('product.compare')}</h2>
            <Button variant="ghost" onClick={() => setCompare([])}>{t('common.close')}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-130 text-sm">
              <tbody className="divide-y divide-sable/60">
                <tr>
                  <th className="w-36 py-2 pr-4 text-left text-xs uppercase text-brun/60"></th>
                  {compared.map((p) => (
                    <td key={p.id} className="px-2 py-2">
                      <ProductImage media={p.media[0]} reference={p.reference} className="max-w-32" />
                    </td>
                  ))}
                </tr>
                {([
                  ['product.reference', (p: Product) => p.reference],
                  ['product.category', (p: Product) => t(`category.${p.category}`)],
                  ['product.availability', (p: Product) => t(`availability.${p.availability}`)],
                  ['product.moq', (p: Product) => p.minOrderQty?.toString() ?? t('common.tbc')],
                  ['product.leadTime', (p: Product) => (p.leadTimeDays ? t('product.leadTimeDays', { n: p.leadTimeDays }) : t('common.tbc'))],
                ] as const).map(([key, fn]) => (
                  <tr key={key}>
                    <th className="py-2 pr-4 text-left text-xs uppercase text-brun/60">{t(key)}</th>
                    {compared.map((p) => <td key={p.id} className="px-2 py-2 text-brun">{fn(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
