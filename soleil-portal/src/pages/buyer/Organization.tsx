/* Mon organisation : la boutique voit et complète ses informations.
 * Les notes internes de la maison ne sont jamais exposées ici. */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { Button, FieldWrap, SectionTitle, TextInput } from '../../components/ui'
import type { Organization as Org } from '../../data/types'

const editableFields: { key: keyof Org; label: string }[] = [
  { key: 'legalName', label: 'form.legalName' },
  { key: 'tradeName', label: 'form.tradeName' },
  { key: 'shopType', label: 'form.shopType' },
  { key: 'contactName', label: 'form.contactName' },
  { key: 'address', label: 'form.city' },
  { key: 'city', label: 'form.city' },
  { key: 'country', label: 'form.country' },
  { key: 'email', label: 'auth.email' },
  { key: 'whatsapp', label: 'form.whatsapp' },
  { key: 'website', label: 'form.website' },
  { key: 'instagram', label: 'form.instagram' },
  { key: 'targetClientele', label: 'form.clientele' },
  { key: 'priceRange', label: 'form.priceRange' },
  { key: 'brandsCarried', label: 'form.brands' },
  { key: 'deliveryCountries', label: 'form.country' },
]

export function OrganizationPage() {
  const { t, lx } = useI18n()
  const { update, audit } = useStore()
  const { org } = useBuyer()
  const [draft, setDraft] = useState<Partial<Org>>({})
  const [saved, setSaved] = useState(false)

  if (!org) return null

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    update((d) => ({
      ...d,
      organizations: d.organizations.map((o) => (o.id === org.id ? { ...o, ...draft } : o)),
    }))
    audit(org.email, 'organization_self_update', 'organizations', org.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const labels: Record<string, { fr: string; en: string }> = {
    address: { fr: 'Adresse', en: 'Address' },
    deliveryCountries: { fr: 'Pays de livraison', en: 'Delivery countries' },
  }

  return (
    <div className="max-w-3xl">
      <SectionTitle
        overline={t('buyer.organization')}
        title={org.tradeName || org.legalName}
        lead={lx({
          fr: 'Ces informations aident la maison à préparer devis et expéditions.',
          en: 'This information helps the house prepare quotes and shipments.',
        })}
      />
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        {editableFields.map(({ key, label }) => (
          <FieldWrap
            key={key}
            htmlFor={`org-${key}`}
            label={labels[key] ? lx(labels[key]) : t(label)}
          >
            <TextInput
              id={`org-${key}`}
              value={(draft[key] as string | undefined) ?? (org[key] as string)}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
            />
          </FieldWrap>
        ))}
        <div className="sm:col-span-2">
          <Button type="submit">{t('common.save')}</Button>
          {saved && <span className="ml-3 text-sm text-succes">✓</span>}
        </div>
      </form>
    </div>
  )
}
