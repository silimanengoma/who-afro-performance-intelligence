/* Demandes d'accès : approbation (création organisation + compte acheteur +
 * notifications simulées) ou refus motivé — étape 5 du parcours principal. */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { uid, useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Button, EmptyState, SectionTitle, TextInput } from '../../components/ui'
import { formatDateTime } from '../../utils/format'
import type { AccessRequest } from '../../data/types'

export function AccessRequests() {
  const { t, lx, lang } = useI18n()
  const { db, update, logActivity, notify, audit } = useStore()
  const { user } = useAuth()
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const pending = db.accessRequests.filter((r) => r.status === 'pending')
  const decided = db.accessRequests.filter((r) => r.status !== 'pending')

  const approve = (r: AccessRequest) => {
    const orgId = uid('org')
    const email = r.email.toLowerCase()
    update((d) => ({
      ...d,
      accessRequests: d.accessRequests.map((x) =>
        x.id === r.id ? { ...x, status: 'approved' as const, decidedAt: new Date().toISOString() } : x,
      ),
      organizations: [
        {
          id: orgId,
          legalName: r.legalName, tradeName: r.tradeName || r.legalName, shopType: r.shopType,
          contactName: r.contactName, address: '', city: r.city, country: r.country,
          email, whatsapp: r.whatsapp, website: r.website, instagram: r.instagram,
          targetClientele: r.targetClientele, priceRange: r.priceRange, brandsCarried: r.brandsCarried,
          deliveryCountries: '', preferredModel: r.preferredModel, potentialEstimate: null,
          internalNotes: '', pipelineStatus: 'acces_approuve' as const, isDemo: false,
          createdAt: new Date().toISOString(),
        },
        ...d.organizations,
      ],
      users: [
        {
          id: uid('user'), email, password: 'soleil2026',
          fullName: r.contactName, role: 'buyer' as const, organizationId: orgId, approved: true,
        },
        ...d.users,
      ],
    }))
    logActivity({ type: 'access_approved', organizationId: orgId, refId: r.id, detail: r.legalName })
    notify({
      audience: 'buyer', organizationId: orgId, templateCode: 'access_approved',
      title: { fr: 'Accès professionnel approuvé — bienvenue', en: 'Professional access approved — welcome' },
      body: {
        fr: `Bienvenue ${r.contactName}. Votre espace professionnel Soleil Création est ouvert.`,
        en: `Welcome ${r.contactName}. Your Soleil Création professional space is open.`,
      },
    })
    audit(user?.email ?? '', 'access_request_approved', 'access_requests', r.id)
    alert(
      lang === 'fr'
        ? `Compte créé (démo) : ${email} / soleil2026 — e-mail de bienvenue simulé.`
        : `Account created (demo): ${email} / soleil2026 — welcome email simulated.`,
    )
  }

  const reject = (r: AccessRequest) => {
    update((d) => ({
      ...d,
      accessRequests: d.accessRequests.map((x) =>
        x.id === r.id
          ? { ...x, status: 'rejected' as const, decidedAt: new Date().toISOString(), rejectionReason: reason }
          : x,
      ),
    }))
    logActivity({ type: 'access_rejected', organizationId: null, refId: r.id, detail: r.legalName })
    audit(user?.email ?? '', 'access_request_rejected', 'access_requests', r.id)
    setReasonFor(null)
    setReason('')
  }

  const Card = ({ r, actions }: { r: AccessRequest; actions: boolean }) => (
    <article className="border border-sable bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-editorial text-xl text-nuit">{r.tradeName || r.legalName}</h2>
          <p className="text-xs text-brun/70">
            {r.shopType} · {r.city}, {r.country} · {formatDateTime(r.createdAt, lang)}
          </p>
        </div>
        <Badge tone={r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}>
          {r.status === 'pending' ? lx({ fr: 'En attente', en: 'Pending' }) : r.status === 'approved' ? lx({ fr: 'Approuvée', en: 'Approved' }) : lx({ fr: 'Refusée', en: 'Rejected' })}
        </Badge>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-brun sm:grid-cols-2">
        <div><dt className="inline text-brun/60">{t('form.contactName')} : </dt><dd className="inline">{r.contactName}</dd></div>
        <div><dt className="inline text-brun/60">{t('auth.email')} : </dt><dd className="inline">{r.email}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.whatsapp')} : </dt><dd className="inline">{r.whatsapp || '—'}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.clientele')} : </dt><dd className="inline">{r.targetClientele || '—'}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.priceRange')} : </dt><dd className="inline">{r.priceRange || '—'}</dd></div>
        <div><dt className="inline text-brun/60">{t('form.brands')} : </dt><dd className="inline">{r.brandsCarried || '—'}</dd></div>
      </dl>
      {r.message && <p className="mt-2 border-l-2 border-sable pl-3 text-sm italic text-brun/80">{r.message}</p>}
      {r.rejectionReason && <p className="mt-2 text-sm text-erreur">{lx({ fr: 'Motif', en: 'Reason' })} : {r.rejectionReason}</p>}
      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => approve(r)}>{lx({ fr: 'Approuver', en: 'Approve' })}</Button>
          {reasonFor === r.id ? (
            <>
              <TextInput
                aria-label={lx({ fr: 'Motif du refus', en: 'Rejection reason' })}
                placeholder={lx({ fr: 'Motif du refus…', en: 'Rejection reason…' })}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="max-w-60"
              />
              <Button variant="danger" onClick={() => reject(r)} disabled={!reason.trim()}>
                {lx({ fr: 'Confirmer le refus', en: 'Confirm rejection' })}
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setReasonFor(r.id)}>{lx({ fr: 'Refuser', en: 'Reject' })}</Button>
          )}
        </div>
      )}
    </article>
  )

  return (
    <div>
      <SectionTitle overline={t('admin.accessRequests')} title={lx({ fr: 'Demandes en attente', en: 'Pending requests' })} />
      {pending.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucune demande en attente', en: 'No pending requests' })}
          body={lx({
            fr: 'Les candidatures envoyées depuis « Demander un accès » apparaissent ici.',
            en: 'Applications submitted from “Request access” appear here.',
          })}
        />
      ) : (
        <div className="space-y-4">{pending.map((r) => <Card key={r.id} r={r} actions />)}</div>
      )}
      {decided.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 font-editorial text-2xl text-nuit">{lx({ fr: 'Historique', en: 'History' })}</h2>
          <div className="space-y-4">{decided.map((r) => <Card key={r.id} r={r} actions={false} />)}</div>
        </>
      )}
    </div>
  )
}
