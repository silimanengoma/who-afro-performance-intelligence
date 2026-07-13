/* Wholesale Lookbook — narration verticale immersive.
 * Structure imposée : couverture, manifeste, maison, fondatrice, univers,
 * capsules, signatures, pourquoi, partenariats, appel au showroom. */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { Reveal } from '../../components/Reveal'
import { ProductImage } from '../../components/ProductImage'
import { Button, LinkButton } from '../../components/ui'
import { partnershipModels } from '../../content/partnership'

export function Lookbook() {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const capsules = [...db.capsules].sort((a, b) => a.displayOrder - b.displayOrder)
  const featured = db.products.filter((p) => p.isFeatured && p.status === 'active')

  const share = async () => {
    const url = window.location.origin + '/lookbook'
    if (navigator.share) {
      try { await navigator.share({ title: 'Soleil Création — Lookbook', url }) } catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(url)
      alert(t('common.copied'))
    }
  }

  return (
    <article>
      {/* 1. Couverture */}
      <section className="flex min-h-[85vh] flex-col justify-center bg-nuit text-ivoire">
        <div className="mx-auto w-full max-w-310 px-4 md:px-8">
          <Reveal>
            <p className="surtitre">Wholesale Lookbook — {lang === 'fr' ? 'Collection Foire 2024' : 'Foire 2024 Collection'}</p>
            <h1 className="mt-4 max-w-4xl text-5xl leading-[1.02] md:text-8xl">{t('brand.name')}</h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivoire/80">{t('brand.tagline')}</p>
            <div className="mt-10 flex flex-wrap gap-3 no-print">
              <Button variant="gold" onClick={share}>{t('common.share')}</Button>
              <Button variant="ghost" className="text-ivoire hover:bg-ivoire/10" onClick={() => window.print()}>
                {t('common.print')}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. Manifeste */}
      <section className="mx-auto max-w-3xl px-4 py-24 text-center md:px-8">
        <Reveal>
          <p className="surtitre">{lx({ fr: 'Manifeste', en: 'Manifesto' })}</p>
          <p className="mt-6 font-editorial text-3xl leading-snug text-nuit md:text-4xl">
            {lx({
              fr: '« Réconcilier les hommes et les femmes avec leur culture et leur patrimoine immatériel. »',
              en: '“To reconcile people with their culture and their intangible heritage.”',
            })}
          </p>
          <p className="mt-6 leading-relaxed text-brun">
            {lx({
              fr: 'Chaque pièce est un support d’expression des valeurs qui caractérisent nos sociétés — portée par celles et ceux qui choisissent de se distinguer.',
              en: 'Each piece carries the values that define our societies — worn by those who choose to stand apart.',
            })}
          </p>
        </Reveal>
      </section>

      {/* 3 & 4. La maison, la fondatrice */}
      <section className="bg-sable-100">
        <div className="mx-auto grid max-w-310 gap-12 px-4 py-20 md:grid-cols-2 md:px-8">
          <Reveal>
            <p className="surtitre">{t('nav.maison')}</p>
            <h2 className="mt-3 font-editorial text-3xl text-nuit">{lx({ fr: 'Conçue à Brazzaville', en: 'Created in Brazzaville' })}</h2>
            <p className="mt-4 leading-relaxed text-brun">
              {lx({
                fr: 'Maison africaine contemporaine en développement, Soleil Création habille femmes et hommes pour la vie professionnelle, la représentation, les cérémonies et les événements.',
                en: 'A contemporary African house on the rise, Soleil Création dresses women and men for working life, representation, ceremonies and events.',
              })}
            </p>
            <Link to="/maison" className="mt-4 inline-block text-sm text-or-500 underline-offset-4 hover:underline">
              {t('common.learnMore')}
            </Link>
          </Reveal>
          <Reveal>
            <p className="surtitre">{lx({ fr: 'La fondatrice', en: 'The founder' })}</p>
            <h2 className="mt-3 font-editorial text-3xl text-nuit">Solina Rolla NGOMA</h2>
            <p className="mt-4 leading-relaxed text-brun">
              {lx({
                fr: 'Directrice créative de la maison, elle façonne une élégance africaine contemporaine, exigeante et habitée.',
                en: 'The house’s creative director shapes a contemporary African elegance — exacting and deeply felt.',
              })}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 & 6. Univers créatif et capsules */}
      {capsules.map((c, idx) => {
        const capsuleProducts = db.products.filter((p) => p.capsuleId === c.id && p.status === 'active').slice(0, 3)
        return (
          <section key={c.id} className={idx % 2 === 0 ? 'bg-ivoire' : 'bg-nuit text-ivoire'}>
            <div className="mx-auto max-w-310 px-4 py-20 md:px-8">
              <Reveal>
                <p className="surtitre">{lx({ fr: `Capsule ${idx + 1}`, en: `Capsule ${idx + 1}` })}</p>
                <h2 className={`mt-3 font-editorial text-4xl ${idx % 2 === 0 ? 'text-nuit' : 'text-ivoire'}`}>{lx(c.name)}</h2>
                <p className={`mt-4 max-w-2xl leading-relaxed ${idx % 2 === 0 ? 'text-brun' : 'text-ivoire/75'}`}>{lx(c.manifesto)}</p>
              </Reveal>
              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {capsuleProducts.map((p) => (
                  <Reveal key={p.id}>
                    <ProductImage media={p.media[0]} reference={p.reference} />
                    <p className={`mt-3 font-editorial text-lg ${idx % 2 === 0 ? 'text-nuit' : 'text-ivoire'}`}>{lx(p.name)}</p>
                    <p className={`text-xs italic ${idx % 2 === 0 ? 'text-brun/70' : 'text-ivoire/60'}`}>{lx(p.editorialText)}</p>
                  </Reveal>
                ))}
              </div>
              <Link
                to={`/capsules/${c.slug}`}
                className={`mt-8 inline-block text-sm underline-offset-4 hover:underline ${idx % 2 === 0 ? 'text-or-500' : 'text-or'}`}
              >
                {t('common.seeAll')}
              </Link>
            </div>
          </section>
        )
      })}

      {/* 7. Pièces signatures */}
      <section className="bg-sable-100">
        <div className="mx-auto max-w-310 px-4 py-20 md:px-8">
          <Reveal>
            <p className="surtitre">{t('nav.signatures')}</p>
            <h2 className="mt-3 font-editorial text-4xl text-nuit">
              {lx({ fr: 'Cinq pièces pour comprendre la maison', en: 'Five pieces that explain the house' })}
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
            {featured.map((p) => (
              <Reveal key={p.id}>
                <ProductImage media={p.media[0]} reference={p.reference} />
                <p className="mt-2 text-sm text-nuit">{lx(p.name)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Pourquoi Soleil Création */}
      <section className="mx-auto max-w-310 px-4 py-20 md:px-8">
        <Reveal>
          <p className="surtitre">{lx({ fr: 'Pourquoi Soleil Création', en: 'Why Soleil Création' })}</p>
        </Reveal>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            {
              fr: ['Une identité, pas un motif', 'Un vestiaire contemporain ancré à Brazzaville, loin des clichés — une signature que votre clientèle ne trouvera pas ailleurs.'],
              en: ['An identity, not a print', 'A contemporary wardrobe rooted in Brazzaville, far from clichés — a signature your clientele will not find elsewhere.'],
            },
            {
              fr: ['Femmes et hommes', 'Une offre double — robes, ensembles, boubous, gilets — qui couvre la vie professionnelle comme les grandes occasions.'],
              en: ['Women and men', 'A dual offer — dresses, ensembles, boubous, waistcoats — spanning working life and grand occasions.'],
            },
            {
              fr: ['Un partenariat sur mesure', 'Quatre modèles de collaboration, du test pilote à l’achat en gros, cadrés par des documents clairs.'],
              en: ['A tailored partnership', 'Four collaboration models, from pilot test to wholesale, framed by clear documents.'],
            },
          ].map((b, i) => (
            <Reveal key={i}>
              <div className="border-t-2 border-or pt-4">
                <h3 className="font-editorial text-xl text-nuit">{lang === 'fr' ? b.fr[0] : b.en[0]}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brun">{lang === 'fr' ? b.fr[1] : b.en[1]}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 9. Modèles de partenariat */}
      <section className="bg-nuit text-ivoire">
        <div className="mx-auto max-w-310 px-4 py-20 md:px-8">
          <Reveal>
            <p className="surtitre">{t('partnership.title')}</p>
            <h2 className="mt-3 font-editorial text-4xl">{lx({ fr: 'Quatre façons de travailler ensemble', en: 'Four ways to work together' })}</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {partnershipModels.map((m) => (
              <Reveal key={m.code}>
                <div className="border border-ivoire/15 p-6">
                  <h3 className="font-editorial text-2xl text-or">{lx(m.name)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivoire/75">{lx(m.summary)}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Link to="/devenir-partenaire" className="mt-8 inline-block text-sm text-or underline-offset-4 hover:underline">
            {t('common.learnMore')}
          </Link>
        </div>
      </section>

      {/* 10. Appel au showroom */}
      <section className="mx-auto max-w-310 px-4 py-24 text-center md:px-8">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-editorial text-4xl text-nuit">
            {lx({
              fr: 'Le showroom professionnel vous attend : références, variantes et conditions commerciales.',
              en: 'The professional showroom awaits: references, variants and trade terms.',
            })}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3 no-print">
            <LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>
            <LinkButton to="/rendez-vous" variant="secondary">{t('nav.appointment')}</LinkButton>
          </div>
        </Reveal>
      </section>
    </article>
  )
}
