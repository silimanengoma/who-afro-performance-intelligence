/* Demande d'accès professionnel — étape 4 du parcours principal.
 * Crée une access_request + un prospect (statut Accès demandé) + notification admin simulée. */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { uid, useStore } from '../../data/store'
import { Button, FieldWrap, NextStep, SectionTitle, Select, TextArea, TextInput } from '../../components/ui'
import { partnershipModels } from '../../content/partnership'
import type { PartnershipModelCode } from '../../data/types'

const initial = {
  legalName: '', tradeName: '', shopType: '', contactName: '', email: '', whatsapp: '',
  city: '', country: '', website: '', instagram: '', targetClientele: '', priceRange: '',
  brandsCarried: '', message: '',
}

export function AccesProfessionnel() {
  const { t, lx } = useI18n()
  const { update, logActivity, notify } = useStore()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ ...initial })
  const [model, setModel] = useState<string>(params.get('modele') ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    for (const k of ['legalName', 'contactName', 'city', 'country', 'shopType'] as const) {
      if (!form[k].trim()) errs[k] = t('common.required')
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = t('common.invalidEmail')
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const id = uid('req')
    update((d) => ({
      ...d,
      accessRequests: [
        {
          id, ...form,
          preferredModel: (model || null) as PartnershipModelCode | null,
          status: 'pending', decidedAt: null, rejectionReason: '',
          createdAt: new Date().toISOString(),
        },
        ...d.accessRequests,
      ],
    }))
    logActivity({ type: 'access_requested', organizationId: null, refId: id, detail: form.tradeName || form.legalName })
    notify({
      audience: 'admin', organizationId: null, templateCode: 'access_requested',
      title: { fr: "Nouvelle demande d'accès professionnel", en: 'New professional access request' },
      body: { fr: `${form.tradeName || form.legalName} (${form.city}, ${form.country})`, en: `${form.tradeName || form.legalName} (${form.city}, ${form.country})` },
    })
    setSent(true)
    window.scrollTo({ top: 0 })
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 md:px-8">
        <h1 className="font-editorial text-3xl text-nuit">{t('form.accessSent')}</h1>
        <div className="mt-8">
          <NextStep>
            {lx({
              fr: 'La maison examine votre candidature. Vous recevrez vos accès une fois la demande approuvée.',
              en: 'The house is reviewing your application. You will receive your access once approved.',
            })}
          </NextStep>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-8">
      <SectionTitle
        overline={t('nav.access')}
        title={lx({ fr: 'Demander un accès professionnel', en: 'Request professional access' })}
        lead={lx({
          fr: 'Réservé aux boutiques, concept stores, distributeurs et personal shoppers. La maison valide chaque demande individuellement.',
          en: 'Reserved for boutiques, concept stores, distributors and personal shoppers. The house reviews every request individually.',
        })}
      />
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrap htmlFor="legalName" label={t('form.legalName')} required error={errors.legalName}>
            <TextInput id="legalName" value={form.legalName} onChange={set('legalName')} autoComplete="organization" />
          </FieldWrap>
          <FieldWrap htmlFor="tradeName" label={t('form.tradeName')}>
            <TextInput id="tradeName" value={form.tradeName} onChange={set('tradeName')} />
          </FieldWrap>
          <FieldWrap htmlFor="shopType" label={t('form.shopType')} required error={errors.shopType}>
            <TextInput id="shopType" value={form.shopType} onChange={set('shopType')} placeholder={lx({ fr: 'Boutique, concept store, distributeur…', en: 'Boutique, concept store, distributor…' })} />
          </FieldWrap>
          <FieldWrap htmlFor="contactName" label={t('form.contactName')} required error={errors.contactName}>
            <TextInput id="contactName" value={form.contactName} onChange={set('contactName')} autoComplete="name" />
          </FieldWrap>
          <FieldWrap htmlFor="email" label={t('auth.email')} required error={errors.email}>
            <TextInput id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          </FieldWrap>
          <FieldWrap htmlFor="whatsapp" label={t('form.whatsapp')}>
            <TextInput id="whatsapp" value={form.whatsapp} onChange={set('whatsapp')} autoComplete="tel" />
          </FieldWrap>
          <FieldWrap htmlFor="city" label={t('form.city')} required error={errors.city}>
            <TextInput id="city" value={form.city} onChange={set('city')} />
          </FieldWrap>
          <FieldWrap htmlFor="country" label={t('form.country')} required error={errors.country}>
            <TextInput id="country" value={form.country} onChange={set('country')} />
          </FieldWrap>
          <FieldWrap htmlFor="website" label={t('form.website')}>
            <TextInput id="website" value={form.website} onChange={set('website')} />
          </FieldWrap>
          <FieldWrap htmlFor="instagram" label={t('form.instagram')}>
            <TextInput id="instagram" value={form.instagram} onChange={set('instagram')} />
          </FieldWrap>
          <FieldWrap htmlFor="clientele" label={t('form.clientele')}>
            <TextInput id="clientele" value={form.targetClientele} onChange={set('targetClientele')} />
          </FieldWrap>
          <FieldWrap htmlFor="priceRange" label={t('form.priceRange')}>
            <TextInput id="priceRange" value={form.priceRange} onChange={set('priceRange')} />
          </FieldWrap>
        </div>
        <FieldWrap htmlFor="brands" label={t('form.brands')}>
          <TextInput id="brands" value={form.brandsCarried} onChange={set('brandsCarried')} />
        </FieldWrap>
        <FieldWrap htmlFor="model" label={t('form.preferredModel')}>
          <Select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="">—</option>
            {partnershipModels.map((m) => (
              <option key={m.code} value={m.code}>{lx(m.name)}</option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="message" label={t('form.message')}>
          <TextArea id="message" value={form.message} onChange={set('message')} />
        </FieldWrap>
        <Button type="submit">{t('form.submitAccess')}</Button>
      </form>
    </div>
  )
}
