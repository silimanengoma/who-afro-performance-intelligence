import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth/AuthContext'
import { Button, FieldWrap, TextInput } from '../../components/ui'
import { demoUsers } from '../../data/seed'

export function Login() {
  const { t, lx } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login(email, password)
    if (result === 'bad_credentials') { setError(t('auth.badCredentials')); return }
    if (result === 'not_approved') { setError(t('auth.notApproved')); return }
    const from = (location.state as { from?: string } | null)?.from
    const target = demoUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    const fallback = target && target.role !== 'buyer' ? '/admin' : '/espace-pro'
    navigate(from ?? fallback, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 md:px-8">
      <h1 className="font-editorial text-3xl text-nuit">{t('auth.login')}</h1>
      <p className="mt-2 text-sm text-brun">
        {lx({ fr: 'Espace réservé aux professionnels autorisés.', en: 'Reserved for authorised professionals.' })}
      </p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <FieldWrap htmlFor="email" label={t('auth.email')} required>
          <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </FieldWrap>
        <FieldWrap htmlFor="password" label={t('auth.password')} required error={error}>
          <TextInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </FieldWrap>
        <div className="flex items-center justify-between">
          <Button type="submit">{t('auth.loginCta')}</Button>
          <Link to="/mot-de-passe-oublie" className="text-sm text-or-500 underline-offset-4 hover:underline">
            {t('auth.forgot')}
          </Link>
        </div>
      </form>
      <p className="mt-6 text-sm text-brun">
        <Link to="/inscription" className="text-or-500 underline-offset-4 hover:underline">{t('auth.signup')}</Link>
      </p>
      <div className="mt-10 border border-dashed border-sable p-4 text-xs text-brun/80">
        <p className="surtitre mb-2">{t('auth.demoAccounts')}</p>
        <ul className="space-y-1">
          <li>Acheteur : boutique@demo.example</li>
          <li>Ventes : ventes@soleilcreation.example</li>
          <li>Contenus : contenus@soleilcreation.example</li>
          <li>Direction : direction@soleilcreation.example</li>
          <li>{lx({ fr: 'Mot de passe commun', en: 'Shared password' })} : soleil2026</li>
        </ul>
      </div>
    </div>
  )
}
