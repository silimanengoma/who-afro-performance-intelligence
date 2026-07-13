/* Couche de données — mode démonstration.
 * Toute l'interface consomme ce contexte ; l'adaptateur Supabase (production)
 * expose la même surface (voir src/data/supabase-adapter.md et supabase/).
 * Persistance : localStorage (la sélection survit au rafraîchissement).
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as seed from './seed'
import type {
  AccessRequest, ActivityEvent, AdminTask, AppNotification, Appointment,
  AuditLog, BrandSettings, Capsule, CommunicationLog, Order, OrderStatus,
  Organization, PipelineStatus, Product, Quote, QuoteStatus, Selection,
  SharedLink, UserAccount, WholesalePrice,
} from './types'

export interface Database {
  seedVersion: number
  products: Product[]
  capsules: Capsule[]
  prices: WholesalePrice[]
  organizations: Organization[]
  users: UserAccount[]
  selections: Selection[]
  accessRequests: AccessRequest[]
  appointments: Appointment[]
  quotes: Quote[]
  orders: Order[]
  activities: ActivityEvent[]
  notifications: AppNotification[]
  tasks: AdminTask[]
  sharedLinks: SharedLink[]
  auditLogs: AuditLog[]
  communications: CommunicationLog[]
  settings: BrandSettings
}

const STORAGE_KEY = 'soleil-portal-db-v1'

function freshDatabase(): Database {
  return {
    seedVersion: seed.SEED_VERSION,
    products: seed.products,
    capsules: seed.capsules,
    prices: seed.wholesalePrices,
    organizations: [seed.demoOrganization],
    users: seed.demoUsers,
    selections: [],
    accessRequests: [],
    appointments: [],
    quotes: [],
    orders: [],
    activities: [],
    notifications: [],
    tasks: [
      {
        id: 'task-demo-1',
        title: 'Renseigner les prix professionnels et publics conseillés (voir Prix)',
        dueDate: null, organizationId: null, done: false, createdAt: new Date().toISOString(),
      },
      {
        id: 'task-demo-2',
        title: 'Importer les visuels produits depuis Dropbox (scripts/import-assets.md)',
        dueDate: null, organizationId: null, done: false, createdAt: new Date().toISOString(),
      },
    ],
    sharedLinks: [],
    auditLogs: [],
    communications: [],
    settings: seed.brandSettings,
  }
}

function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshDatabase()
    const db = JSON.parse(raw) as Database
    if (db.seedVersion !== seed.SEED_VERSION) return freshDatabase()
    return db
  } catch {
    return freshDatabase()
  }
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface StoreValue {
  db: Database
  update: (fn: (db: Database) => Database) => void
  resetDemo: () => void
  logActivity: (e: Omit<ActivityEvent, 'id' | 'at'>) => void
  notify: (n: Omit<AppNotification, 'id' | 'createdAt' | 'simulated' | 'readAt'>) => void
  audit: (actorEmail: string, action: string, entity: string, entityId: string) => void
  setPipeline: (organizationId: string, status: PipelineStatus) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(loadDatabase)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // stockage plein ou indisponible : le mode démo continue en mémoire
    }
  }, [db])

  const value = useMemo<StoreValue>(() => {
    const update = (fn: (d: Database) => Database) => setDb((prev) => fn(prev))
    const logActivity: StoreValue['logActivity'] = (e) =>
      update((d) => ({
        ...d,
        activities: [{ ...e, id: uid('act'), at: new Date().toISOString() }, ...d.activities].slice(0, 500),
      }))
    const notify: StoreValue['notify'] = (n) =>
      update((d) => ({
        ...d,
        notifications: [
          { ...n, id: uid('ntf'), simulated: true as const, readAt: null, createdAt: new Date().toISOString() },
          ...d.notifications,
        ].slice(0, 200),
      }))
    const audit: StoreValue['audit'] = (actorEmail, action, entity, entityId) =>
      update((d) => ({
        ...d,
        auditLogs: [
          { id: uid('aud'), actorEmail, action, entity, entityId, at: new Date().toISOString() },
          ...d.auditLogs,
        ].slice(0, 500),
      }))
    const setPipeline: StoreValue['setPipeline'] = (organizationId, status) =>
      update((d) => ({
        ...d,
        organizations: d.organizations.map((o) => (o.id === organizationId ? { ...o, pipelineStatus: status } : o)),
      }))
    return {
      db,
      update,
      resetDemo: () => setDb(freshDatabase()),
      logActivity,
      notify,
      audit,
      setPipeline,
    }
  }, [db])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore doit être utilisé sous <StoreProvider>')
  return ctx
}

/* ---- Sélecteurs utilitaires ---- */

export function useProduct(reference: string | undefined): Product | undefined {
  const { db } = useStore()
  return db.products.find((p) => p.reference === reference)
}

export function usePriceFor(productId: string): WholesalePrice | undefined {
  const { db } = useStore()
  return db.prices.find((p) => p.productId === productId)
}

export function marginValue(price: WholesalePrice | undefined): number | null {
  if (!price || price.wholesalePrice == null || price.rrp == null) return null
  return price.rrp - price.wholesalePrice
}

export function marginRate(price: WholesalePrice | undefined): number | null {
  if (!price || price.wholesalePrice == null || price.rrp == null || price.rrp === 0) return null
  return ((price.rrp - price.wholesalePrice) / price.rrp) * 100
}

export function nextQuoteNumber(db: Database): string {
  return `DEV-${String(db.quotes.length + 1).padStart(4, '0')}`
}

export function nextOrderNumber(db: Database): string {
  return `CMD-${String(db.orders.length + 1).padStart(4, '0')}`
}

export const QUOTE_STATUS_FLOW: QuoteStatus[] = ['draft', 'sent', 'accepted', 'change_requested', 'rejected', 'expired']
export const ORDER_STATUS_FLOW: OrderStatus[] = ['preparing', 'confirmed', 'shipped', 'delivered', 'closed']
