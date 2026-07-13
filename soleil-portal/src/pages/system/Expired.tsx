import { useI18n } from '../../i18n'
import { LinkButton } from '../../components/ui'

export function Expired() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <p className="font-editorial text-5xl text-sable">SC</p>
      <h1 className="font-editorial text-3xl text-nuit">{t('system.expired.title')}</h1>
      <p className="max-w-md text-sm leading-relaxed text-brun">{t('system.expired.body')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>
        <LinkButton to="/" variant="secondary">{t('system.backHome')}</LinkButton>
      </div>
    </div>
  )
}
