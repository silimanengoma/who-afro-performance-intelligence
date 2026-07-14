import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { ProductImage } from '../../components/ProductImage'
import { LinkButton, SectionTitle } from '../../components/ui'
import { Reveal } from '../../components/Reveal'

export function Signatures() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const featured = db.products.filter((p) => p.isFeatured && p.status === 'active')

  return (
    <div className="mx-auto max-w-310 px-4 py-16 md:px-8">
      <SectionTitle
        overline={t('nav.signatures')}
        title={lx({ fr: 'Les pièces vedettes', en: 'Signature pieces' })}
        lead={lx({
          fr: 'Les pièces qui incarnent le mieux la maison, sélectionnées par la direction créative.',
          en: 'The pieces that best embody the house, selected by the creative direction.',
        })}
      />
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        {featured.map((p) => {
          const capsule = db.capsules.find((c) => c.id === p.capsuleId)
          return (
            <Reveal key={p.id}>
              <ProductImage media={p.media[0]} reference={p.reference} />
              <p className="mt-3 font-editorial text-xl text-nuit">{lx(p.name)}</p>
              <p className="text-xs uppercase tracking-wider text-brun/60">
                {p.reference} · {capsule ? lx(capsule.name) : ''}
              </p>
              <p className="mt-1 text-sm italic text-brun/80">{lx(p.editorialText)}</p>
            </Reveal>
          )
        })}
      </div>
      <div className="mt-12 flex gap-3">
        <LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>
        <LinkButton to="/lookbook" variant="secondary">{t('nav.lookbook')}</LinkButton>
      </div>
    </div>
  )
}
