/* Mini-CRM : pipeline 15 statuts, fiche partenaire complète, notes internes
 * (jamais visibles côté boutique), tâches, activités, lien lookbook personnalisé. */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { uid, useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Button, EmptyState, SectionTitle, Select, TextArea, TextInput } from '../../components/ui'
import { PIPELINE_ORDER } from '../../data/types'
import type { PipelineStatus } from '../../data/types'
import { formatDateTime } from '../../utils/format'
import { NotFound } from '../system/NotFound'

function pipelineTone(s: PipelineStatus): 'neutral' | 'success' | 'warning' | 'danger' | 'gold' {
  if (s === 'partenaire_actif' || s === 'accord_conclu') return 'success'
  if (s === 'opportunite_perdue') return 'danger'
  if (s.startsWith('devis') || s === 'negociation') return 'gold'
  return 'neutral'
}

export function Prospects() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const [status, setStatus] = useState<'' | PipelineStatus>('')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    let orgs = db.organizations
    if (status) orgs = orgs.filter((o) => o.pipelineStatus === status)
    const needle = q.trim().toLowerCase()
    if (needle) orgs = orgs.filter((o) => (o.tradeName + o.legalName + o.city + o.country).toLowerCase().includes(needle))
    return orgs
  }, [db.organizations, status, q])

  return (
    <div>
      <SectionTitle overline={t('admin.prospects')} title={lx({ fr: 'Prospects et partenaires', en: 'Prospects and partners' })} />
      <div className="mb-4 flex flex-wrap gap-3">
        <TextInput aria-label={t('common.search')} placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-64" />
        <Select aria-label={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value as '' | PipelineStatus)} className="max-w-64">
          <option value="">{t('common.status')} — {t('common.all')}</option>
          {PIPELINE_ORDER.map((s) => <option key={s} value={s}>{t(`pipeline.${s}`)}</option>)}
        </Select>
      </div>
      {list.length === 0 ? (
        <EmptyState title={t('common.none')} />
      ) : (
        <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
          {list.map((o) => (
            <li key={o.id}>
              <Link to={`/admin/prospects/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-sable-100/50">
                <div>
                  <p className="font-medium text-nuit">
                    {o.tradeName || o.legalName}
                    {o.isDemo && <span className="ml-2 text-xs text-alerte">({t('common.demoData')})</span>}
                  </p>
                  <p className="text-xs text-brun/70">{o.shopType} · {o.city}, {o.country}</p>
                </div>
                <Badge tone={pipelineTone(o.pipelineStatus)}>{t(`pipeline.${o.pipelineStatus}`)}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ProspectDetail() {
  const { id } = useParams()
  const { t, lx, lang } = useI18n()
  const { db, update, audit } = useStore()
  const { user } = useAuth()
  const org = db.organizations.find((o) => o.id === id)
  const [note, setNote] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [linkCreated, setLinkCreated] = useState<string | null>(null)

  if (!org) return <NotFound />

  const activities = db.activities.filter((a) => a.organizationId === org.id).slice(0, 20)
  const selections = db.selections.filter((s) => s.organizationId === org.id)
  const quotes = db.quotes.filter((q) => q.organizationId === org.id)
  const orders = db.orders.filter((o) => o.organizationId === org.id)
  const tasks = db.tasks.filter((x) => x.organizationId === org.id)

  const setStatus = (s: PipelineStatus) => {
    update((d) => ({
      ...d,
      organizations: d.organizations.map((o) => (o.id === org.id ? { ...o, pipelineStatus: s } : o)),
    }))
    audit(user?.email ?? '', 'pipeline_status_changed', 'organizations', org.id)
  }

  const saveNotes = () => {
    update((d) => ({
      ...d,
      organizations: d.organizations.map((o) => (o.id === org.id ? { ...o, internalNotes: note || o.internalNotes } : o)),
    }))
    audit(user?.email ?? '', 'internal_notes_updated', 'organizations', org.id)
    setNote('')
  }

  const addTask = () => {
    if (!taskTitle.trim()) return
    update((d) => ({
      ...d,
      tasks: [
        { id: uid('task'), title: taskTitle, dueDate: null, organizationId: org.id, done: false, createdAt: new Date().toISOString() },
        ...d.tasks,
      ],
    }))
    setTaskTitle('')
  }

  const toggleTask = (taskId: string) =>
    update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, done: !x.done } : x)) }))

  const createLookbookLink = () => {
    const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
    update((d) => ({
      ...d,
      sharedLinks: [
        {
          id: uid('lnk'), token, scope: 'lookbook' as const, organizationId: org.id,
          watermark: org.tradeName || org.legalName,
          expiresAt: null, revokedAt: null, views: 0, createdAt: new Date().toISOString(),
        },
        ...d.sharedLinks,
      ],
    }))
    const url = `${window.location.origin}/l/${token}`
    setLinkCreated(url)
    navigator.clipboard?.writeText(url).catch(() => {})
    audit(user?.email ?? '', 'shared_link_created', 'shared_links', token)
  }

  return (
    <div className="max-w-4xl">
      <Link to="/admin/prospects" className="text-sm text-or-500 underline-offset-4 hover:underline">← {t('admin.prospects')}</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-editorial text-3xl text-nuit">{org.tradeName || org.legalName}</h1>
        <Select
          aria-label={t('common.status')}
          value={org.pipelineStatus}
          onChange={(e) => setStatus(e.target.value as PipelineStatus)}
          className="max-w-64"
        >
          {PIPELINE_ORDER.map((s) => <option key={s} value={s}>{t(`pipeline.${s}`)}</option>)}
        </Select>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-1 border border-sable bg-white p-4 text-sm text-brun sm:grid-cols-2">
        <div><dt className="inline text-brun/60">{t('form.legalName')} : </dt><dd className="inline">{org.legalName}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.shopType')} : </dt><dd className="inline">{org.shopType || '—'}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.contactName')} : </dt><dd className="inline">{org.contactName}</dd></div>
        <div><dt className="inline text-brun/60">{t('auth.email')} : </dt><dd className="inline">{org.email}</dd></div>
        <div><dt className="inline text-brun/60">WhatsApp : </dt><dd className="inline">{org.whatsapp || '—'}</dd></div>
        <div><dt className="inline text-brun/60">Instagram : </dt><dd className="inline">{org.instagram || '—'}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.city')} : </dt><dd className="inline">{org.city}, {org.country}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.preferredModel')} : </dt><dd className="inline">{org.preferredModel ?? '—'}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.clientele')} : </dt><dd className="inline">{org.targetClientele || '—'}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.priceRange')} : </dt><dd className="inline">{org.priceRange || '—'}</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="gold" onClick={createLookbookLink}>
          {lx({ fr: 'Générer un lien lookbook personnalisé', en: 'Generate a personalised lookbook link' })}
        </Button>
        {linkCreated && <code className="bg-sable-100 px-2 py-1 text-xs">{linkCreated}</code>}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 font-editorial text-xl text-nuit">{lx({ fr: 'Notes internes', en: 'Internal notes' })}</h2>
          <p className="mb-2 text-xs italic text-brun/70">
            {lx({ fr: 'Jamais visibles par la boutique.', en: 'Never visible to the retailer.' })}
          </p>
          {org.internalNotes && <p className="mb-2 border-l-2 border-sable pl-3 text-sm text-brun">{org.internalNotes}</p>}
          <TextArea aria-label={lx({ fr: 'Nouvelle note', en: 'New note' })} value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <Button variant="secondary" className="mt-2" onClick={saveNotes} disabled={!note.trim()}>{t('common.save')}</Button>

          <h2 className="mb-2 mt-8 font-editorial text-xl text-nuit">{lx({ fr: 'Tâches de suivi', en: 'Follow-up tasks' })}</h2>
          <div className="flex gap-2">
            <TextInput
              aria-label={lx({ fr: 'Nouvelle tâche', en: 'New task' })}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={lx({ fr: 'Ex. : relancer après le devis…', en: 'E.g.: follow up after the quote…' })}
            />
            <Button variant="secondary" onClick={addTask}>{t('common.add')}</Button>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {tasks.map((x) => (
              <li key={x.id} className="flex items-center gap-2">
                <input type="checkbox" id={`task-${x.id}`} checked={x.done} onChange={() => toggleTask(x.id)} />
                <label htmlFor={`task-${x.id}`} className={x.done ? 'text-brun/50 line-through' : 'text-brun'}>{x.title}</label>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-editorial text-xl text-nuit">{lx({ fr: 'Dossier', en: 'File' })}</h2>
          <ul className="space-y-1 text-sm text-brun">
            <li>{lx({ fr: 'Sélections', en: 'Selections' })} : {selections.length} — <Link className="text-or-500 underline-offset-4 hover:underline" to="/admin/selections">{t('common.seeAll')}</Link></li>
            <li>{t('admin.quotes')} : {quotes.length} — <Link className="text-or-500 underline-offset-4 hover:underline" to="/admin/devis">{t('common.seeAll')}</Link></li>
            <li>{t('admin.orders')} : {orders.length}</li>
          </ul>

          <h2 className="mb-2 mt-8 font-editorial text-xl text-nuit">{lx({ fr: "Historique d'interactions", en: 'Interaction history' })}</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-brun/70">{t('common.none')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activities.map((a) => (
                <li key={a.id} className="border-l-2 border-sable pl-3">
                  <p className="text-nuit">{a.type} {a.detail && <span className="text-brun/70">— {a.detail}</span>}</p>
                  <p className="text-xs text-brun/60">{formatDateTime(a.at, lang)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
