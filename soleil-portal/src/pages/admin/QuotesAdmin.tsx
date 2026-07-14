/* Devis côté maison : chiffrage (prix unitaires, transport, délais, validité),
 * envoi, suivi — étapes 14-16 du parcours principal. */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Button, EmptyState, FieldWrap, SectionTitle, TextInput } from '../../components/ui'
import { formatDate, formatMoney } from '../../utils/format'
import { NotFound } from '../system/NotFound'
import type { QuoteStatus } from '../../data/types'

const tone: Record<QuoteStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'gold'> = {
  draft: 'neutral', sent: 'gold', accepted: 'success', change_requested: 'warning', rejected: 'danger', expired: 'neutral',
}

export function QuotesAdmin() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()

  return (
    <div>
      <SectionTitle overline={t('admin.quotes')} title={lx({ fr: 'Devis et demandes', en: 'Quotes and requests' })} />
      {db.quotes.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucun devis', en: 'No quotes' })}
          body={lx({
            fr: 'Les demandes des acheteurs apparaissent ici, prêtes à être chiffrées.',
            en: 'Buyer requests appear here, ready for pricing.',
          })}
        />
      ) : (
        <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
          {db.quotes.map((q) => {
            const org = db.organizations.find((o) => o.id === q.organizationId)
            return (
              <li key={q.id}>
                <Link to={`/admin/devis/${q.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-sable-100/50">
                  <div>
                    <p className="font-medium text-nuit">{q.number} — {org?.tradeName}</p>
                    <p className="text-xs text-brun/70">{formatDate(q.createdAt, lang)} · {q.items.length} {lx({ fr: 'lignes', en: 'lines' })}</p>
                  </div>
                  <Badge tone={tone[q.status]}>{t(`quote.status.${q.status}`)}</Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function QuoteAdminDetail() {
  const { id } = useParams()
  const { t, lx, lang } = useI18n()
  const { db, update, notify, logActivity, setPipeline, audit } = useStore()
  const { user } = useAuth()
  const quote = db.quotes.find((q) => q.id === id)
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [shipping, setShipping] = useState(quote?.shippingNote ?? '')
  const [leadTime, setLeadTime] = useState(quote?.leadTimeNote ?? '')
  const [validUntil, setValidUntil] = useState(quote?.validUntil?.slice(0, 10) ?? '')

  if (!quote) return <NotFound />
  const org = db.organizations.find((o) => o.id === quote.organizationId)

  const save = (send: boolean) => {
    update((d) => ({
      ...d,
      quotes: d.quotes.map((q) => {
        if (q.id !== quote.id) return q
        return {
          ...q,
          items: q.items.map((i) => {
            const raw = prices[i.id]
            if (raw == null || raw === '') return i
            const v = Number(raw)
            return Number.isFinite(v) && v >= 0 ? { ...i, unitPrice: v } : i
          }),
          shippingNote: shipping,
          leadTimeNote: leadTime,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          status: send ? ('sent' as const) : q.status,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
    if (send && org) {
      notify({
        audience: 'buyer', organizationId: org.id, templateCode: 'quote_sent',
        title: { fr: `Votre devis ${quote.number} est disponible`, en: `Your quote ${quote.number} is available` },
        body: { fr: 'Consultez-le dans votre espace professionnel.', en: 'Review it in your professional space.' },
      })
      logActivity({ type: 'quote_sent', organizationId: org.id, refId: quote.id, detail: quote.number })
      setPipeline(org.id, 'devis_envoye')
    }
    audit(user?.email ?? '', send ? 'quote_sent' : 'quote_updated', 'quotes', quote.id)
  }

  return (
    <div className="max-w-3xl">
      <Link to="/admin/devis" className="text-sm text-or-500 underline-offset-4 hover:underline">← {t('admin.quotes')}</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-editorial text-3xl text-nuit">{quote.number} — {org?.tradeName}</h1>
        <Badge tone={tone[quote.status]}>{t(`quote.status.${quote.status}`)}</Badge>
      </div>
      {quote.buyerMessage && (
        <p className="mt-2 border-l-2 border-sable pl-3 text-sm italic text-brun/80">
          {lx({ fr: 'Message de la boutique', en: 'Retailer message' })} : {quote.buyerMessage}
        </p>
      )}
      {quote.buyerComment && (
        <p className="mt-2 border-l-2 border-alerte pl-3 text-sm text-alerte">
          {t('quote.status.change_requested')} : {quote.buyerComment}
        </p>
      )}

      <div className="mt-6 overflow-x-auto border border-sable bg-white">
        <table className="w-full min-w-120 text-sm">
          <thead>
            <tr className="border-b border-sable bg-sable-100 text-left text-xs uppercase tracking-wider text-brun">
              <th className="px-3 py-2">{t('product.reference')}</th>
              <th className="px-3 py-2">{lang === 'fr' ? 'Variante' : 'Variant'}</th>
              <th className="px-3 py-2 text-right">{lang === 'fr' ? 'Qté' : 'Qty'}</th>
              <th className="px-3 py-2 text-right">{lang === 'fr' ? 'Prix unitaire' : 'Unit price'} ({quote.currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sable/60">
            {quote.items.map((i) => {
              const p = db.products.find((x) => x.id === i.productId)
              return (
                <tr key={i.id}>
                  <td className="px-3 py-2">{p?.reference} — {p ? lx(p.name) : ''}</td>
                  <td className="px-3 py-2 text-brun/80">{i.variantLabel || '—'}</td>
                  <td className="px-3 py-2 text-right">{i.qty}</td>
                  <td className="px-3 py-2 text-right">
                    <TextInput
                      aria-label={`${lang === 'fr' ? 'Prix' : 'Price'} ${p?.reference}`}
                      type="number"
                      min={0}
                      className="!w-32 text-right"
                      value={prices[i.id] ?? (i.unitPrice != null ? String(i.unitPrice) : '')}
                      onChange={(e) => setPrices((s) => ({ ...s, [i.id]: e.target.value }))}
                      placeholder={t('common.tbc')}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <FieldWrap htmlFor="shipping" label={t('linesheet.shipping')}>
          <TextInput id="shipping" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder={t('common.tbc')} />
        </FieldWrap>
        <FieldWrap htmlFor="leadtime" label={t('linesheet.leadTimes')}>
          <TextInput id="leadtime" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder={t('common.tbc')} />
        </FieldWrap>
        <FieldWrap htmlFor="validUntil" label={t('quote.validUntil')}>
          <TextInput id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </FieldWrap>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => save(false)}>{t('common.save')}</Button>
        <Button onClick={() => save(true)}>{lx({ fr: 'Enregistrer et envoyer à la boutique', en: 'Save and send to retailer' })}</Button>
      </div>
      <p className="mt-3 text-xs italic text-brun/70">{t('notif.simulated')}</p>

      {quote.status === 'accepted' && (
        <p className="mt-4 text-sm text-succes">
          {lx({ fr: 'Devis accepté — la commande associée est visible dans Commandes.', en: 'Quote accepted — the related order is in Orders.' })}
          {' '}
          <Link to="/admin/commandes" className="underline">{t('admin.orders')}</Link>
        </p>
      )}

      <div className="mt-6 text-right text-sm text-brun">
        {t('quote.total')} :{' '}
        <span className="font-medium text-nuit">
          {quote.items.every((i) => (prices[i.id] ?? i.unitPrice) != null && (prices[i.id] ?? '') !== '' || i.unitPrice != null)
            ? formatMoney(
                quote.items.reduce((s, i) => s + (Number(prices[i.id] ?? i.unitPrice ?? 0)) * i.qty, 0),
                quote.currency, lang,
              )
            : t('common.tbc')}
        </span>
      </div>
    </div>
  )
}
