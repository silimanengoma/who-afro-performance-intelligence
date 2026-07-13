/* Opérations de l'espace acheteur : organisation courante, sélection ouverte,
 * ajout/mise à jour/retrait de pièces. La sélection est persistée (localStorage
 * via le store) et n'est jamais une commande ferme. */
import { useAuth } from '../auth/AuthContext'
import { uid, useStore } from './store'
import type { Organization, Selection, SelectionItem } from './types'

export function useBuyer() {
  const { user } = useAuth()
  const { db, update, logActivity, setPipeline } = useStore()

  const org: Organization | undefined = db.organizations.find((o) => o.id === user?.organizationId)
  const selection: Selection | undefined = db.selections.find(
    (s) => s.organizationId === org?.id && s.status === 'open',
  )

  const ensureSelection = (d: typeof db, orgId: string): [typeof db, string] => {
    const existing = d.selections.find((s) => s.organizationId === orgId && s.status === 'open')
    if (existing) return [d, existing.id]
    const id = uid('sel')
    const created: Selection = {
      id, organizationId: orgId, status: 'open', items: [], updatedAt: new Date().toISOString(),
    }
    return [{ ...d, selections: [created, ...d.selections] }, id]
  }

  const addItem = (productId: string) => {
    if (!org) return
    const firstAdd = !selection || selection.items.length === 0
    update((d) => {
      const [d2, selId] = ensureSelection(d, org.id)
      return {
        ...d2,
        selections: d2.selections.map((s) => {
          if (s.id !== selId) return s
          if (s.items.some((i) => i.productId === productId)) return s
          const item: SelectionItem = {
            id: uid('item'), productId, variantId: null,
            sizeNotes: '', colorNotes: '', indicativeQty: 1, buyerNotes: '',
          }
          return { ...s, items: [...s.items, item], updatedAt: new Date().toISOString() }
        }),
      }
    })
    logActivity({ type: firstAdd ? 'selection_started' : 'selection_updated', organizationId: org.id, refId: productId, detail: '' })
    if (firstAdd && ['acces_approuve', 'showroom_consulte'].includes(org.pipelineStatus)) {
      setPipeline(org.id, 'selection_commencee')
    }
  }

  const updateItem = (itemId: string, patch: Partial<SelectionItem>) => {
    if (!selection) return
    update((d) => ({
      ...d,
      selections: d.selections.map((s) =>
        s.id === selection.id
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)), updatedAt: new Date().toISOString() }
          : s,
      ),
    }))
  }

  const removeItem = (itemId: string) => {
    if (!selection) return
    update((d) => ({
      ...d,
      selections: d.selections.map((s) =>
        s.id === selection.id
          ? { ...s, items: s.items.filter((i) => i.id !== itemId), updatedAt: new Date().toISOString() }
          : s,
      ),
    }))
  }

  const isSelected = (productId: string) => selection?.items.some((i) => i.productId === productId) ?? false

  return { org, selection, addItem, updateItem, removeItem, isSelected }
}
