import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { Badge, EmptyState, LinkButton } from '../../components/ui'
import { formatDate } from '../../utils/format'
import type { OrderStatus } from '../../data/types'

const tone: Record<OrderStatus, 'neutral' | 'success' | 'warning' | 'gold'> = {
  preparing: 'warning', confirmed: 'gold', shipped: 'gold', delivered: 'success', closed: 'neutral',
}

export function Orders() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const { org } = useBuyer()
  const orders = db.orders.filter((o) => o.organizationId === org?.id)

  return (
    <div>
      <h1 className="mb-8 font-editorial text-3xl text-nuit">{t('buyer.orders')}</h1>
      {orders.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucune commande pour le moment', en: 'No orders yet' })}
          body={lx({
            fr: 'Une commande est créée automatiquement lorsque vous acceptez un devis.',
            en: 'An order is created automatically when you accept a quote.',
          })}
          action={<LinkButton to="/espace-pro/devis">{t('buyer.quotes')}</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-sable/60 border border-sable bg-white">
          {orders.map((o) => {
            const quote = db.quotes.find((q) => q.id === o.quoteId)
            return (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-nuit">{o.number}</p>
                  <p className="text-xs text-brun/70">
                    {formatDate(o.createdAt, lang)} · {t('quote.number')} {quote?.number}
                  </p>
                  {o.trackingNote && <p className="mt-1 text-xs text-brun">{o.trackingNote}</p>}
                </div>
                <Badge tone={tone[o.status]}>{t(`order.status.${o.status}`)}</Badge>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
