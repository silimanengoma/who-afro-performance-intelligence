import { useState } from 'react'
import { useI18n } from '../../i18n'
import { Button, FieldWrap, TextInput } from '../../components/ui'

export function ForgotPassword() {
  const { t, lx } = useI18n()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError(t('common.invalidEmail')); return }
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 md:px-8">
      <h1 className="font-editorial text-3xl text-nuit">{t('auth.forgot')}</h1>
      {sent ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm leading-relaxed text-brun">
            {lx({
              fr: 'Si un compte existe pour cette adresse, un lien de réinitialisation lui sera adressé.',
              en: 'If an account exists for this address, a reset link will be sent to it.',
            })}
          </p>
          <p className="text-xs italic text-brun/70">{t('notif.simulated')}</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          <FieldWrap htmlFor="email" label={t('auth.email')} required error={error}>
            <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </FieldWrap>
          <Button type="submit">{t('common.send')}</Button>
        </form>
      )}
    </div>
  )
}
