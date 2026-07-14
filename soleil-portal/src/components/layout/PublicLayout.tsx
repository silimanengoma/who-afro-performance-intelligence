import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth/AuthContext'
import { useStore } from '../../data/store'
import { LangSwitcher } from './LangSwitcher'

const navItems = [
  { to: '/maison', key: 'nav.maison' },
  { to: '/lookbook', key: 'nav.lookbook' },
  { to: '/capsules', key: 'nav.capsules' },
  { to: '/signatures', key: 'nav.signatures' },
  { to: '/devenir-partenaire', key: 'nav.partner' },
  { to: '/contact', key: 'nav.contact' },
]

export function PublicLayout() {
  const { t } = useI18n()
  const { user, isAdmin } = useAuth()
  const { db } = useStore()
  const [open, setOpen] = useState(false)

  const accountLink = user
    ? (isAdmin ? { to: '/admin', label: t('nav.adminSpace') } : { to: '/espace-pro', label: t('nav.buyerSpace') })
    : { to: '/connexion', label: t('nav.login') }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-sable bg-ivoire/95 backdrop-blur">
        <div className="mx-auto flex max-w-310 items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="font-editorial text-xl tracking-wide text-nuit">
            {t('brand.name')}
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm transition-colors ${isActive ? 'text-or-500' : 'text-brun hover:text-nuit'}`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <LangSwitcher />
            <Link to={accountLink.to} className="border border-nuit px-4 py-2 text-sm text-nuit transition-colors hover:bg-nuit hover:text-ivoire">
              {accountLink.label}
            </Link>
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-nuit" />
              <span className="block h-0.5 w-6 bg-nuit" />
              <span className="block h-0.5 w-6 bg-nuit" />
            </span>
          </button>
        </div>
        {open && (
          <nav aria-label="Navigation mobile" className="border-t border-sable bg-ivoire px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="px-2 py-2.5 text-sm text-brun">
                  {t(item.key)}
                </NavLink>
              ))}
              <NavLink to="/acces-professionnel" onClick={() => setOpen(false)} className="px-2 py-2.5 text-sm font-medium text-or-500">
                {t('nav.access')}
              </NavLink>
              <NavLink to={accountLink.to} onClick={() => setOpen(false)} className="px-2 py-2.5 text-sm font-medium text-nuit">
                {accountLink.label}
              </NavLink>
              <div className="px-2 py-2">
                <LangSwitcher />
              </div>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-sable bg-nuit text-ivoire">
        <div className="mx-auto grid max-w-310 gap-10 px-4 py-12 md:grid-cols-3 md:px-8">
          <div>
            <p className="font-editorial text-2xl">{t('brand.name')}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ivoire/70">{t('brand.tagline')}</p>
            <p className="mt-4 text-xs uppercase tracking-widest text-or">{t('brand.city')}</p>
          </div>
          <div className="text-sm">
            <p className="surtitre mb-3">{t('nav.contact')}</p>
            <ul className="space-y-2 text-ivoire/80">
              <li>WhatsApp : {db.settings.whatsapp}</li>
              <li>E-mail : {db.settings.email}</li>
              <li>Instagram : {db.settings.instagram}</li>
              <li>{db.settings.atelierAddress}</li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="surtitre mb-3">{t('nav.buyerSpace')}</p>
            <ul className="space-y-2">
              <li><Link className="text-ivoire/80 hover:text-or" to="/acces-professionnel">{t('nav.access')}</Link></li>
              <li><Link className="text-ivoire/80 hover:text-or" to="/rendez-vous">{t('nav.appointment')}</Link></li>
              <li><Link className="text-ivoire/80 hover:text-or" to="/connexion">{t('nav.login')}</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
