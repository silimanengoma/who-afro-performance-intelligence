/* Demande de devis — alimentée automatiquement par « Ma sélection »
 * + choix du modèle de partenariat (étapes 12-13 du parcours). */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { nextQuoteNumber, uid, useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { Button, EmptyState, FieldWrap, LinkButton, Select, TextArea } from '../../components/ui'
import { partnershipModels } from '../../content/partnership'
import type { PartnershipModelCode, Quote } from '../../data/types'

export function QuoteNew() {
  const { t, lx } = useI18n()
  const { db, update, logActivity, notify, setPipeline } = useStore()
  const { org, selection } = useBuyer()
  const navigate = useNavigate()
  const [model, setModel] = useState<PartnershipModelCode>(org?.preferredModel ?? 'gros')
  const [message, setMessage] = useState('')

  const items = selection?.items ?? []
  if (!org || items.length === 0) {
    return (
      <div>
        <h1 className="mb-8 font-editorial text-3xl text-nuit">{t('quote.title')}</h1>
        <EmptyState
          title={lx({ fr: 'Aucune sélection à chiffrer', en: 'No selection to price' })}
          body={t('selection.empty')}
          action={<LinkButton to="/espace-pro/showroom">{t('selection.emptyCta')}</LinkButton>}
        />
      </div>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const quote: Quote = {
      id: uid('quo'),
      number: nextQuoteNumber(db),
      organizationId: org.id,
      selectionId: selection!.id,
      partnershipModel: model,
      currency: db.settings.currency,
      items: items.map((i) => {
        const p = db.products.find((x) => x.id === i.productId)
        const variantBits = [i.colorNotes, i.sizeNotes].filter(Boolean).join(' / ')
        return {
          id: uid('qi'),
          productId: i.productId,
          variantLabel: variantBits || (p ? t('common.tbc') : ''),
          qty: i.indicativeQty,
          unitPrice: null,
        }
      }),
      shippingNote: '', leadTimeNote: '', validUntil: null,
      status: 'sent',
      buyerMessage: message, buyerComment: '', adminNotes: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    update((d) => ({
      ...d,
      quotes: [quote, ...d.quotes],
      selections: d.selections.map((s) => (s.id === selection!.id ? { ...s, status: 'quoted' as const } : s)),
    }))
    logActivity({ type: 'quote_requested', organizationId: org.id, refId: quote.id, detail: quote.number })
    notify({
      audience: 'admin', organizationId: org.id, templateCode: 'quote_requested',
      title: { fr: 'Nouvelle demande de devis', en: 'New quote request' },
      body: { fr: `${org.tradeName} — ${quote.number} (${items.length} pièces)`, en: `${org.tradeName} — ${quote.number} (${items.length} pieces)` },
    })
    setPipeline(org.id, 'devis_demande')
    navigate(`/espace-pro/devis/${quote.id}`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-editorial text-3xl text-nuit">{t('quote.title')}</h1>
      <p className="mt-2 text-sm text-brun">
        {lx({
          fr: `Votre demande porte sur ${items.length} pièce(s) de votre sélection. La maison précisera prix, quantités, transport et délais.`,
          en: `Your request covers ${items.length} piece(s) from your selection. The house will confirm prices, quantities, shipping and lead times.`,
        })}
      </p>

      <ul className="mt-6 divide-y divide-sable/60 border border-sable bg-white text-sm">
        {items.map((i) => {
          const p = db.products.find((x) => x.id === i.productId)
          return (
            <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span>{p?.reference} — {p ? lx(p.name) : ''}</span>
              <span className="text-brun/70">× {i.indicativeQty}</span>
            </li>
          )
        })}
      </ul>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <FieldWrap htmlFor="model" label={t('quote.model')} required>
          <Select id="model" value={model} onChange={(e) => setModel(e.target.value as PartnershipModelCode)}>
            {partnershipModels.filter((m) => m.enabled).map((m) => (
              <option key={m.code} value={m.code}>{lx(m.name)}</option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="message" label={t('quote.message')}>
          <TextArea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
        </FieldWrap>
        <Button type="submit">{t('quote.submit')}</Button>
      </form>
    </div>
  )
}
