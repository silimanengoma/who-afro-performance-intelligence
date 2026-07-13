/* Bilinguisme FR/EN — sélecteur persistant, <html lang> synchronisé.
 * Deux mécanismes :
 *  - t('clé') pour la chrome d'interface (dictionnaires fr.ts / en.ts) ;
 *  - lx(objet Localized) pour les contenus éditoriaux structurés.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale, Localized } from '../data/types'
import { fr } from './fr'
import { en } from './en'

const LANG_KEY = 'soleil-portal-lang'
const dictionaries: Record<Locale, Record<string, string>> = { fr, en }

interface I18nValue {
  lang: Locale
  setLang: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  lx: (value: Localized | null | undefined, fallback?: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(() => {
    const saved = localStorage.getItem(LANG_KEY)
    return saved === 'en' ? 'en' : 'fr'
  })

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[lang]
    const t = (key: string, params?: Record<string, string | number>) => {
      let s = dict[key] ?? dictionaries.fr[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v))
      }
      return s
    }
    const lx = (v: Localized | null | undefined, fallback?: string) =>
      v ? v[lang] || v.fr : (fallback ?? t('common.tbc'))
    return { lang, setLang: setLangState, t, lx }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n doit être utilisé sous <I18nProvider>')
  return ctx
}
