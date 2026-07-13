import { useI18n } from '../../i18n'
import { Reveal } from '../../components/Reveal'
import { LinkButton, SectionTitle } from '../../components/ui'

/* La Maison — contenus fondés sur les faits établis (voir docs/MASTER_PRODUCT_BRIEF.md §2).
 * Aucune date, distinction ou capacité inventée. */
export function Maison() {
  const { t, lx } = useI18n()

  return (
    <div>
      <section className="bg-nuit text-ivoire">
        <div className="mx-auto max-w-310 px-4 py-20 md:px-8">
          <p className="surtitre">{t('nav.maison')}</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">
            {lx({
              fr: 'Une maison de Brazzaville, une mission : réconcilier chacun avec sa culture.',
              en: 'A Brazzaville house with one mission: reconciling people with their culture.',
            })}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-310 px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <h2 className="font-editorial text-2xl text-nuit">{lx({ fr: 'Le manifeste', en: 'The manifesto' })}</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-brun">
              <p>
                {lx({
                  fr: 'Soleil Création conçoit des vêtements haut de gamme pour femmes et hommes, de tous âges et de toutes origines. La maison se donne une mission : réconcilier les hommes et les femmes avec leur culture et leur patrimoine immatériel.',
                  en: 'Soleil Création designs high-end clothing for women and men of all ages and origins. The house has set itself one mission: to reconcile people with their culture and their intangible heritage.',
                })}
              </p>
              <p>
                {lx({
                  fr: 'Bien plus que des vêtements, ses créations sont des supports d’expression des valeurs qui caractérisent nos sociétés. La collection « Sénégal Thiakanam » célébrait ainsi la téranga (hospitalité), le soutoura (dignité) et le diom (détermination). Soleil Création invite chacun à devenir ambassadeur de ce que nos sociétés ont de plus authentique.',
                  en: 'More than garments, its creations carry the values that define our societies. The “Sénégal Thiakanam” collection celebrated teranga (hospitality), soutoura (dignity) and diom (determination). Soleil Création invites everyone to become an ambassador of what our societies hold most authentic.',
                })}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <h2 className="font-editorial text-2xl text-nuit">Solina Rolla NGOMA</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-brun">
              <p>
                {lx({
                  fr: 'Fondatrice et directrice créative, Solina Rolla NGOMA conduit la maison depuis Brazzaville. Elle dessine un vestiaire féminin et masculin pensé pour la vie professionnelle, les fonctions de représentation, les cérémonies et les événements — pour une clientèle africaine et diasporique en quête de distinction.',
                  en: 'Founder and creative director, Solina Rolla NGOMA leads the house from Brazzaville. She designs a wardrobe for women and men made for working life, representation, ceremonies and events — for African and diaspora clients seeking distinction.',
                })}
              </p>
              <p className="text-sm italic text-brun/70">
                {lx({
                  fr: 'Portrait et biographie détaillée : à confirmer par la maison.',
                  en: 'Portrait and detailed biography: to be confirmed by the house.',
                })}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-sable-100">
        <div className="mx-auto max-w-310 px-4 py-16 md:px-8">
          <SectionTitle
            overline={lx({ fr: 'Le showroom', en: 'The showroom' })}
            title={lx({ fr: 'Shop Plateau, Brazzaville', en: 'Shop Plateau, Brazzaville' })}
            lead={lx({
              fr: 'La maison reçoit ses partenaires dans sa boutique du Plateau, récemment réaménagée. Photographies à intégrer (voir inventaire des contenus).',
              en: 'The house welcomes partners in its recently refurbished Plateau boutique. Photographs to be added (see content inventory).',
            })}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex aspect-4/3 items-center justify-center bg-sable text-center text-[11px] text-brun/60">
                {lx({ fr: `Photo boutique ${i} — à intégrer`, en: `Boutique photo ${i} — to be added` })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-310 px-4 py-16 md:px-8">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-xl font-editorial text-3xl text-nuit">
            {lx({ fr: 'Découvrir la collection en images', en: 'Discover the collection in images' })}
          </h2>
          <LinkButton to="/lookbook" variant="gold">{t('nav.lookbook')}</LinkButton>
        </div>
      </section>
    </div>
  )
}
