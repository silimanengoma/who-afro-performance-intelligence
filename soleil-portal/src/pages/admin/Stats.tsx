/* Statistiques commerciales : indicateurs calculés sur les données réelles du
 * store ; les répartitions illustratives sont marquées « données de
 * démonstration ». Filtres : période, pays, statut, capsule. */
import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { DemoBanner, SectionTitle, Select } from '../../components/ui'
import { PIPELINE_ORDER } from '../../data/types'
import type { PipelineStatus } from '../../data/types'
import { quoteTotal } from '../buyer/Quotes'
import { formatMoney } from '../../utils/format'

export function StatsAdmin() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const [days, setDays] = useState(90)
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState<'' | PipelineStatus>('')
  const [capsule, setCapsule] = useState('')

  const since = useMemo(() => Date.now() - days * 24 * 3600 * 1000, [days])
  const countries = [...new Set(db.organizations.map((o) => o.country).filter(Boolean))]

  const orgs = db.organizations.filter(
    (o) => (!country || o.country === country) && (!status || o.pipelineStatus === status),
  )
  const orgIds = new Set(orgs.map((o) => o.id))
  const activities = db.activities.filter((a) => new Date(a.at).getTime() >= since && (!a.organizationId || orgIds.has(a.organizationId)))
  const quotes = db.quotes.filter((q) => orgIds.has(q.organizationId) && new Date(q.createdAt).getTime() >= since)
  const orders = db.orders.filter((o) => orgIds.has(o.organizationId))

  const quoteValue = quotes.reduce((s, q) => s + (quoteTotal(q) ?? 0), 0)
  const accepted = quotes.filter((q) => q.status === 'accepted').length
  const conversion = quotes.length > 0 ? Math.round((accepted / quotes.length) * 100) : null

  const productViews = new Map<string, number>()
  const productSelections = new Map<string, number>()
  for (const a of activities) {
    if (a.type === 'product_viewed' && a.refId) productViews.set(a.refId, (productViews.get(a.refId) ?? 0) + 1)
  }
  for (const s of db.selections) {
    if (!orgIds.has(s.organizationId)) continue
    for (const i of s.items) productSelections.set(i.productId, (productSelections.get(i.productId) ?? 0) + 1)
  }
  const topSelected = [...productSelections.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const abandoned = db.selections.filter((s) => s.status === 'open' && Date.now() - new Date(s.updatedAt).getTime() > 14 * 24 * 3600 * 1000).length
  const lookbookViews = activities.filter((a) => a.type === 'lookbook_viewed').length

  const capsuleFiltered = capsule ? db.products.filter((p) => p.capsuleId === capsule) : db.products
  const capsuleSelectedCount = topSelected.filter(([pid]) => capsuleFiltered.some((p) => p.id === pid))

  const kpis = [
    { label: lx({ fr: "Demandes d'accès", en: 'Access requests' }), value: db.accessRequests.length },
    { label: lx({ fr: 'Lookbooks consultés', en: 'Lookbook views' }), value: lookbookViews },
    { label: lx({ fr: 'Sélections abandonnées (>14 j)', en: 'Abandoned selections (>14 d)' }), value: abandoned },
    { label: lx({ fr: 'Demandes de devis', en: 'Quote requests' }), value: quotes.length },
    { label: lx({ fr: 'Valeur des devis chiffrés', en: 'Priced quote value' }), value: formatMoney(quoteValue, db.settings.currency, lang) ?? '—' },
    { label: lx({ fr: 'Taux de conversion devis', en: 'Quote conversion rate' }), value: conversion != null ? `${conversion} %` : t('common.tbc') },
    { label: lx({ fr: 'Commandes', en: 'Orders' }), value: orders.length },
    { label: lx({ fr: 'Partenaires actifs', en: 'Active partners' }), value: orgs.filter((o) => o.pipelineStatus === 'partenaire_actif').length },
  ]

  return (
    <div>
      <SectionTitle overline={t('admin.stats')} title={lx({ fr: 'Statistiques commerciales', en: 'Commercial analytics' })} />
      <DemoBanner />

      <div className="mb-6 mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label={lx({ fr: 'Période', en: 'Period' })} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>{lx({ fr: '7 derniers jours', en: 'Last 7 days' })}</option>
          <option value={30}>{lx({ fr: '30 derniers jours', en: 'Last 30 days' })}</option>
          <option value={90}>{lx({ fr: '90 derniers jours', en: 'Last 90 days' })}</option>
          <option value={365}>{lx({ fr: '12 derniers mois', en: 'Last 12 months' })}</option>
        </Select>
        <Select aria-label={t('form.country')} value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">{t('form.country')} — {t('common.all')}</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select aria-label={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value as '' | PipelineStatus)}>
          <option value="">{t('common.status')} — {t('common.all')}</option>
          {PIPELINE_ORDER.map((s) => <option key={s} value={s}>{t(`pipeline.${s}`)}</option>)}
        </Select>
        <Select aria-label={t('product.capsule')} value={capsule} onChange={(e) => setCapsule(e.target.value)}>
          <option value="">{t('product.capsule')} — {t('common.all')}</option>
          {db.capsules.map((c) => <option key={c.id} value={c.id}>{lx(c.name)}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-sable bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-brun/60">{k.label}</p>
            <p className="mt-2 font-editorial text-2xl text-nuit">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-editorial text-xl text-nuit">{lx({ fr: 'Pièces les plus sélectionnées', en: 'Most selected pieces' })}</h2>
          {capsuleSelectedCount.length === 0 ? (
            <p className="text-sm text-brun/70">{t('common.none')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {capsuleSelectedCount.map(([pid, n]) => {
                const p = db.products.find((x) => x.id === pid)
                const max = capsuleSelectedCount[0][1]
                return (
                  <li key={pid}>
                    <div className="flex justify-between text-brun">
                      <span>{p?.reference} — {p ? lx(p.name) : ''}</span>
                      <span>{n}</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-sable-100">
                      <div className="h-full bg-or" style={{ width: `${(n / max) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-editorial text-xl text-nuit">{lx({ fr: 'Pipeline par statut', en: 'Pipeline by status' })}</h2>
          <ul className="space-y-1.5 text-sm">
            {PIPELINE_ORDER.map((s) => {
              const n = orgs.filter((o) => o.pipelineStatus === s).length
              if (n === 0) return null
              return (
                <li key={s} className="flex justify-between text-brun">
                  <span>{t(`pipeline.${s}`)}</span>
                  <span className="font-medium text-nuit">{n}</span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-xs italic text-brun/70">
            {lx({
              fr: 'Ventes par pays et par capsule : disponibles dès les premières commandes réelles (les valeurs affichées reflètent uniquement les données du prototype).',
              en: 'Sales by country and capsule become available with the first real orders (figures shown reflect prototype data only).',
            })}
          </p>
        </section>
      </div>
    </div>
  )
}
