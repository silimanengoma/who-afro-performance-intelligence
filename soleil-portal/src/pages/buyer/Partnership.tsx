/* Partnership Pack côté acheteur : choisir un modèle (relié à la demande de
 * devis) et consulter les documents types. */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { useBuyer } from '../../data/useBuyer'
import { useStore } from '../../data/store'
import { Badge, Button, LinkButton, NextStep, SectionTitle } from '../../components/ui'
import { partnershipModels } from '../../content/partnership'
import { docTemplates } from '../../content/documents'
import { DocumentView } from '../../components/DocumentView'
import type { DocTemplate } from '../../content/documents'
import type { PartnershipModelCode } from '../../data/types'

export function Partnership() {
  const { t, lx } = useI18n()
  const { org } = useBuyer()
  const { update, audit } = useStore()
  const [openDoc, setOpenDoc] = useState<DocTemplate | null>(null)

  const choose = (code: PartnershipModelCode) => {
    if (!org) return
    update((d) => ({
      ...d,
      organizations: d.organizations.map((o) => (o.id === org.id ? { ...o, preferredModel: code } : o)),
    }))
    audit(org.email, 'partnership_model_chosen', 'organizations', org.id)
  }

  return (
    <div>
      <SectionTitle
        overline={t('buyer.partnership')}
        title={lx({ fr: 'Votre cadre de collaboration', en: 'Your collaboration framework' })}
        lead={lx({
          fr: 'Choisissez le modèle qui correspond à votre boutique : il pré-remplira vos demandes de devis. Les documents types du pack sont consultables ci-dessous.',
          en: 'Choose the model that fits your store: it will pre-fill your quote requests. The pack’s template documents are available below.',
        })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {partnershipModels.filter((m) => m.enabled).map((m) => {
          const chosen = org?.preferredModel === m.code
          return (
            <article key={m.code} className={`border p-6 ${chosen ? 'border-or bg-or/5' : 'border-sable bg-white'}`}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-editorial text-xl text-nuit">{lx(m.name)}</h2>
                {chosen && <Badge tone="gold">{t('partnership.chosen')}</Badge>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-brun">{lx(m.summary)}</p>
              <Button variant={chosen ? 'secondary' : 'primary'} className="mt-4" onClick={() => choose(m.code)} disabled={chosen}>
                {t('partnership.choose')}
              </Button>
            </article>
          )
        })}
      </div>

      {org?.preferredModel && (
        <div className="mt-6">
          <NextStep action={<LinkButton to="/espace-pro/devis/nouveau" variant="gold">{t('selection.toQuote')}</LinkButton>}>
            {lx({
              fr: 'Modèle retenu. Constituez votre sélection puis demandez un devis dans ce cadre.',
              en: 'Model selected. Build your selection, then request a quote under this framework.',
            })}
          </NextStep>
        </div>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-editorial text-2xl text-nuit">{t('buyer.documents')}</h2>
        <ul className="grid gap-2 md:grid-cols-2">
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
      </section>

      {openDoc && <DocumentView template={openDoc} org={org ?? null} onClose={() => setOpenDoc(null)} />}
    </div>
  )
}
