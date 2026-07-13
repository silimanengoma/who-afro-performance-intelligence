import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

/* ---- Boutons ---- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-nuit text-ivoire hover:bg-nuit-700',
  secondary: 'border border-brun text-brun hover:bg-sable-100',
  ghost: 'text-brun hover:bg-sable-100',
  gold: 'border border-or text-or-500 hover:bg-or hover:text-ivoire',
  danger: 'border border-erreur text-erreur hover:bg-erreur hover:text-ivoire',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export function LinkButton({ to, variant = 'primary', className = '', children }: { to: string; variant?: ButtonVariant; className?: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2 text-sm font-medium tracking-wide transition-colors ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}

/* ---- Titres de section ---- */

export function SectionTitle({ overline, title, lead }: { overline?: string; title: string; lead?: string }) {
  return (
    <header className="mb-8 max-w-2xl">
      {overline && <p className="surtitre mb-2">{overline}</p>}
      <h2 className="text-3xl leading-tight text-nuit md:text-4xl">{title}</h2>
      {lead && <p className="mt-3 leading-relaxed text-brun">{lead}</p>}
    </header>
  )
}

/* ---- Badges de statut ---- */

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'gold'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-sable-100 text-brun',
    success: 'bg-succes/10 text-succes',
    warning: 'bg-alerte/10 text-alerte',
    danger: 'bg-erreur/10 text-erreur',
    gold: 'bg-or/15 text-or-500',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {children}
    </span>
  )
}

/* ---- Valeur « à confirmer » ---- */

export function Tbc({ value }: { value?: string | number | null }) {
  const { t } = useI18n()
  if (value != null && value !== '') return <>{value}</>
  return <span className="italic text-brun/70">{t('common.tbc')}</span>
}

/* ---- Bandeau « Prochaine étape » ---- */

export function NextStep({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="no-print flex flex-col gap-3 border-l-2 border-or bg-sable-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="surtitre">{t('common.next')}</p>
        <p className="mt-1 text-sm text-encre">{children}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ---- État vide ---- */

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-sable px-6 py-16 text-center">
      <p className="font-editorial text-4xl text-sable">SC</p>
      <p className="text-lg text-nuit">{title}</p>
      {body && <p className="max-w-md text-sm leading-relaxed text-brun">{body}</p>}
      {action}
    </div>
  )
}

/* ---- Champs de formulaire ---- */

interface FieldWrapProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  htmlFor: string
}

export function FieldWrap({ label, hint, error, required, children, htmlFor }: FieldWrapProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-nuit">
        {label} {required && <span className="text-or-500" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-brun/70">{hint}</p>}
      {error && <p className="text-xs text-erreur" role="alert">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full border border-sable bg-white px-3 py-2.5 text-sm text-encre placeholder:text-brun/40 focus:border-or'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

/* ---- Tableau responsive (desktop) / cartes (mobile) ---- */

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-sable">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b border-sable bg-sable-100 text-left">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brun">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sable/60 bg-white">{children}</tbody>
      </table>
    </div>
  )
}

/* ---- Bannière mode démonstration ---- */

export function DemoBanner() {
  const { t } = useI18n()
  return (
    <p className="no-print bg-alerte/10 px-4 py-1.5 text-center text-xs text-alerte">
      {t('common.demoData')}
    </p>
  )
}
