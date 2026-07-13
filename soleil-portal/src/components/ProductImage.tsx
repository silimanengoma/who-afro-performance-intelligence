/* Image produit avec repli en placeholder clairement identifié.
 * L'application tente de charger l'asset réel (public/assets/products/…) ;
 * s'il est absent, un emplacement réservé s'affiche : aplat sable, monogramme,
 * référence et mention explicite. Aucun visuel fictif ne remplace les créations.
 * Correspondance des fichiers : scripts/asset-manifest.json.
 */
import { useState } from 'react'
import { useI18n } from '../i18n'
import type { ProductMedia } from '../data/types'

interface Props {
  media: ProductMedia | undefined
  reference: string
  className?: string
  sizesHint?: string
}

export function ProductImage({ media, reference, className = '' }: Props) {
  const { t, lx } = useI18n()
  const [failed, setFailed] = useState(false)

  if (!media || failed) {
    return (
      <div
        role="img"
        aria-label={t('product.placeholderNotice', { ref: reference })}
        className={`flex aspect-3/4 w-full flex-col items-center justify-center gap-3 bg-sable px-4 text-center ${className}`}
      >
        <span className="font-editorial text-5xl text-brun/25" aria-hidden>SC</span>
        <span className="text-[11px] leading-snug text-brun/60">
          {t('product.placeholderNotice', { ref: reference })}
        </span>
      </div>
    )
  }

  return (
    <img
      src={media.assetPath}
      alt={lx(media.alt)}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`aspect-3/4 w-full bg-sable object-contain ${className}`}
    />
  )
}
