/* Fiche produit professionnelle : galerie multi-vues + zoom, variantes,
 * prix pro / PPC / marge, MOQ, délais, demandes d'échantillon et de
 * personnalisation. Toute donnée inconnue affiche « à confirmer ». */
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { marginRate, marginValue, usePriceFor, useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { ProductImage } from '../../components/ProductImage'
import { Badge, Button, LinkButton, NextStep, Tbc } from '../../components/ui'
import { NotFound } from '../system/NotFound'
import { formatMoney, formatPercent } from '../../utils/format'

export function ProductDetail() {
  const { ref } = useParams()
  const { t, lx, lang } = useI18n()
  const { db, logActivity, notify } = useStore()
  const { org, addItem, isSelected } = useBuyer()
  const [mediaIndex, setMediaIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [requested, setRequested] = useState<'' | 'sample' | 'customization'>('')

  const product = db.products.find((p) => p.reference === ref && p.status === 'active')
  const price = usePriceFor(product?.id ?? '')
  if (!product) return <NotFound />

  const capsule = db.capsules.find((c) => c.id === product.capsuleId)
  const media = product.media[mediaIndex] ?? product.media[0]
  const mVal = marginValue(price)
  const mRate = marginRate(price)

  const request = (kind: 'sample' | 'customization') => {
    logActivity({
      type: kind === 'sample' ? 'sample_requested' : 'customization_requested',
      organizationId: org?.id ?? null, refId: product.id, detail: product.reference,
    })
    notify({
      audience: 'admin', organizationId: org?.id ?? null,
      templateCode: kind === 'sample' ? 'sample_requested' : 'customization_requested',
      title: {
        fr: kind === 'sample' ? "Demande d'échantillon" : 'Demande de personnalisation',
        en: kind === 'sample' ? 'Sample request' : 'Customisation request',
      },
      body: { fr: `${org?.tradeName ?? ''} — ${product.reference}`, en: `${org?.tradeName ?? ''} — ${product.reference}` },
    })
    setRequested(kind)
  }

  return (
    <div>
      <Link to="/espace-pro/showroom" className="text-sm text-or-500 underline-offset-4 hover:underline">
        ← {t('buyer.showroom')}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* Galerie */}
        <div>
          <button className="block w-full cursor-zoom-in" onClick={() => setZoom(true)} aria-label={t('product.zoom')}>
            <ProductImage media={media} reference={product.reference} />
          </button>
          {product.media.length > 1 && (
            <div className="mt-3 flex gap-2" role="tablist" aria-label={t('product.gallery')}>
              {product.media.map((m, i) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={i === mediaIndex}
                  onClick={() => setMediaIndex(i)}
                  className={`w-20 border ${i === mediaIndex ? 'border-or' : 'border-sable'}`}
                >
                  <ProductImage media={m} reference={product.reference} />
                </button>
              ))}
            </div>
          )}
          {zoom && (
            <div
              className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-nuit/90 p-4"
              onClick={() => setZoom(false)}
              role="dialog"
              aria-label={t('product.zoom')}
            >
              <div className="max-h-full w-full max-w-3xl overflow-auto">
                <ProductImage media={media} reference={product.reference} className="!aspect-auto" />
              </div>
            </div>
          )}
        </div>

        {/* Informations */}
        <div>
          <p className="surtitre">{capsule ? lx(capsule.name) : ''}</p>
          <h1 className="mt-1 font-editorial text-4xl text-nuit">{lx(product.name)}</h1>
          <p className="mt-1 text-sm uppercase tracking-wider text-brun/60">{product.reference} · {t(`category.${product.category}`)} · {t(`gender.${product.gender}`)}</p>

          <p className="mt-4 leading-relaxed text-brun">{lx(product.description)}</p>
          <p className="mt-2 text-sm italic text-brun/80">{lx(product.editorialText)}</p>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border border-sable bg-white p-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.wholesalePrice')}</p>
              <p className="font-medium text-nuit"><Tbc value={formatMoney(price?.wholesalePrice ?? null, price?.currency ?? 'XAF', lang)} /></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.rrp')}</p>
              <p className="font-medium text-nuit"><Tbc value={formatMoney(price?.rrp ?? null, price?.currency ?? 'XAF', lang)} /></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.marginValue')}</p>
              <p className="text-nuit"><Tbc value={formatMoney(mVal, price?.currency ?? 'XAF', lang)} /></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.marginRate')}</p>
              <p className="text-nuit"><Tbc value={formatPercent(mRate, lang)} /></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.moq')}</p>
              <p className="text-nuit"><Tbc value={product.minOrderQty} /></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.leadTime')}</p>
              <p className="text-nuit">
                {product.leadTimeDays ? t('product.leadTimeDays', { n: product.leadTimeDays }) : <Tbc />}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.availability')}</p>
              <Badge tone={product.availability === 'available' ? 'success' : 'neutral'}>
                {t(`availability.${product.availability}`)}
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.colors')} / {t('product.sizes')}</p>
              <p className="text-nuit">
                {product.variants.map((v, i) => (
                  <span key={v.id}>
                    {i > 0 && ' · '}
                    {v.color ? lx(v.color) : t('common.tbc')} — {v.sizes?.join(', ') ?? t('common.tbc')}
                  </span>
                ))}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.materials')}</p>
              <p className="text-nuit"><Tbc value={product.materials ? lx(product.materials) : null} /></p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.care')}</p>
              <p className="text-nuit"><Tbc value={product.care ? lx(product.care) : null} /></p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wider text-brun/60">{t('product.customization')}</p>
              <p className="text-nuit">{product.customization ? lx(product.customization) : t('common.onRequest')}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => addItem(product.id)} disabled={isSelected(product.id)}>
              {isSelected(product.id) ? t('product.inSelection') : t('product.addToSelection')}
            </Button>
            <Button variant="secondary" onClick={() => request('sample')} disabled={requested === 'sample'}>
              {t('product.requestSample')}
            </Button>
            <Button variant="secondary" onClick={() => request('customization')} disabled={requested === 'customization'}>
              {t('product.requestCustomization')}
            </Button>
          </div>
          {requested && <p className="mt-3 text-sm text-succes">{t('notif.simulated')}</p>}

          {isSelected(product.id) && (
            <div className="mt-6">
              <NextStep action={<LinkButton to="/espace-pro/selection" variant="gold">{t('buyer.selection')}</LinkButton>}>
                {lx({
                  fr: 'Précisez tailles, coloris et quantités dans votre sélection.',
                  en: 'Set sizes, colours and quantities in your selection.',
                })}
              </NextStep>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
