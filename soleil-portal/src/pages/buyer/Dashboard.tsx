/* Tableau de bord acheteur : état du dossier + prochaine action attendue. */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { LinkButton, NextStep } from '../../components/ui'
import { quoteTotal } from './Quotes'
import { formatMoney } from '../../utils/format'

export function BuyerDashboard() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const { org, selection } = useBuyer()

  const quotes = db.quotes.filter((q) => q.organizationId === org?.id)
  const orders = db.orders.filter((o) => o.organizationId === org?.id)
  const pendingQuote = quotes.find((q) => q.status === 'sent')
  const selectionCount = selection?.items.length ?? 0

  // Prochaine action selon l'état du dossier (règle du brief : toujours guider)
  let next: { text: string; to: string; cta: string }
  if (pendingQuote && quoteTotal(pendingQuote) != null) {
    next = {
      text: lx({ fr: `Le devis ${pendingQuote.number} est prêt : consultez-le et répondez à la maison.`, en: `Quote ${pendingQuote.number} is ready: review it and reply to the house.` }),
      to: `/espace-pro/devis/${pendingQuote.id}`, cta: t('buyer.quotes'),
    }
  } else if (pendingQuote) {
    next = {
      text: lx({ fr: `Votre demande ${pendingQuote.number} est chez la maison. Vous serez informé dès le chiffrage.`, en: `Your request ${pendingQuote.number} is with the house. You will be notified once priced.` }),
      to: `/espace-pro/devis/${pendingQuote.id}`, cta: t('buyer.quotes'),
    }
  } else if (selectionCount > 0) {
    next = {
      text: lx({ fr: 'Votre sélection est prête : précisez quantités et variantes puis demandez un devis.', en: 'Your selection is ready: set quantities and variants, then request a quote.' }),
      to: '/espace-pro/selection', cta: t('buyer.selection'),
    }
  } else {
    next = {
      text: lx({ fr: 'Explorez le showroom et constituez votre première sélection.', en: 'Browse the showroom and build your first selection.' }),
      to: '/espace-pro/showroom', cta: t('buyer.showroom'),
    }
  }

  const cards = [
    { label: t('buyer.selection'), value: String(selectionCount), to: '/espace-pro/selection' },
    { label: t('buyer.quotes'), value: String(quotes.length), to: '/espace-pro/devis' },
    { label: t('buyer.orders'), value: String(orders.length), to: '/espace-pro/commandes' },
    {
      label: t('partnership.chosen'),
      value: org?.preferredModel ? org.preferredModel.replace('_', ' ') : t('common.tbc'),
      to: '/espace-pro/partenariat',
    },
  ]

  return (
    <div>
      <h1 className="font-editorial text-3xl text-nuit">
        {lx({ fr: 'Bienvenue', en: 'Welcome' })}, {org?.tradeName ?? ''}
      </h1>
      <p className="mt-1 text-sm text-brun">{t('brand.tagline')}</p>

      <div className="mt-6">
        <NextStep action={<LinkButton to={next.to} variant="gold">{next.cta}</LinkButton>}>{next.text}</NextStep>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="border border-sable bg-white p-5 transition-colors hover:border-or">
            <p className="text-xs uppercase tracking-wider text-brun/60">{c.label}</p>
            <p className="mt-2 font-editorial text-3xl text-nuit">{c.value}</p>
          </Link>
        ))}
      </div>

      {quotes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-editorial text-xl text-nuit">{t('buyer.quotes')}</h2>
          <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
            {quotes.slice(0, 5).map((q) => {
              const total = quoteTotal(q)
              return (
                <li key={q.id}>
                  <Link to={`/espace-pro/devis/${q.id}`} className="flex justify-between gap-3 px-4 py-2.5 hover:bg-sable-100/50">
                    <span>{q.number}</span>
                    <span className="text-brun/70">
                      {total != null ? formatMoney(total, q.currency, lang) : t(`quote.status.${q.status}`)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
