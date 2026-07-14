import { Link, NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth/AuthContext'
import { useStore } from '../../data/store'
import { LangSwitcher } from './LangSwitcher'
import { DemoBanner } from '../ui'

const items = [
  { to: '/espace-pro', key: 'buyer.dashboard', end: true },
  { to: '/espace-pro/showroom', key: 'buyer.showroom' },
  { to: '/espace-pro/selection', key: 'buyer.selection' },
  { to: '/espace-pro/line-sheet', key: 'buyer.linesheet' },
  { to: '/espace-pro/devis', key: 'buyer.quotes' },
  { to: '/espace-pro/commandes', key: 'buyer.orders' },
  { to: '/espace-pro/partenariat', key: 'buyer.partnership' },
  { to: '/espace-pro/documents', key: 'buyer.documents' },
  { to: '/espace-pro/organisation', key: 'buyer.organization' },
  { to: '/espace-pro/support', key: 'buyer.support' },
]

export function BuyerLayout() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const { db } = useStore()
  const org = db.organizations.find((o) => o.id === user?.organizationId)
  const selection = db.selections.find((s) => s.organizationId === org?.id && s.status === 'open')
  const count = selection?.items.length ?? 0

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <header className="no-print border-b border-sable bg-nuit text-ivoire">
        <div className="mx-auto flex max-w-350 items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="font-editorial text-lg tracking-wide">{t('brand.name')}</Link>
          <div className="flex items-center gap-4">
            <LangSwitcher dark />
            <span className="hidden text-xs text-ivoire/70 sm:block">{org?.tradeName ?? user?.fullName}</span>
            <button onClick={logout} className="text-xs text-ivoire/70 underline-offset-4 hover:text-or hover:underline">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-350 flex-1 flex-col md:flex-row">
        <nav aria-label={t('nav.buyerSpace')} className="no-print hidden w-56 shrink-0 border-r border-sable py-6 md:block">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-5 py-2.5 text-sm transition-colors ${
                      isActive ? 'border-r-2 border-or bg-sable-100 text-nuit' : 'text-brun hover:bg-sable-100/60'
                    }`
                  }
                >
                  {t(item.key)}
                  {item.key === 'buyer.selection' && count > 0 && (
                    <span className="rounded-full bg-or px-2 py-0.5 text-xs text-ivoire">{count}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Barre mobile : « Ma sélection » toujours accessible */}
      <nav aria-label="Navigation rapide" className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-sable bg-ivoire md:hidden">
        {[
          { to: '/espace-pro', key: 'buyer.dashboard', end: true },
          { to: '/espace-pro/showroom', key: 'buyer.showroom' },
          { to: '/espace-pro/selection', key: 'buyer.selection' },
          { to: '/espace-pro/devis', key: 'buyer.quotes' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] ${isActive ? 'text-or-500' : 'text-brun'}`
            }
          >
            <span className="relative">
              {t(item.key)}
              {item.key === 'buyer.selection' && count > 0 && (
                <span className="absolute -right-4 -top-1 rounded-full bg-or px-1.5 text-[10px] text-ivoire">{count}</span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
