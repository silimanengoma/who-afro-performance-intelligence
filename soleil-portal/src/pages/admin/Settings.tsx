/* Paramètres : coordonnées et placeholders centralisés (les 17 du brief),
 * réinitialisation des données de démonstration. */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Button, FieldWrap, SectionTitle, TextInput } from '../../components/ui'
import type { BrandSettings } from '../../data/types'

type StrKeys = 'logoNote' | 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'atelierAddress' | 'defaultMaterials' | 'defaultSizes' | 'productionCapacity' | 'productionLeadTime'

const fields: { key: StrKeys; label: { fr: string; en: string } }[] = [
  { key: 'logoNote', label: { fr: 'Logo officiel (note)', en: 'Official logo (note)' } },
  { key: 'whatsapp', label: { fr: 'WhatsApp professionnel', en: 'Business WhatsApp' } },
  { key: 'email', label: { fr: 'E-mail commercial', en: 'Sales email' } },
  { key: 'instagram', label: { fr: 'Instagram', en: 'Instagram' } },
  { key: 'facebook', label: { fr: 'Facebook', en: 'Facebook' } },
  { key: 'atelierAddress', label: { fr: "Adresse de l'atelier", en: 'Atelier address' } },
  { key: 'defaultMaterials', label: { fr: 'Matières (par défaut)', en: 'Materials (default)' } },
  { key: 'defaultSizes', label: { fr: 'Tailles (par défaut)', en: 'Sizes (default)' } },
  { key: 'productionCapacity', label: { fr: 'Capacité de production', en: 'Production capacity' } },
  { key: 'productionLeadTime', label: { fr: 'Délais de production', en: 'Production lead times' } },
]

export function SettingsAdmin() {
  const { t, lx } = useI18n()
  const { db, update, resetDemo, audit } = useStore()
  const { user } = useAuth()
  const [draft, setDraft] = useState<Partial<BrandSettings>>({})
  const [saved, setSaved] = useState(false)
  const v = { ...db.settings, ...draft }

  const save = () => {
    update((d) => ({ ...d, settings: { ...d.settings, ...draft } }))
    audit(user?.email ?? '', 'brand_settings_updated', 'brand_settings', 'main')
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-3xl">
      <SectionTitle
        overline={t('admin.settings')}
        title={lx({ fr: 'Identité et coordonnées', en: 'Identity and contact details' })}
        lead={lx({
          fr: 'Les placeholders du brief sont centralisés ici : les renseigner met à jour tout le portail (pied de page, contact, documents).',
          en: 'The brief’s placeholders are centralised here: filling them updates the whole portal (footer, contact, documents).',
        })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <FieldWrap key={key} htmlFor={key} label={lx(label)}>
            <TextInput id={key} value={v[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} />
          </FieldWrap>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>{t('common.save')}</Button>
        {saved && <span className="text-sm text-succes">✓</span>}
      </div>

      <section className="mt-12 border border-erreur/30 bg-erreur/5 p-5">
        <h2 className="font-editorial text-xl text-erreur">{lx({ fr: 'Zone sensible', en: 'Sensitive zone' })}</h2>
        <p className="mt-1 text-sm text-brun">
          {lx({
            fr: 'Réinitialise toutes les données de démonstration (produits, prospects, devis, réglages) à leur état initial.',
            en: 'Resets all demo data (products, prospects, quotes, settings) to its initial state.',
          })}
        </p>
        <Button
          variant="danger"
          className="mt-3"
          onClick={() => { if (confirm(t('common.confirmDelete'))) resetDemo() }}
        >
          {lx({ fr: 'Réinitialiser la démonstration', en: 'Reset demo data' })}
        </Button>
      </section>
    </div>
  )
}
