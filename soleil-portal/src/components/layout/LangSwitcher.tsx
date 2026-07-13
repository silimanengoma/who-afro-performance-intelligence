import { useI18n } from '../../i18n'

export function LangSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useI18n()
  const base = 'px-2 py-1 text-xs font-medium tracking-widest transition-colors'
  const active = dark ? 'text-or' : 'text-or-500'
  const idle = dark ? 'text-ivoire/60 hover:text-ivoire' : 'text-brun/60 hover:text-brun'
  return (
    <div role="group" aria-label="Langue / Language" className="flex items-center">
      <button className={`${base} ${lang === 'fr' ? active : idle}`} onClick={() => setLang('fr')} aria-pressed={lang === 'fr'}>
        FR
      </button>
      <span className={dark ? 'text-ivoire/30' : 'text-brun/30'} aria-hidden>·</span>
      <button className={`${base} ${lang === 'en' ? active : idle}`} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>
        EN
      </button>
    </div>
  )
}
