/* Vues administrateur compactes : capsules, médias, sélections, commandes,
 * documents, contenus, utilisateurs, audit, notifications. */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Button, EmptyState, FieldWrap, SectionTitle, Select, TextArea, TextInput } from '../../components/ui'
import { docTemplates } from '../../content/documents'
import { DocumentView } from '../../components/DocumentView'
import type { DocTemplate } from '../../content/documents'
import { formatDateTime } from '../../utils/format'
import type { Capsule, OrderStatus } from '../../data/types'
import { ORDER_STATUS_FLOW } from '../../data/store'

/* ---- Capsules (contenus éditoriaux bilingues) ---- */
export function CapsulesAdmin() {
  const { t, lx } = useI18n()
  const { db, update, audit } = useStore()
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<Record<string, Partial<Capsule>>>({})
  const [saved, setSaved] = useState(false)

  const save = () => {
    update((d) => ({
      ...d,
      capsules: d.capsules.map((c) => {
        const dr = drafts[c.id]
        if (!dr) return c
        return { ...c, ...dr, name: { ...c.name, ...dr.name }, manifesto: { ...c.manifesto, ...dr.manifesto } }
      }),
    }))
    audit(user?.email ?? '', 'capsules_updated', 'capsules', 'bulk')
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-3xl">
      <SectionTitle overline={t('admin.capsules')} title={lx({ fr: 'Capsules éditoriales', en: 'Editorial capsules' })} />
      <div className="space-y-8">
        {db.capsules.map((c) => {
          const dr = drafts[c.id] ?? {}
          const v = { ...c, ...dr, name: { ...c.name, ...dr.name }, manifesto: { ...c.manifesto, ...dr.manifesto } }
          const setField = (patch: Partial<Capsule>) => setDrafts((s) => ({ ...s, [c.id]: { ...s[c.id], ...patch } }))
          return (
            <article key={c.id} className="border border-sable bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-brun/60">{c.slug}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FieldWrap htmlFor={`${c.id}-nfr`} label="Nom (FR)">
                  <TextInput id={`${c.id}-nfr`} value={v.name.fr} onChange={(e) => setField({ name: { ...v.name, fr: e.target.value } })} />
                </FieldWrap>
                <FieldWrap htmlFor={`${c.id}-nen`} label="Name (EN)">
                  <TextInput id={`${c.id}-nen`} value={v.name.en} onChange={(e) => setField({ name: { ...v.name, en: e.target.value } })} />
                </FieldWrap>
                <FieldWrap htmlFor={`${c.id}-mfr`} label="Manifeste (FR)">
                  <TextArea id={`${c.id}-mfr`} rows={3} value={v.manifesto.fr} onChange={(e) => setField({ manifesto: { ...v.manifesto, fr: e.target.value } })} />
                </FieldWrap>
                <FieldWrap htmlFor={`${c.id}-men`} label="Manifesto (EN)">
                  <TextArea id={`${c.id}-men`} rows={3} value={v.manifesto.en} onChange={(e) => setField({ manifesto: { ...v.manifesto, en: e.target.value } })} />
                </FieldWrap>
              </div>
            </article>
          )
        })}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>{t('common.save')}</Button>
        {saved && <span className="text-sm text-succes">✓</span>}
      </div>
    </div>
  )
}

