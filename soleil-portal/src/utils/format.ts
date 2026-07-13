import type { Locale } from '../data/types'

export function formatMoney(value: number | null, currency: string, lang: Locale): string | null {
  if (value == null) return null
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'XAF' ? 0 : 2,
  }).format(value)
}

export function formatDate(iso: string | null | undefined, lang: Locale): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(iso: string | null | undefined, lang: Locale): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatPercent(value: number | null, lang: Locale): string | null {
  if (value == null) return null
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 1 }).format(value) + ' %'
}
