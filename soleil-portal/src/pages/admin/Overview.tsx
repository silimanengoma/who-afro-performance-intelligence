/* Vue d'ensemble : demandes à traiter, activité récente, tâches — piloté par
 * les données réelles du store. */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { LinkButton, NextStep, SectionTitle } from '../../components/ui'
import { formatDateTime } from '../../utils/format'

export function Overview() {
  const { t, lx, lang } = useI18n()
  const { db, update } = useStore()

  const pendingAccess = db.accessRequests.filter((r) => r.status === 'pending').length
  const pendingQuotes = db.quotes.filter((q) => q.status === 'sent' && q.items.some((i) => i.unitPrice == null)).length
  const changeRequested = db.quotes.filter((q) => q.status === 'change_requested').length
  const openTasks = db.tasks.filter((x) => !x.done)
  const activities = db.activities.slice(0, 10)

  let next: { text: string; to: string; cta: string } | null = null
  if (pendingAccess > 0) {
    next = {
      text: lx({ fr: `${pendingAccess} demande(s) d'accès attendent votre décision.`, en: `${pendingAccess} access request(s) await your decision.` }),
      to: '/admin/demandes-acces', cta: t('admin.accessRequests'),
    }
  } else if (changeRequested > 0) {
    next = {
      text: lx({ fr: `${changeRequested} devis avec modification demandée.`, en: `${changeRequested} quote(s) with a change requested.` }),
      to: '/admin/devis', cta: t('admin.quotes'),
    }
  } else if (pendingQuotes > 0) {
    next = {
      text: lx({ fr: `${pendingQuotes} demande(s) de devis à chiffrer.`, en: `${pendingQuotes} quote request(s) to price.` }),
      to: '/admin/devis', cta: t('admin.quotes'),
    }
  }

  const cards = [
    { label: t('admin.accessRequests'), value: pendingAccess, to: '/admin/demandes-acces' },
    { label: t('admin.prospects'), value: db.organizations.length, to: '/admin/prospects' },
    { label: t('admin.quotes'), value: db.quotes.length, to: '/admin/devis' },
    { label: t('admin.orders'), value: db.orders.length, to: '/admin/commandes' },
    { label: t('admin.selections'), value: db.selections.length, to: '/admin/selections' },
    {
      label: lx({ fr: 'Partenaires actifs', en: 'Active partners' }),
      value: db.organizations.filter((o) => o.pipelineStatus === 'partenaire_actif').length,
      to: '/admin/prospects',
    },
  ]

  return (
    <div>
      <SectionTitle overline={t('admin.overview')} title={lx({ fr: 'Pilotage commercial', en: 'Commercial cockpit' })} />

      {next && (
        <div className="mb-8">
          <NextStep action={<LinkButton to={next.to} variant="gold">{next.cta}</LinkButton>}>{next.text}</NextStep>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="border border-sable bg-white p-4 transition-colors hover:border-or">
            <p className="text-xs uppercase tracking-wider text-brun/60">{c.label}</p>
            <p className="mt-2 font-editorial text-3xl text-nuit">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-editorial text-xl text-nuit">{lx({ fr: 'Activité récente', en: 'Recent activity' })}</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-brun/70">{t('common.none')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activities.map((a) => {
                const org = db.organizations.find((o) => o.id === a.organizationId)
                return (
                  <li key={a.id} className="border-l-2 border-sable pl-3">
                    <p className="text-nuit">
                      {a.type}
                      {org && <span className="text-brun/70"> — {org.tradeName}</span>}
                      {a.detail && <span className="text-brun/70"> · {a.detail}</span>}
                    </p>
                    <p className="text-xs text-brun/60">{formatDateTime(a.at, lang)}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-editorial text-xl text-nuit">{lx({ fr: 'Tâches de suivi', en: 'Follow-up tasks' })}</h2>
          {openTasks.length === 0 ? (
            <p className="text-sm text-brun/70">{t('common.none')}</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {openTasks.map((x) => (
                <li key={x.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`ov-task-${x.id}`}
                    checked={x.done}
                    onChange={() =>
                      update((d) => ({ ...d, tasks: d.tasks.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)) }))
                    }
                  />
                  <label htmlFor={`ov-task-${x.id}`} className="text-brun">{x.title}</label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
