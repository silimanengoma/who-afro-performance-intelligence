import { useI18n } from '../../i18n'
import { LinkButton, SectionTitle } from '../../components/ui'
import { Reveal } from '../../components/Reveal'
import { partnershipModels } from '../../content/partnership'

export function DevenirPartenaire() {
  const { t, lx } = useI18n()

  return (
    <div className="mx-auto max-w-310 px-4 py-16 md:px-8">
      <SectionTitle
        overline={t('nav.partner')}
        title={lx({ fr: 'Quatre modèles de collaboration', en: 'Four collaboration models' })}
        lead={lx({
          fr: 'De la sélection pilote à la distribution régulière : choisissez le cadre qui correspond à votre boutique. Les conditions détaillées sont précisées au devis.',
          en: 'From pilot selection to regular distribution: choose the framework that fits your store. Detailed terms are set out in the quote.',
        })}
      />
      <div className="space-y-10">
        {partnershipModels.filter((m) => m.enabled).map((m) => (
          <Reveal key={m.code}>
            <article className="border border-sable bg-white p-6 md:p-8">
              <h2 className="font-editorial text-2xl text-nuit">{lx(m.name)}</h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-brun">{lx(m.summary)}</p>
              <div className="mt-6 grid gap-6 text-sm md:grid-cols-2">
                <div>
                  <h3 className="surtitre mb-2">{t('partnership.how')}</h3>
                  <ul className="list-inside list-disc space-y-1 text-brun">
                    {m.how.map((x, i) => <li key={i}>{lx(x)}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="surtitre mb-2">{t('partnership.profile')}</h3>
                  <p className="text-brun">{lx(m.profile)}</p>
                  <h3 className="surtitre mb-2 mt-4">{t('partnership.benefits')}</h3>
                  <ul className="list-inside list-disc space-y-1 text-brun">
                    {m.benefits.map((x, i) => <li key={i}>{lx(x)}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="surtitre mb-2">{t('partnership.scResp')}</h3>
                  <ul className="list-inside list-disc space-y-1 text-brun">
                    {m.scResponsibilities.map((x, i) => <li key={i}>{lx(x)}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="surtitre mb-2">{t('partnership.shopResp')}</h3>
                  <ul className="list-inside list-disc space-y-1 text-brun">
                    {m.shopResponsibilities.map((x, i) => <li key={i}>{lx(x)}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="surtitre mb-2">{t('partnership.steps')}</h3>
                  <ul className="space-y-1 text-brun">
                    {m.steps.map((x, i) => <li key={i}>{lx(x)}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="surtitre mb-2">{t('partnership.docs')}</h3>
                  <ul className="space-y-1 text-brun">
                    {m.documents.map((x, i) => <li key={i}>{lx(x)}</li>)}
                  </ul>
                  <h3 className="surtitre mb-2 mt-4">{t('partnership.conditions')}</h3>
                  <ul className="space-y-1 italic text-brun/80">
                    {m.conditionsTbc.map((x, i) => <li key={i}>{lx(x)}</li>)}
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <LinkButton to={`/acces-professionnel?modele=${m.code}`} variant="gold">
                  {t('partnership.choose')}
                </LinkButton>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