/* ---- Médias (statut des emplacements d'assets) ---- */
export function MediaAdmin() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const all = db.products.flatMap((p) => p.media.map((m) => ({ p, m })))
  const placeholders = all.filter((x) => x.m.isPlaceholder).length

  return (
    <div>
      <SectionTitle
        overline={t('admin.media')}
        title={lx({ fr: 'Emplacements de médias', en: 'Media slots' })}
        lead={lx({
          fr: `${placeholders} emplacement(s) sur ${all.length} attendent leur visuel. Procédure d'import : soleil-portal/scripts/import-assets.md (correspondance exacte dans scripts/asset-manifest.json).`,
          en: `${placeholders} slot(s) out of ${all.length} await their visual. Import procedure: soleil-portal/scripts/import-assets.md (exact mapping in scripts/asset-manifest.json).`,
        })}
      />
      <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
        {all.map(({ p, m }) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div>
              <p className="text-nuit">{p.reference} · {m.kind} — <code className="text-xs">{m.assetPath}</code></p>
              <p className="text-xs text-brun/60">{m.sourceNote}</p>
            </div>
            <Badge tone={m.isPlaceholder ? 'warning' : 'success'}>
              {m.isPlaceholder ? lx({ fr: 'À importer', en: 'To import' }) : lx({ fr: 'En place', en: 'In place' })}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---- Sélections des boutiques ---- */
export function SelectionsAdmin() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()

  return (
    <div>
      <SectionTitle overline={t('admin.selections')} title={lx({ fr: 'Sélections des boutiques', en: 'Retailer selections' })} />
      {db.selections.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucune sélection', en: 'No selections' })}
          body={lx({ fr: 'Les sélections constituées dans le showroom apparaissent ici.', en: 'Selections built in the showroom appear here.' })}
        />
      ) : (
        <div className="space-y-4">
          {db.selections.map((s) => {
            const org = db.organizations.find((o) => o.id === s.organizationId)
            return (
              <article key={s.id} className="border border-sable bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-nuit">{org?.tradeName ?? '—'}</p>
                  <div className="flex items-center gap-2">
                    <Badge tone={s.status === 'quoted' ? 'gold' : 'neutral'}>
                      {s.status === 'quoted' ? lx({ fr: 'Devis demandé', en: 'Quote requested' }) : lx({ fr: 'En cours', en: 'Open' })}
                    </Badge>
                    <span className="text-xs text-brun/60">{formatDateTime(s.updatedAt, lang)}</span>
                  </div>
                </div>
                <ul className="mt-2 text-sm text-brun">
                  {s.items.map((i) => {
                    const p = db.products.find((x) => x.id === i.productId)
                    return (
                      <li key={i.id}>
                        {p?.reference} × {i.indicativeQty}
                        {(i.sizeNotes || i.colorNotes) && <span className="text-brun/60"> — {[i.colorNotes, i.sizeNotes].filter(Boolean).join(' / ')}</span>}
                      </li>
                    )
                  })}
                </ul>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---- Commandes ---- */
export function OrdersAdmin() {
  const { t, lx, lang } = useI18n()
  const { db, update, notify, setPipeline, audit } = useStore()
  const { user } = useAuth()

  const advance = (orderId: string, status: OrderStatus) => {
    const order = db.orders.find((o) => o.id === orderId)
    if (!order) return
    update((d) => ({
      ...d,
      orders: d.orders.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o)),
    }))
    if (status === 'shipped') {
      notify({
        audience: 'buyer', organizationId: order.organizationId, templateCode: 'order_shipped',
        title: { fr: `Commande ${order.number} expédiée`, en: `Order ${order.number} shipped` },
        body: { fr: 'Le suivi est disponible dans votre espace.', en: 'Tracking is available in your space.' },
      })
      setPipeline(order.organizationId, 'commande_expediee')
    }
    if (status === 'delivered') setPipeline(order.organizationId, 'partenaire_actif')
    audit(user?.email ?? '', `order_${status}`, 'orders', orderId)
  }

  return (
    <div>
      <SectionTitle overline={t('admin.orders')} title={lx({ fr: 'Commandes', en: 'Orders' })} />
      {db.orders.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucune commande', en: 'No orders' })}
          body={lx({ fr: 'Une commande naît de l’acceptation d’un devis.', en: 'An order is born when a quote is accepted.' })}
        />
      ) : (
        <ul className="space-y-3">
          {db.orders.map((o) => {
            const org = db.organizations.find((x) => x.id === o.organizationId)
            return (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 border border-sable bg-white px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-nuit">{o.number} — {org?.tradeName}</p>
                  <p className="text-xs text-brun/60">{formatDateTime(o.createdAt, lang)}</p>
                </div>
                <Select
                  aria-label={`${t('common.status')} ${o.number}`}
                  value={o.status}
                  onChange={(e) => advance(o.id, e.target.value as OrderStatus)}
                  className="!w-48"
                >
                  {ORDER_STATUS_FLOW.map((s) => <option key={s} value={s}>{t(`order.status.${s}`)}</option>)}
                </Select>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ---- Documents & contrats ---- */
export function DocumentsAdmin() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const [openDoc, setOpenDoc] = useState<DocTemplate | null>(null)
  const [orgId, setOrgId] = useState('')

  const org = db.organizations.find((o) => o.id === orgId) ?? null

  return (
    <div>
      <SectionTitle
        overline={`${t('admin.documents')} · ${t('admin.contracts')}`}
        title={lx({ fr: 'Bibliothèque du Partnership Pack', en: 'Partnership Pack library' })}
        lead={lx({
          fr: 'Générez chaque document en le fusionnant avec le dossier d’une boutique. Tous portent l’avertissement de validation juridique.',
          en: 'Generate each document merged with a retailer’s file. All carry the legal review disclaimer.',
        })}
      />
      <FieldWrap htmlFor="org" label={lx({ fr: 'Boutique (fusion)', en: 'Retailer (merge)' })}>
        <Select id="org" value={orgId} onChange={(e) => setOrgId(e.target.value)} className="max-w-72">
          <option value="">{lx({ fr: '— Document vierge —', en: '— Blank document —' })}</option>
          {db.organizations.map((o) => <option key={o.id} value={o.id}>{o.tradeName || o.legalName}</option>)}
        </Select>
      </FieldWrap>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {docTemplates.map((d) => (
          <li key={d.code}>
            <button
              onClick={() => setOpenDoc(d)}
              className="w-full border border-sable bg-white px-4 py-3 text-left text-sm text-nuit transition-colors hover:border-or"
            >
              {lx(d.title)}
              <span className="mt-0.5 block text-xs text-brun/60">{lx(d.intro)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs italic text-erreur">{t('common.legalTemplate')}</p>
      {openDoc && <DocumentView template={openDoc} org={org} onClose={() => setOpenDoc(null)} />}
    </div>
  )
}

/* ---- Contenus (textes institutionnels FR/EN) ---- */
export function ContentsAdmin() {
  const { t, lx } = useI18n()
  return (
    <div className="max-w-3xl">
      <SectionTitle
        overline={t('admin.contents')}
        title={lx({ fr: 'Contenus éditoriaux', en: 'Editorial content' })}
        lead={lx({
          fr: 'Les textes des capsules s’éditent dans « Capsules » ; les fiches produits dans « Produits » ; les conditions dans « Conditions commerciales » ; les coordonnées dans « Paramètres ». Le manifeste et les pages institutionnelles sont versionnés dans le code (src/content/) et passeront en base à l’activation de Supabase.',
          en: 'Capsule texts are edited in “Capsules”; product sheets in “Products”; terms in “Commercial terms”; contact details in “Settings”. The manifesto and institutional pages are versioned in code (src/content/) and move to the database once Supabase is enabled.',
        })}
      />
    </div>
  )
}

/* ---- Utilisateurs ---- */
export function UsersAdmin() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  return (
    <div>
      <SectionTitle overline={t('admin.users')} title={lx({ fr: 'Comptes du portail', en: 'Portal accounts' })} />
      <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
        {db.users.map((u) => {
          const org = db.organizations.find((o) => o.id === u.organizationId)
          return (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div>
                <p className="font-medium text-nuit">{u.fullName}</p>
                <p className="text-xs text-brun/60">{u.email}{org ? ` · ${org.tradeName}` : ''}</p>
              </div>
              <Badge tone={u.role === 'buyer' ? 'neutral' : 'gold'}>{u.role}</Badge>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs italic text-brun/70">
        {lx({
          fr: 'Les comptes acheteurs sont créés à l’approbation d’une demande d’accès. En production : invitations Supabase Auth.',
          en: 'Buyer accounts are created upon access approval. In production: Supabase Auth invitations.',
        })}
      </p>
    </div>
  )
}

/* ---- Journal d'audit ---- */
export function AuditAdmin() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  return (
    <div>
      <SectionTitle overline={t('admin.audit')} title={lx({ fr: 'Journal des actions', en: 'Action log' })} />
      {db.auditLogs.length === 0 ? (
        <EmptyState title={t('common.none')} body={lx({ fr: 'Chaque modification administrateur est consignée ici.', en: 'Every admin change is recorded here.' })} />
      ) : (
        <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
          {db.auditLogs.map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
              <span className="text-nuit">{a.action} <span className="text-brun/60">({a.entity})</span></span>
              <span className="text-xs text-brun/60">{a.actorEmail} · {formatDateTime(a.at, lang)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---- Notifications (simulées) ---- */
export function NotificationsAdmin() {
  const { t, lx, lang } = useI18n()
  const { db, update } = useStore()
  const list = db.notifications.filter((n) => n.audience === 'admin')

  const markAll = () =>
    update((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
        n.audience === 'admin' && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    }))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle overline="Notifications" title={lx({ fr: 'Centre de notifications', en: 'Notification centre' })} />
        <Button variant="secondary" onClick={markAll}>{lx({ fr: 'Tout marquer lu', en: 'Mark all read' })}</Button>
      </div>
      <p className="mb-4 text-xs italic text-brun/70">{t('notif.simulated')}</p>
      {list.length === 0 ? (
        <EmptyState title={t('common.none')} />
      ) : (
        <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
          {list.map((n) => (
            <li key={n.id} className={`px-4 py-2.5 ${n.readAt ? 'opacity-60' : ''}`}>
              <p className="font-medium text-nuit">{lx(n.title)}</p>
              <p className="text-brun">{lx(n.body)}</p>
              <p className="mt-0.5 text-xs text-brun/60">{formatDateTime(n.createdAt, lang)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
