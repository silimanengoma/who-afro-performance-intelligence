/* Client Supabase — actif uniquement quand VITE_DATA_MODE=supabase
 * et que les variables d'environnement sont renseignées. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseMode: boolean =
  import.meta.env.VITE_DATA_MODE === 'supabase' && Boolean(url) && Boolean(anonKey)

export const supabase: SupabaseClient | null = supabaseMode ? createClient(url!, anonKey!) : null

export function storagePublicUrl(storagePath: string): string {
  return `${url}/storage/v1/object/public/${storagePath}`
}
