/* Line Sheet — consultable, filtrable, imprimable (PDF), exportable (CSV),
 * marges calculées, synthèse commerciale administrable, filigrane boutique.
 * Desktop : tableau ; mobile : cartes (aucun défilement horizontal subi). */
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { marginRate, marginValue, useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { ProductImage } from '../../components/ProductImage'
import { Button, Select, Tbc } from '../../components/ui'
import { downloadCsv } from '../../utils/csv'
import { formatMoney, formatPercent } from '../../utils/format'
import type { Category, Gender } from '../../data/types'

export function LineSheet() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const { org, selection } = useBuyer()
  const [params, setParams] = useSearchParams()
  const [capsule, setCapsule] = useState('')
  const [category, setCategory] = useState<'' | Category>('')
  const [gender, setGender] = useState<'' | Gender>('')
  const onlySelection = params.get('selection') === '1'

  const rows = useMemo(() => {
    let list = db.products.filter((p) => p.status === 'active')
    if (onlySelection && selection) {
      const ids = new Set(selection.items.map((i) => i.productId))
      list = list.filter((p) => ids.has(p.id))
    }
    if (capsule) list = list.filter((p) => p.capsuleId === capsule)
    if (category) list = list.filter((p) => p.category === category)
    if (gender) list = list.filter((p) => p.gender === gender)
    return list.map((p) => {
      const price = db.prices.find((x) => x.productId === p.id)
      return { p, price, mVal: marginValue(price), mRate: marginRate(price) }
    })
  }, [db.products, db.prices, onlySelection, selection, capsule, category, gender])

  const s = db.settings
  const summary: [string, string][] = [
    [t('linesheet.currency'), s.currency],
    [t('linesheet.validity'), s.priceValidity],
    [t('linesheet.globalMin'), s.globalMinimum],
    [t('linesheet.payment'), lx(s.paymentTerms)],
    [t('linesheet.leadTimes'), s.productionLeadTime],
    [t('linesheet.production'), s.productionCapacity],
    [t('linesheet.shipping'), lx(s.deliveryTerms)],
    [t('linesheet.customs'), lx(s.customsNote)],
    [t('linesheet.returns'), lx(s.returnPolicy)],
    [t('linesheet.claims'), lx(s.claimsPolicy)],
    [t('linesheet.restock'), lx(s.restockPolicy)],
    [t('linesheet.exclusivity'), lx(s.exclusivityTerms)],
  ]

  const exportCsv = () => {
    downloadCsv(
      `soleil-creation-line-sheet-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t('product.reference'), lang === 'fr' ? 'Nom' : 'Name', t('product.category'), t('product.capsule'),
        t('product.colors'), t('product.sizes'), t('product.wholesalePrice'), t('product.rrp'),
        t('product.marginValue'), t('product.marginRate'), t('product.moq'),
        t('product.availability'), t('product.leadTime'),
      ],
      rows.map(({ p, price, mVal, mRate }) => [
        p.reference,
        lx(p.name),
        t(`category.${p.category}`),
        lx(db.capsules.find((c) => c.id === p.capsuleId)?.name ?? null, ''),
        p.variants.map((v) => (v.color ? lx(v.color) : t('common.tbc'))).join(', '),
        p.variants.map((v) => v.sizes?.join('/') ?? t('common.tbc')).join(', '),
        price?.wholesalePrice ?? t('common.tbc'),
        price?.rrp ?? t('common.tbc'),
        mVal ?? t('common.tbc'),
        mRate != null ? mRate.toFixed(1) + '%' : t('common.tbc'),
        p.minOrderQty ?? t('common.tbc'),
        t(`availability.${p.availability}`),
        p.leadTimeDays ? `${p.leadTimeDays} j` : t('common.tbc'),
      ]),
    )
  }

  return (
    <div>
      {/* Entête + filigrane */}
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-editorial text-3xl text-nuit">{t('linesheet.title')}</h1>
          <p className="mt-1 text-xs uppercase tracking-wider text-or-500">
            {t('linesheet.watermark', { name: org?.tradeName ?? '' })} · {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCsv}>{t('common.exportCsv')}</Button>
          <Button onClick={() => window.print()}>{t('common.print')}</Button>
        </div>
      </div>
      <p className="mb-6 border-l-2 border-alerte bg-alerte/5 px-3 py-2 text-xs text-alerte">{t('linesheet.confidential')}</p>

      {/* Filtres */}
      <div className="no-print mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label={t('product.capsule')} value={capsule} onChange={(e) => setCapsule(e.target.value)}>
          <option value="">{t('product.capsule')} — {t('common.all')}</option>
          {db.capsules.map((c) => <option key={c.id} value={c.id}>{lx(c.name)}</option>)}
        </Select>
        <Select aria-label={t('product.category')} value={category} onChange={(e) => setCategory(e.target.value as '' | Category)}>
          <option value="">{t('product.category')} — {t('common.all')}</option>
          {(['ensemble', 'robe', 'boubou', 'gilet', 'haut'] as Category[]).map((c) => <option key={c} value={c}>{t(`category.${c}`)}</option>)}
        </Select>
        <Select aria-label={t('product.gender')} value={gender} onChange={(e) => setGender(e.target.value as '' | Gender)}>
          <option value="">{t('product.gender')} — {t('common.all')}</option>
          {(['femme', 'homme', 'mixte'] as Gender[]).map((g) => <option key={g} value={g}>{t(`gender.${g}`)}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-brun">
          <input
            type="checkbox"
            checked={onlySelection}
            onChange={(e) => setParams(e.target.checked ? { selection: '1' } : {})}
          />
          {t('linesheet.fromSelection')} ({selection?.items.length ?? 0})
        </label>
      </div>

      {/* Tableau desktop */}
      <div className="hidden md:block">
        <div className="overflow-x-auto border border-sable">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sable bg-sable-100 text-left text-xs uppercase tracking-wider text-brun">
                <th className="px-3 py-3"> </th>
                <th className="px-3 py-3">{t('product.reference')}</th>
                <th className="px-3 py-3">{lang === 'fr' ? 'Nom' : 'Name'}</th>
                <th className="px-3 py-3">{t('product.capsule')}</th>
                <th className="px-3 py-3">{t('product.colors')} / {t('product.sizes')}</th>
                <th className="px-3 py-3 text-right">{t('product.wholesalePrice')}</th>
                <th className="px-3 py-3 text-right">{t('product.rrp')}</th>
                <th className="px-3 py-3 text-right">{t('product.marginValue')}</th>
                <th className="px-3 py-3 text-right">{t('product.marginRate')}</th>
                <th className="px-3 py-3 text-right">{t('product.moq')}</th>
                <th className="px-3 py-3">{t('product.availability')}</th>
                <th className="px-3 py-3">{t('product.leadTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sable/60 bg-white">
              {rows.map(({ p, price, mVal, mRate }) => (
                <tr key={p.id}>
                  <td className="w-14 px-3 py-2"><ProductImage media={p.media[0]} reference={p.reference} className="w-10" /></td>
                  <td className="px-3 py-2 font-medium text-nuit">{p.reference}</td>
                  <td className="px-3 py-2">{lx(p.name)}</td>
                  <td className="px-3 py-2">{lx(db.capsules.find((c) => c.id === p.capsuleId)?.name ?? null, '')}</td>
                  <td className="px-3 py-2 text-brun/80">
                    {p.variants.map((v) => `${v.color ? lx(v.color) : t('common.tbc')} — ${v.sizes?.join('/') ?? t('common.tbc')}`).join(' · ')}
                  </td>
                  <td className="px-3 py-2 text-right"><Tbc value={formatMoney(price?.wholesalePrice ?? null, price?.currency ?? 'XAF', lang)} /></td>
                  <td className="px-3 py-2 text-right"><Tbc value={formatMoney(price?.rrp ?? null, price?.currency ?? 'XAF', lang)} /></td>
                  <td className="px-3 py-2 text-right"><Tbc value={formatMoney(mVal, price?.currency ?? 'XAF', lang)} /></td>
                  <td className="px-3 py-2 text-right"><Tbc value={formatPercent(mRate, lang)} /></td>
                  <td className="px-3 py-2 text-right"><Tbc value={p.minOrderQty} /></td>
                  <td className="px-3 py-2">{t(`availability.${p.availability}`)}</td>
                  <td className="px-3 py-2">{p.leadTimeDays ? t('product.leadTimeDays', { n: p.leadTimeDays }) : <Tbc />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cartes mobile */}
      <div className="space-y-3 md:hidden">
        {rows.map(({ p, price, mVal, mRate }) => (
          <article key={p.id} className="flex gap-3 border border-sable bg-white p-3">
            <ProductImage media={p.media[0]} reference={p.reference} className="w-20 shrink-0" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-nuit">{p.reference} — {lx(p.name)}</p>
              <p className="text-xs text-brun/70">{lx(db.capsules.find((c) => c.id === p.capsuleId)?.name ?? null, '')}</p>
              <dl className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-brun">
                <dt>{t('product.wholesalePrice')}</dt>
                <dd className="text-right"><Tbc value={formatMoney(price?.wholesalePrice ?? null, price?.currency ?? 'XAF', lang)} /></dd>
                <dt>{t('product.rrp')}</dt>
                <dd className="text-right"><Tbc value={formatMoney(price?.rrp ?? null, price?.currency ?? 'XAF', lang)} /></dd>
                <dt>{t('product.marginRate')}</dt>
                <dd className="text-right"><Tbc value={formatPercent(mRate ?? null, lang)} /></dd>
                <dt>{t('product.marginValue')}</dt>
                <dd className="text-right"><Tbc value={formatMoney(mVal, price?.currency ?? 'XAF', lang)} /></dd>
                <dt>{t('product.moq')}</dt>
                <dd className="text-right"><Tbc value={p.minOrderQty} /></dd>
                <dt>{t('product.availability')}</dt>
                <dd className="text-right">{t(`availability.${p.availability}`)}</dd>
              </dl>
            </div>
          </article>
        ))}
      </div>

      {/* Synthèse commerciale */}
      <section className="mt-10 border border-sable bg-white p-5">
        <h2 className="font-editorial text-2xl text-nuit">{t('linesheet.summary')}</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {summary.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-sable/50 py-1.5">
              <dt className="text-brun/70">{k}</dt>
              <dd className="text-right text-nuit"><Tbc value={v} /></dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs italic text-brun/70">
          {lx({
            fr: 'Conditions administrables par la maison — les valeurs « à confirmer » sont renseignées dans Administration → Conditions commerciales.',
            en: 'Terms are managed by the house — “to be confirmed” values are set in Administration → Commercial terms.',
          })}
        </p>
      </section>
    </div>
  )
}
