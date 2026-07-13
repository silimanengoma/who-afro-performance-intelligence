/* Mes devis : liste + détail avec accepter / demander modification / refuser.
 * L'acceptation déclenche la création de commande (étapes 17-18). */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { nextOrderNumber, uid, useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { Badge, Button, EmptyState, LinkButton, NextStep, Tbc, TextArea } from '../../components/ui'
import { partnershipModels } from '../../content/partnership'
import { formatDate, formatMoney } from '../../utils/format'
import { NotFound } from '../system/NotFound'
import type { Quote, QuoteStatus } from '../../data/types'

const statusTone: Record<QuoteStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'gold'> = {
  draft: 'neutral', sent: 'gold', accepted: 'success', change_requested: 'warning', rejected: 'danger', expired: 'neutral',
}

export function quoteTotal(q: Quote): number | null {
  if (q.items.some((i) => i.unitPrice == null)) return null
  return q.items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.qty, 0)
}

export function Quotes() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const { org } = useBuyer()
  const quotes = db.quotes.filter((q) => q.organizationId === org?.id)

  return (
    <div>
      <h1 className="mb-8 font-editorial text-3xl text-nuit">{t('buyer.quotes')}</h1>
      {quotes.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucun devis pour le moment', en: 'No quotes yet' })}
          body={lx({
            fr: 'Constituez une sélection dans le showroom puis demandez un devis.',
            en: 'Build a selection in the showroom, then request a quote.',
          })}
          action={<LinkButton to="/espace-pro/showroom">{t('selection.emptyCta')}</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-sable/60 border border-sable bg-white">
          {quotes.map((q) => {
            const total = quoteTotal(q)
            return (
              <li key={q.id}>
                <Link to={`/espace-pro/devis/${q.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-sable-100/50">
                  <div>
                    <p className="font-medium text-nuit">{q.number}</p>
                    <p className="text-xs text-brun/70">{formatDate(q.createdAt, lang)} · {q.items.length} {lx({ fr: 'pièces', en: 'pieces' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-brun">
                      {total != null ? formatMoney(total, q.currency, lang) : t('quote.awaitingPricing')}
                    </span>
                    <Badge tone={statusTone[q.status]}>{t(`quote.status.${q.status}`)}</Badge>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function QuoteDetail() {
  const { id } = useParams()
  const { t, lx, lang } = useI18n()
  const { db, update, logActivity, notify, setPipeline } = useStore()
  const { org } = useBuyer()
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)

  const quote = db.quotes.find((q) => q.id === id && q.organizationId === org?.id)
  if (!quote || !org) return <NotFound />

  const model = partnershipModels.find((m) => m.code === quote.partnershipModel)
  const total = quoteTotal(quote)
  const order = db.orders.find((o) => o.quoteId === quote.id)

  const act = (status: QuoteStatus, activity: 'quote_accepted' | 'quote_change_requested' | 'quote_rejected') => {
    update((d) => {
      let next = {
        ...d,
        quotes: d.quotes.map((q) =>
          q.id === quote.id ? { ...q, status, buyerComment: comment || q.buyerComment, updatedAt: new Date().toISOString() } : q,
        ),
      }
      if (status === 'accepted' && !d.orders.some((o) => o.quoteId === quote.id)) {
        next = {
          ...next,
          orders: [
            {
              id: uid('ord'), number: nextOrderNumber(d), quoteId: quote.id, organizationId: org.id,
              status: 'preparing' as const, trackingNote: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            },
            ...d.orders,
          ],
        }
      }
      return next
    })
    logActivity({ type: activity, organizationId: org.id, refId: quote.id, detail: quote.number })
    notify({
      audience: 'admin', organizationId: org.id, templateCode: activity,
      title: {
        fr: activity === 'quote_accepted' ? 'Devis accepté' : activity === 'quote_rejected' ? 'Devis refusé' : 'Modification de devis demandée',
        en: activity === 'quote_accepted' ? 'Quote accepted' : activity === 'quote_rejected' ? 'Quote declined' : 'Quote change requested',
      },
      body: { fr: `${org.tradeName} — ${quote.number}`, en: `${org.tradeName} — ${quote.number}` },
    })
    if (activity === 'quote_accepted') setPipeline(org.id, 'commande_preparation')
    if (activity === 'quote_change_requested') setPipeline(org.id, 'negociation')
  }

  return (
    <div className="max-w-3xl">
      <Link to="/espace-pro/devis" className="text-sm text-or-500 underline-offset-4 hover:underline">← {t('buyer.quotes')}</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-editorial text-3xl text-nuit">{t('quote.number')} {quote.number}</h1>
        <Badge tone={statusTone[quote.status]}>{t(`quote.status.${quote.status}`)}</Badge>
      </div>
      <p className="mt-1 text-sm text-brun/70">
        {model ? lx(model.name) : ''} · {formatDate(quote.createdAt, lang)}
        {quote.validUntil && <> · {t('quote.validUntil')} {formatDate(quote.validUntil, lang)}</>}
      </p>

      <div className="mt-6 overflow-x-auto border border-sable bg-white">
        <table className="w-full min-w-120 text-sm">
          <thead>
            <tr className="border-b border-sable bg-sable-100 text-left text-xs uppercase tracking-wider text-brun">
              <th className="px-3 py-2">{t('product.reference')}</th>
              <th className="px-3 py-2">{lang === 'fr' ? 'Variante' : 'Variant'}</th>
              <th className="px-3 py-2 text-right">{lang === 'fr' ? 'Qté' : 'Qty'}</th>
              <th className="px-3 py-2 text-right">{lang === 'fr' ? 'PU' : 'Unit price'}</th>
              <th className="px-3 py-2 text-right">Total</th>
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
                  <td className="px-3 py-2 text-right"><Tbc value={formatMoney(i.unitPrice, quote.currency, lang)} /></td>
                  <td className="px-3 py-2 text-right">
                    <Tbc value={i.unitPrice != null ? formatMoney(i.unitPrice * i.qty, quote.currency, lang) : null} />
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-sable bg-sable-100">
              <td colSpan={4} className="px-3 py-2 text-right text-xs uppercase tracking-wider text-brun">{t('quote.total')}</td>
              <td className="px-3 py-2 text-right font-medium text-nuit">
                {total != null ? formatMoney(total, quote.currency, lang) : t('quote.awaitingPricing')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(quote.shippingNote || quote.leadTimeNote) && (
        <dl className="mt-4 space-y-1 border border-sable bg-white p-4 text-sm">
          {quote.shippingNote && (<div><dt className="inline font-medium text-nuit">{t('linesheet.shipping')} : </dt><dd className="inline text-brun">{quote.shippingNote}</dd></div>)}
          {quote.leadTimeNote && (<div><dt className="inline font-medium text-nuit">{t('linesheet.leadTimes')} : </dt><dd className="inline text-brun">{quote.leadTimeNote}</dd></div>)}
        </dl>
      )}

      {quote.status === 'sent' && total == null && (
        <p className="mt-4 text-sm italic text-brun/80">{t('quote.awaitingPricing')}</p>
      )}

      {(quote.status === 'sent' || quote.status === 'change_requested') && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => act('accepted', 'quote_accepted')} disabled={total == null}>
              {t('quote.accept')}
            </Button>
            <Button variant="secondary" onClick={() => setShowComment((v) => !v)}>{t('quote.requestChange')}</Button>
            <Button variant="danger" onClick={() => act('rejected', 'quote_rejected')}>{t('quote.reject')}</Button>
          </div>
          {total == null && (
            <p className="text-xs italic text-brun/70">
              {lx({
                fr: 'L’acceptation sera possible une fois le devis chiffré par la maison.',
                en: 'Acceptance becomes possible once the house has priced the quote.',
              })}
            </p>
          )}
          {showComment && (
            <div className="space-y-2">
              <TextArea
                aria-label={t('quote.requestChange')}
                placeholder={t('quote.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button variant="secondary" onClick={() => act('change_requested', 'quote_change_requested')} disabled={!comment.trim()}>
                {t('common.send')}
              </Button>
            </div>
          )}
        </div>
      )}

      {quote.status === 'accepted' && order && (
        <div className="mt-6">
          <NextStep action={<LinkButton to="/espace-pro/commandes" variant="gold">{t('buyer.orders')}</LinkButton>}>
            {lx({
              fr: `Le devis est accepté : la commande ${order.number} est en préparation.`,
              en: `Quote accepted: order ${order.number} is in preparation.`,
            })}
          </NextStep>
        </div>
      )}
    </div>
  )
}
