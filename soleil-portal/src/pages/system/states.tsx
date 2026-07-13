import type { ReactNode } from 'react'
import { useI18n } from '../../i18n'
import { LinkButton } from '../../components/ui'

function StatePage({ title, body, extra }: { title: string; body: string; extra?: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <p className="font-editorial text-5xl text-sable">SC</p>
      <h1 className="font-editorial text-3xl text-nuit">{title}</h1>
      <p className="max-w-md text-sm leading-relaxed text-brun">{body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <LinkButton to="/" variant="secondary">{t('system.backHome')}</LinkButton>
        {extra}
      </div>
    </div>
  )
}

export function Forbidden() {
  const { t } = useI18n()
  return (
    <StatePage
      title={t('system.403.title')}
      body={t('system.403.body')}
      extra={<LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>}
    />
  )
}

export function ErrorPage() {
  const { t } = useI18n()
  return <StatePage title={t('system.error.title')} body={t('system.error.body')} />
}

export function Maintenance() {
  const { t } = useI18n()
  return <StatePage title={t('system.maintenance.title')} body={t('system.maintenance.body')} />
}
