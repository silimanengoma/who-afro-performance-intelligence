import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { Reveal } from '../../components/Reveal'
import { ProductImage } from '../../components/ProductImage'
import { LinkButton, SectionTitle } from '../../components/ui'

export function Home() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const featured = db.products.filter((p) => p.isFeatured && p.status === 'active').slice(0, 4)
  const capsules = [...db.capsules].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div>
      {/* Couverture immersive */}
      <section className="bg-nuit text-ivoire">
        <div className="mx-auto flex max-w-310 flex-col items-start gap-8 px-4 py-24 md:px-8 md:py-36">
          <Reveal>
            <p className="surtitre">{t('brand.city')}</p>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-7xl">
              {t('brand.name')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivoire/80">{t('brand.tagline')}</p>
          </Reveal>
          <Reveal className="flex flex-wrap gap-3">
            <LinkButton to="/lookbook" variant="gold">{t('nav.lookbook')}</LinkButton>
            <LinkButton to="/acces-professionnel" variant="secondary" className="border-ivoire/40 text-ivoire hover:bg-ivoire/10">
              {t('nav.access')}
            </LinkButton>
          </Reveal>
        </div>
      </section>

      {/* Pièces vedettes */}
      <section className="mx-auto max-w-310 px-4 py-20 md:px-8">
        <SectionTitle overline={t('nav.signatures')} title={lx({ fr: 'Les pièces qui signent la maison', en: 'The pieces that sign the house' })} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featured.map((p) => (
            <Reveal key={p.id}>
              <Link to="/signatures" className="group block">
                <ProductImage media={p.media[0]} reference={p.reference} className="transition-opacity group-hover:opacity-90" />
                <p className="mt-3 font-editorial text-lg text-nuit">{lx(p.name)}</p>
                <p className="text-xs uppercase tracking-wider text-brun/60">{p.reference}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Capsules */}
      <section className="bg-sable-100">
        <div className="mx-auto max-w-310 px-4 py-20 md:px-8">
          <SectionTitle overline={t('nav.capsules')} title={lx({ fr: 'Quatre capsules, une identité', en: 'Four capsules, one identity' })} />
          <div className="grid gap-6 md:grid-cols-2">
            {capsules.map((c) => (
              <Reveal key={c.id}>
                <Link to={`/capsules/${c.slug}`} className="group block border border-sable bg-ivoire p-8 transition-colors hover:border-or">
                  <h3 className="font-editorial text-2xl text-nuit group-hover:text-or-500">{lx(c.name)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brun">{lx(c.manifesto)}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Appel professionnel */}
      <section className="mx-auto max-w-310 px-4 py-20 md:px-8">
        <div className="flex flex-col items-start gap-6 border border-or/40 bg-ivoire p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="max-w-xl">
            <p className="surtitre">{t('nav.partner')}</p>
            <h2 className="mt-2 text-3xl text-nuit">
              {lx({
                fr: 'Boutiques, concept stores, distributeurs : accédez au showroom professionnel.',
                en: 'Boutiques, concept stores, distributors: access the professional showroom.',
              })}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>
            <LinkButton to="/rendez-vous" variant="secondary">{t('nav.appointment')}</LinkButton>
          </div>
        </div>
      </section>
    </div>
  )
}
