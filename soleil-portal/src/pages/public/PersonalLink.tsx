/* Lien personnalisé de prospection /l/:token — étape 1 du parcours principal.
 * Résout un shared_link (scope lookbook), trace la consultation, met à jour le
 * pipeline du prospect, puis affiche le lookbook. */
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../data/store'
import { Lookbook } from './Lookbook'
import { Expired } from '../system/Expired'
import { useI18n } from '../../i18n'

export function PersonalLink() {
  const { token } = useParams()
  const { db, update, logActivity, setPipeline } = useStore()
  const { lx } = useI18n()
  const tracked = useRef(false)

  const link = db.sharedLinks.find((l) => l.token === token && l.scope === 'lookbook')
  const valid = link && !link.revokedAt && (!link.expiresAt || new Date(link.expiresAt) > new Date())

  useEffect(() => {
    if (!valid || !link || tracked.current) return
    tracked.current = true
    update((d) => ({
      ...d,
      sharedLinks: d.sharedLinks.map((l) => (l.id === link.id ? { ...l, views: l.views + 1 } : l)),
    }))
    logActivity({ type: 'lookbook_viewed', organizationId: link.organizationId, refId: link.id, detail: link.watermark })
    if (link.organizationId) {
      const org = db.organizations.find((o) => o.id === link.organizationId)
      if (org && (org.pipelineStatus === 'nouveau_prospect' || org.pipelineStatus === 'contacte')) {
        setPipeline(link.organizationId, 'lookbook_consulte')
      }
    }
  }, [valid, link, update, logActivity, setPipeline, db.organizations])

  if (!valid) return <Expired />

  return (
    <div>
      <p className="bg-or/15 px-4 py-2 text-center text-xs text-or-500">
        {lx({ fr: `Présentation préparée pour ${link!.watermark}`, en: `Presentation prepared for ${link!.watermark}` })}
      </p>
      <Lookbook />
    </div>
  )
}
