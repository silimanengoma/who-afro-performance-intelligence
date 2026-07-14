/* « Ma sélection » — jamais « panier ». Prépare la demande de devis. */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { useBuyer } from '../../data/useBuyer'
import { ProductImage } from '../../components/ProductImage'
import { Button, EmptyState, FieldWrap, LinkButton, NextStep, TextArea, TextInput } from '../../components/ui'

export function Selection() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const { selection, updateItem, removeItem } = useBuyer()
  const items = selection?.items ?? []

  if (items.length === 0) {
    return (
      <div>
        <h1 className="mb-8 font-editorial text-3xl text-nuit">{t('selection.title')}</h1>
        <EmptyState
          title={lx({ fr: 'Votre sélection est vide', en: 'Your selection is empty' })}
          body={t('selection.empty')}
          action={<LinkButton to="/espace-pro/showroom">{t('selection.emptyCta')}</LinkButton>}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-editorial text-3xl text-nuit">{t('selection.title')}</h1>
          <p className="mt-1 text-sm text-brun">
            {t('selection.itemCount', { n: items.length })} · {t('selection.saved')}
          </p>
        </div>
        <p className="max-w-sm text-xs italic text-brun/70">{t('selection.notAnOrder')}</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const product = db.products.find((p) => p.id === item.productId)
          if (!product) return null
          return (
            <article key={item.id} className="grid gap-4 border border-sable bg-white p-4 sm:grid-cols-[100px_1fr]">
              <Link to={`/espace-pro/produit/${product.reference}`}>
                <ProductImage media={product.media[0]} reference={product.reference} />
              </Link>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link to={`/espace-pro/produit/${product.reference}`} className="font-editorial text-xl text-nuit hover:text-or-500">
                      {lx(product.name)}
                    </Link>
                    <p className="text-xs uppercase tracking-wider text-brun/60">{product.reference}</p>
                  </div>
                  <Button variant="ghost" className="!min-h-8 text-xs text-erreur" onClick={() => removeItem(item.id)}>
                    {t('selection.remove')}
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <FieldWrap htmlFor={`size-${item.id}`} label={t('selection.sizeNotes')}>
                    <TextInput
                      id={`size-${item.id}`}
                      value={item.sizeNotes}
                      placeholder={t('common.tbc')}
                      onChange={(e) => updateItem(item.id, { sizeNotes: e.target.value })}
                    />
                  </FieldWrap>
                  <FieldWrap htmlFor={`color-${item.id}`} label={t('selection.colorNotes')}>
                    <TextInput
                      id={`color-${item.id}`}
                      value={item.colorNotes}
                      placeholder={t('common.tbc')}
                      onChange={(e) => updateItem(item.id, { colorNotes: e.target.value })}
                    />
                  </FieldWrap>
                  <FieldWrap htmlFor={`qty-${item.id}`} label={t('selection.qty')}>
                    <TextInput
                      id={`qty-${item.id}`}
                      type="number"
                      min={1}
                      value={item.indicativeQty}
                      onChange={(e) => updateItem(item.id, { indicativeQty: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </FieldWrap>
                </div>
                <div className="mt-3">
                  <FieldWrap htmlFor={`notes-${item.id}`} label={t('selection.notes')} hint={t('selection.notesHint')}>
                    <TextArea
                      id={`notes-${item.id}`}
                      rows={2}
                      value={item.buyerNotes}
                      onChange={(e) => updateItem(item.id, { buyerNotes: e.target.value })}
                    />
                  </FieldWrap>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-8">
        <NextStep
          action={
            <div className="flex flex-wrap gap-2">
              <LinkButton to="/espace-pro/line-sheet?selection=1" variant="secondary">{t('selection.toLinesheet')}</LinkButton>
              <LinkButton to="/espace-pro/devis/nouveau" variant="gold">{t('selection.toQuote')}</LinkButton>
            </div>
          }
        >
          {lx({
            fr: 'Consultez le Line Sheet de votre sélection, puis transmettez votre demande de devis.',
            en: 'Review the Line Sheet for your selection, then submit your quote request.',
          })}
        </NextStep>
      </div>
    </div>
  )
}
