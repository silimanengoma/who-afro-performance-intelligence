import { useState } from 'react'
import { useI18n } from '../../i18n'
import { uid, useStore } from '../../data/store'
import { Button, FieldWrap, NextStep, SectionTitle, Select, TextArea, TextInput } from '../../components/ui'

export function RendezVous() {
  const { t, lx } = useI18n()
  const { update, logActivity, notify } = useStore()
  const [form, setForm] = useState({ name: '', organization: '', email: '', whatsapp: '', channel: 'visio', slots: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = t('common.required')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = t('common.invalidEmail')
    if (!form.slots.trim()) errs.slots = t('common.required')
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const id = uid('apt')
    update((d) => ({
      ...d,
      appointments: [
        { id, ...form, channel: form.channel as 'visio' | 'whatsapp' | 'showroom', status: 'pending', createdAt: new Date().toISOString() },
        ...d.appointments,
      ],
    }))
    logActivity({ type: 'appointment_requested', organizationId: null, refId: id, detail: form.organization || form.name })
    notify({
      audience: 'admin', organizationId: null, templateCode: 'appointment_requested',
      title: { fr: 'Nouvelle demande de rendez-vous', en: 'New appointment request' },
      body: { fr: `${form.name} — ${form.slots}`, en: `${form.name} — ${form.slots}` },
    })
    setSent(true)
    window.scrollTo({ top: 0 })
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 md:px-8">
        <h1 className="font-editorial text-3xl text-nuit">{t('form.appointmentSent')}</h1>
        <div className="mt-8">
          <NextStep>
            {lx({ fr: 'La maison vous confirmera le créneau par e-mail ou WhatsApp.', en: 'The house will confirm the slot by email or WhatsApp.' })}
          </NextStep>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-8">
      <SectionTitle
        overline={t('nav.appointment')}
        title={lx({ fr: 'Prendre rendez-vous avec la maison', en: 'Book an appointment with the house' })}
        lead={lx({
          fr: 'Présentation de la collection en visioconférence, sur WhatsApp ou au showroom de Brazzaville.',
          en: 'Collection presentation by video call, on WhatsApp, or at the Brazzaville showroom.',
        })}
      />
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrap htmlFor="name" label={t('form.contactName')} required error={errors.name}>
            <TextInput id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </FieldWrap>
          <FieldWrap htmlFor="organization" label={t('form.tradeName')}>
            <TextInput id="organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          </FieldWrap>
          <FieldWrap htmlFor="email" label={t('auth.email')} required error={errors.email}>
            <TextInput id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FieldWrap>
          <FieldWrap htmlFor="whatsapp" label={t('form.whatsapp')}>
            <TextInput id="whatsapp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </FieldWrap>
          <FieldWrap htmlFor="channel" label={t('form.channel')}>
            <Select id="channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="visio">{t('form.channel.visio')}</option>
              <option value="whatsapp">{t('form.channel.whatsapp')}</option>
              <option value="showroom">{t('form.channel.showroom')}</option>
            </Select>
          </FieldWrap>
          <FieldWrap htmlFor="slots" label={t('form.slots')} required error={errors.slots} hint={lx({ fr: 'Ex. : mardi ou jeudi, fin de matinée', en: 'E.g.: Tuesday or Thursday, late morning' })}>
            <TextInput id="slots" value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} />
          </FieldWrap>
        </div>
        <FieldWrap htmlFor="message" label={t('form.message')}>
          <TextArea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </FieldWrap>
        <Button type="submit">{t('form.submitAppointment')}</Button>
      </form>
    </div>
  )
}
