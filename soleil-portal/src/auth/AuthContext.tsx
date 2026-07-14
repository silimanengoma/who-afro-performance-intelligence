/* Authentification du mode démonstration.
 * En production : Supabase Auth (même surface — voir src/data/supabase-adapter.md).
 * Les autorisations réelles sont définies par les politiques RLS ; ici, les
 * gardes de routes reproduisent la même matrice côté client.
 */
import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../data/store'
import type { Role, UserAccount } from '../data/types'

const SESSION_KEY = 'soleil-portal-session'

interface AuthValue {
  user: UserAccount | null
  role: Role
  isAdmin: boolean
  login: (email: string, password: string) => 'ok' | 'bad_credentials' | 'not_approved'
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db } = useStore()
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))

  const value = useMemo<AuthValue>(() => {
    const user = db.users.find((u) => u.id === userId) ?? null
    const role: Role = user?.role ?? 'public'
    return {
      user,
      role,
      isAdmin: role === 'sales_admin' || role === 'content_admin' || role === 'super_admin',
      login: (email, password) => {
        const found = db.users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
        )
        if (!found) return 'bad_credentials'
        if (!found.approved) return 'not_approved'
        setUserId(found.id)
        localStorage.setItem(SESSION_KEY, found.id)
        return 'ok'
      },
      logout: () => {
        setUserId(null)
        localStorage.removeItem(SESSION_KEY)
      },
    }
  }, [db.users, userId])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>')
  return ctx
}
