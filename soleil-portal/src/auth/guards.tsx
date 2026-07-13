import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type { Role } from '../data/types'

/** Garde de route : redirige vers /connexion puis /acces-refuse selon le cas. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, role } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }
  if (!roles.includes(role)) {
    return <Navigate to="/acces-refuse" replace />
  }
  return <>{children}</>
}
