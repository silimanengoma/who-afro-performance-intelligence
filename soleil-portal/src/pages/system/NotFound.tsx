import { useI18n } from '../../i18n'
import { LinkButton } from '../../components/ui'

export function NotFound() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <p className="font-editorial text-6xl text-sable">404</p>
      <h1 className="font-editorial text-3xl text-nuit">{t('system.404.title')}</h1>
      <p className="max-w-md text-sm leading-relaxed text-brun">{t('system.404.body')}</p>
      <LinkButton to="/" variant="secondary">{t('system.backHome')}</LinkButton>
    </div>
  )
}
