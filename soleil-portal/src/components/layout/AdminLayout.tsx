import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth/AuthContext'
import { useStore } from '../../data/store'
import { LangSwitcher } from './LangSwitcher'
import { DemoBanner } from '../ui'

const groups: { title: string; items: { to: string; key: string; end?: boolean }[] }[] = [
  {
    title: '',
    items: [{ to: '/admin', key: 'admin.overview', end: true }],
  },
  {
    title: 'Catalogue',
    items: [
      { to: '/admin/produits', key: 'admin.products' },
      { to: '/admin/capsules', key: 'admin.capsules' },
      { to: '/admin/medias', key: 'admin.media' },
      { to: '/admin/prix', key: 'admin.prices' },
      { to: '/admin/conditions', key: 'admin.terms' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { to: '/admin/demandes-acces', key: 'admin.accessRequests' },
      { to: '/admin/prospects', key: 'admin.prospects' },
      { to: '/admin/selections', key: 'admin.selections' },
      { to: '/admin/devis', key: 'admin.quotes' },
      { to: '/admin/commandes', key: 'admin.orders' },
      { to: '/admin/documents', key: 'admin.documents' },
    ],
  },
  {
    title: 'Pilotage',
    items: [
      { to: '/admin/contenus', key: 'admin.contents' },
      { to: '/admin/utilisateurs', key: 'admin.users' },
      { to: '/admin/statistiques', key: 'admin.stats' },
      { to: '/admin/parametres', key: 'admin.settings' },
      { to: '/admin/audit', key: 'admin.audit' },
    ],
  },
]

export function AdminLayout() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const { db } = useStore()
  const [open, setOpen] = useState(false)
  const unread = db.notifications.filter((n) => n.audience === 'admin' && !n.readAt).length

  const nav = (
    <ul className="space-y-4 py-4">
      {groups.map((g, i) => (
        <li key={i}>
          {g.title && <p className="px-5 pb-1 text-[11px] font-semibold uppercase tracking-widest text-brun/50">{g.title}</p>}
          <ul>
            {g.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-5 py-2 text-sm transition-colors ${
                      isActive ? 'border-r-2 border-or bg-sable-100 text-nuit' : 'text-brun hover:bg-sable-100/60'
                    }`
                  }
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <header className="no-print border-b border-sable bg-nuit text-ivoire">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              <span className="space-y-1">
                <span className="block h-0.5 w-5 bg-ivoire" />
                <span className="block h-0.5 w-5 bg-ivoire" />
                <span className="block h-0.5 w-5 bg-ivoire" />
              </span>
            </button>
            <Link to="/" className="font-editorial text-lg tracking-wide">{t('brand.name')}</Link>
            <span className="hidden bg-or/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-or sm:block">
              {t('nav.adminSpace')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/notifications" className="relative text-xs text-ivoire/80 hover:text-or">
              Notifications
              {unread > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-or px-1.5 text-[10px] text-ivoire">{unread}</span>
              )}
            </Link>
            <LangSwitcher dark />
            <span className="hidden text-xs text-ivoire/70 lg:block">{user?.fullName}</span>
            <button onClick={logout} className="text-xs text-ivoire/70 underline-offset-4 hover:text-or hover:underline">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav aria-label={t('nav.adminSpace')} className={`no-print w-60 shrink-0 border-r border-sable bg-ivoire ${open ? 'block' : 'hidden'} md:block`}>
          {nav}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
