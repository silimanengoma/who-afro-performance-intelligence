/* Mes documents : documents types du pack + documents liés au dossier
 * (devis émis, commandes) conservés dans l'espace partenaire. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { EmptyState, SectionTitle } from '../../components/ui'
import { docTemplates } from '../../content/documents'
import { DocumentView } from '../../components/DocumentView'
import type { DocTemplate } from '../../content/documents'
import { formatDate } from '../../utils/format'

export function Documents() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const { org } = useBuyer()
  const [openDoc, setOpenDoc] = useState<DocTemplate | null>(null)

  const quotes = db.quotes.filter((q) => q.organizationId === org?.id && q.status !== 'draft')
  const orders = db.orders.filter((o) => o.organizationId === org?.id)

  return (
    <div>
      <SectionTitle
        overline={t('buyer.documents')}
        title={lx({ fr: 'Les documents de votre dossier', en: 'Your file documents' })}
      />

      <h2 className="mb-3 font-editorial text-xl text-nuit">{lx({ fr: 'Documents générés', en: 'Generated documents' })}</h2>
      {quotes.length === 0 && orders.length === 0 ? (
        <EmptyState
          title={lx({ fr: 'Aucun document généré', en: 'No generated documents yet' })}
          body={lx({
            fr: 'Vos devis et documents de commande apparaîtront ici au fil du parcours.',
            en: 'Your quotes and order documents will appear here as your file progresses.',
          })}
        />
      ) : (
        <ul className="divide-y divide-sable/60 border border-sable bg-white text-sm">
          {quotes.map((q) => (
            <li key={q.id}>
              <Link to={`/espace-pro/devis/${q.id}`} className="flex justify-between gap-3 px-4 py-3 hover:bg-sable-100/50">
                <span>{lx({ fr: 'Devis', en: 'Quote' })} {q.number}</span>
                <span className="text-brun/60">{formatDate(q.createdAt, lang)}</span>
              </Link>
            </li>
          ))}
          {orders.map((o) => (
            <li key={o.id} className="flex justify-between gap-3 px-4 py-3">
              <span>{lx({ fr: 'Commande', en: 'Order' })} {o.number}</span>
              <span className="text-brun/60">{formatDate(o.createdAt, lang)}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 mt-10 font-editorial text-xl text-nuit">{lx({ fr: 'Modèles du Partnership Pack', en: 'Partnership Pack templates' })}</h2>
      <ul className="grid gap-2 md:grid-cols-2">
        {docTemplates.map((d) => (
          <li key={d.code}>
            <button
              onClick={() => setOpenDoc(d)}
              className="w-full border border-sable bg-white px-4 py-3 text-left text-sm text-nuit transition-colors hover:border-or"
            >
              {lx(d.title)}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs italic text-erreur">{t('common.legalTemplate')}</p>

      {openDoc && <DocumentView template={openDoc} org={org ?? null} onClose={() => setOpenDoc(null)} />}
    </div>
  )
}
