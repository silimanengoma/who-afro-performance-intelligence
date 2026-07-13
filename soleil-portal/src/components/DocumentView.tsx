/* Rendu imprimable d'un document du Partnership Pack, avec avertissement
 * juridique obligatoire. */
import { useI18n } from '../i18n'
import { useStore } from '../data/store'
import { Button } from './ui'
import type { DocTemplate } from '../content/documents'
import type { Organization } from '../data/types'

export function DocumentView({ template, org, onClose }: { template: DocTemplate; org: Organization | null; onClose: () => void }) {
  const { t, lx, lang } = useI18n()
  const { db } = useStore()
  const sections = template.sections(org, db.settings)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-nuit/70 p-4" role="dialog" aria-modal="true" aria-label={lx(template.title)}>
      <div className="mx-auto max-w-2xl bg-white p-8 shadow-xl print:shadow-none">
        <div className="no-print mb-6 flex justify-between gap-2">
          <Button variant="secondary" onClick={() => window.print()}>{t('common.print')}</Button>
          <Button variant="ghost" onClick={onClose}>{t('common.close')}</Button>
        </div>
        <header className="border-b-2 border-or pb-4">
          <p className="font-editorial text-2xl text-nuit">SOLEIL CRÉATION</p>
          <p className="text-xs uppercase tracking-widest text-brun/60">{t('brand.city')}</p>
        </header>
        <h1 className="mt-6 font-editorial text-2xl text-nuit">{lx(template.title)}</h1>
        <p className="mt-2 text-sm italic text-brun">{lx(template.intro)}</p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-encre">
          {sections.map((sec, i) => (
            <section key={i}>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-brun">{lx(sec.heading)}</h2>
              <p>{lx(sec.body)}</p>
            </section>
          ))}
        </div>
        <footer className="mt-10 border-t border-sable pt-4">
          <p className="text-xs italic text-erreur">{t('common.legalTemplate')}</p>
          <p className="mt-2 text-xs text-brun/60">
            {lang === 'fr' ? 'Document généré le ' : 'Document generated on '}
            {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
          </p>
        </footer>
      </div>
    </div>
  )
}
