import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { ProductImage } from '../../components/ProductImage'
import { LinkButton, SectionTitle } from '../../components/ui'
import { Reveal } from '../../components/Reveal'
import { NotFound } from '../system/NotFound'

export function Capsules() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const capsules = [...db.capsules].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="mx-auto max-w-310 px-4 py-16 md:px-8">
      <SectionTitle
        overline={t('nav.capsules')}
        title={lx({ fr: 'Les capsules de la collection', en: 'The collection capsules' })}
        lead={lx({
          fr: 'Quatre récits complémentaires, issus de la collection Foire 2024.',
          en: 'Four complementary narratives from the Foire 2024 collection.',
        })}
      />
      <div className="grid gap-8 md:grid-cols-2">
        {capsules.map((c) => {
          const preview = db.products.filter((p) => p.capsuleId === c.id && p.status === 'active').slice(0, 2)
          return (
            <Reveal key={c.id}>
              <Link to={`/capsules/${c.slug}`} className="group block border border-sable p-6 transition-colors hover:border-or">
                <div className="grid grid-cols-2 gap-3">
                  {preview.map((p) => (
                    <ProductImage key={p.id} media={p.media[0]} reference={p.reference} />
                  ))}
                </div>
                <h2 className="mt-4 font-editorial text-2xl text-nuit group-hover:text-or-500">{lx(c.name)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-brun">{lx(c.manifesto)}</p>
              </Link>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

export function CapsuleDetail() {
  const { slug } = useParams()
  const { t, lx } = useI18n()
  const { db } = useStore()
  const capsule = db.capsules.find((c) => c.slug === slug)
  if (!capsule) return <NotFound />
  const items = db.products.filter((p) => p.capsuleId === capsule.id && p.status === 'active')

  return (
    <div>
      <section className="bg-nuit text-ivoire">
        <div className="mx-auto max-w-310 px-4 py-16 md:px-8">
          <p className="surtitre">{t('nav.capsules')}</p>
          <h1 className="mt-3 font-editorial text-4xl md:text-5xl">{lx(capsule.name)}</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ivoire/75">{lx(capsule.manifesto)}</p>
        </div>
      </section>
      <div className="mx-auto max-w-310 px-4 py-12 md:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((p) => (
            <Reveal key={p.id}>
              <ProductImage media={p.media[0]} reference={p.reference} />
              <p className="mt-3 font-editorial text-lg text-nuit">{lx(p.name)}</p>
              <p className="text-xs uppercase tracking-wider text-brun/60">{p.reference}</p>
              <p className="mt-1 text-sm italic text-brun/80">{lx(p.editorialText)}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 border-t border-sable pt-8">
          <p className="text-sm text-brun">
            {lx({
              fr: 'Prix professionnels, variantes et conditions : réservés au showroom professionnel.',
              en: 'Trade prices, variants and terms: available in the professional showroom.',
            })}
          </p>
          <div className="mt-4 flex gap-3">
            <LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>
            <LinkButton to="/capsules" variant="ghost">{t('common.back')}</LinkButton>
          </div>
        </div>
      </div>
    </div>
  )
}
