/* Grille tarifaire : saisie des prix professionnels et publics conseillés.
 * Marges recalculées à l'affichage — jamais stockées, jamais inventées. */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { marginRate, useStore } from '../../data/store'
import { useAuth } from '../../auth/AuthContext'
import { Button, SectionTitle, Select, TextInput, Tbc } from '../../components/ui'
import { formatPercent } from '../../utils/format'

export function PricesAdmin() {
  const { t, lx, lang } = useI18n()
  const { db, update, audit } = useStore()
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<Record<string, { w?: string; r?: string; c?: string }>>({})
  const [saved, setSaved] = useState(false)

  const save = () => {
    update((d) => ({
      ...d,
      prices: d.prices.map((p) => {
        const dr = drafts[p.id]
        if (!dr) return p
        const num = (s: string | undefined, prev: number | null) => {
          if (s == null || s === '') return s === '' ? null : prev
          const n = Number(s)
          return Number.isFinite(n) && n >= 0 ? n : prev
        }
        return {
          ...p,
          wholesalePrice: num(dr.w, p.wholesalePrice),
          rrp: num(dr.r, p.rrp),
          currency: (dr.c as typeof p.currency) ?? p.currency,
        }
      }),
    }))
    audit(user?.email ?? '', 'prices_updated', 'wholesale_prices', 'bulk')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <SectionTitle
        overline={t('admin.prices')}
        title={lx({ fr: 'Prix professionnels et publics conseillés', en: 'Wholesale and recommended retail prices' })}
        lead={lx({
          fr: 'Aucun prix n’est pré-rempli : la maison confirme chaque valeur. Champs vides = « à confirmer ».',
          en: 'No price is pre-filled: the house confirms every value. Empty fields = “to be confirmed”.',
        })}
      />
      <div className="overflow-x-auto border border-sable bg-white">
        <table className="w-full min-w-140 text-sm">
          <thead>
            <tr className="border-b border-sable bg-sable-100 text-left text-xs uppercase tracking-wider text-brun">
              <th className="px-3 py-2">{t('product.reference')}</th>
              <th className="px-3 py-2">{lang === 'fr' ? 'Nom' : 'Name'}</th>
              <th className="px-3 py-2">{t('linesheet.currency')}</th>
              <th className="px-3 py-2 text-right">{t('product.wholesalePrice')}</th>
              <th className="px-3 py-2 text-right">{t('product.rrp')}</th>
              <th className="px-3 py-2 text-right">{t('product.marginRate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sable/60">
            {db.products.filter((p) => p.status !== 'archived').map((p) => {
              const price = db.prices.find((x) => x.productId === p.id)
              if (!price) return null
              const dr = drafts[price.id] ?? {}
              const preview = {
                ...price,
                wholesalePrice: dr.w !== undefined ? (dr.w === '' ? null : Number(dr.w)) : price.wholesalePrice,
                rrp: dr.r !== undefined ? (dr.r === '' ? null : Number(dr.r)) : price.rrp,
              }
              return (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium text-nuit">{p.reference}</td>
                  <td className="px-3 py-2">{lx(p.name)}</td>
                  <td className="px-3 py-2">
                    <Select
                      aria-label={`${t('linesheet.currency')} ${p.reference}`}
                      value={dr.c ?? price.currency}
                      onChange={(e) => setDrafts((s) => ({ ...s, [price.id]: { ...s[price.id], c: e.target.value } }))}
                      className="!w-24"
                    >
                      <option>XAF</option><option>EUR</option><option>USD</option>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <TextInput
                      aria-label={`${t('product.wholesalePrice')} ${p.reference}`}
                      type="number" min={0} className="!w-32 text-right"
                      value={dr.w ?? (price.wholesalePrice ?? '')}
                      placeholder={t('common.tbc')}
                      onChange={(e) => setDrafts((s) => ({ ...s, [price.id]: { ...s[price.id], w: e.target.value } }))}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <TextInput
                      aria-label={`${t('product.rrp')} ${p.reference}`}
                      type="number" min={0} className="!w-32 text-right"
                      value={dr.r ?? (price.rrp ?? '')}
                      placeholder={t('common.tbc')}
                      onChange={(e) => setDrafts((s) => ({ ...s, [price.id]: { ...s[price.id], r: e.target.value } }))}
                    />
                  </td>
                  <td className="px-3 py-2 text-right"><Tbc value={formatPercent(marginRate(preview), lang)} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save}>{t('common.save')}</Button>
        {saved && <span className="text-sm text-succes">✓</span>}
      </div>
    </div>
  )
}
