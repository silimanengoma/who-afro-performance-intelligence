/* Conditions commerciales administrables — alimentent le Line Sheet et les documents. */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Button, FieldWrap, SectionTitle, Select, TextInput } from '../../components/ui'
import type { BrandSettings, Localized } from '../../data/types'

type LocKeys = 'paymentTerms' | 'deliveryTerms' | 'returnPolicy' | 'exclusivityTerms' | 'customsNote' | 'claimsPolicy' | 'restockPolicy'
type StrKeys = 'priceValidity' | 'globalMinimum' | 'productionLeadTime' | 'productionCapacity'

const locFields: { key: LocKeys; label: string }[] = [
  { key: 'paymentTerms', label: 'linesheet.payment' },
  { key: 'deliveryTerms', label: 'linesheet.shipping' },
  { key: 'customsNote', label: 'linesheet.customs' },
  { key: 'returnPolicy', label: 'linesheet.returns' },
  { key: 'claimsPolicy', label: 'linesheet.claims' },
  { key: 'restockPolicy', label: 'linesheet.restock' },
  { key: 'exclusivityTerms', label: 'linesheet.exclusivity' },
]

const strFields: { key: StrKeys; label: string }[] = [
  { key: 'priceValidity', label: 'linesheet.validity' },
  { key: 'globalMinimum', label: 'linesheet.globalMin' },
  { key: 'productionLeadTime', label: 'linesheet.leadTimes' },
  { key: 'productionCapacity', label: 'linesheet.production' },
]

export function TermsAdmin() {
  const { t, lx } = useI18n()
  const { db, update, audit } = useStore()
  const { user } = useAuth()
  const [draft, setDraft] = useState<Partial<BrandSettings>>({})
  const [saved, setSaved] = useState(false)
  const v = { ...db.settings, ...draft }

  const save = () => {
    update((d) => ({ ...d, settings: { ...d.settings, ...draft } }))
    audit(user?.email ?? '', 'commercial_terms_updated', 'brand_settings', 'terms')
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const setLoc = (key: LocKeys, locale: 'fr' | 'en', value: string) =>
    setDraft((d) => ({ ...d, [key]: { ...((d[key] as Localized | undefined) ?? db.settings[key]), [locale]: value } }))

  return (
    <div className="max-w-3xl">
      <SectionTitle
        overline={t('admin.terms')}
        title={lx({ fr: 'Synthèse commerciale du Line Sheet', en: 'Line Sheet commercial summary' })}
        lead={lx({
          fr: 'Ces valeurs alimentent le Line Sheet et les documents du pack. Laissez « à confirmer » tant que la donnée n’est pas validée.',
          en: 'These values feed the Line Sheet and the pack documents. Keep “to be confirmed” until the data is validated.',
        })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWrap htmlFor="currency" label={t('linesheet.currency')}>
          <Select id="currency" value={v.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value as BrandSettings['currency'] }))}>
            <option>XAF</option><option>EUR</option><option>USD</option>
          </Select>
        </FieldWrap>
        {strFields.map(({ key, label }) => (
          <FieldWrap key={key} htmlFor={key} label={t(label)}>
            <TextInput id={key} value={v[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} />
          </FieldWrap>
        ))}
        {locFields.map(({ key, label }) => (
          <div key={key} className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            <FieldWrap htmlFor={`${key}-fr`} label={`${t(label)} (FR)`}>
              <TextInput id={`${key}-fr`} value={(v[key] as Localized).fr} onChange={(e) => setLoc(key, 'fr', e.target.value)} />
            </FieldWrap>
            <FieldWrap htmlFor={`${key}-en`} label={`${t(label)} (EN)`}>
              <TextInput id={`${key}-en`} value={(v[key] as Localized).en} onChange={(e) => setLoc(key, 'en', e.target.value)} />
            </FieldWrap>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>{t('common.save')}</Button>
        {saved && <span className="text-sm text-succes">✓</span>}
      </div>
    </div>
  )
}
