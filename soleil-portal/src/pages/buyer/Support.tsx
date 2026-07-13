import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { SectionTitle } from '../../components/ui'

export function Support() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const s = db.settings

  return (
    <div className="max-w-2xl">
      <SectionTitle
        overline={t('buyer.support')}
        title={lx({ fr: 'Besoin d’aide ?', en: 'Need help?' })}
        lead={lx({
          fr: 'La maison répond aux partenaires en priorité par WhatsApp et e-mail.',
          en: 'The house answers partners primarily via WhatsApp and email.',
        })}
      />
      <div className="space-y-4 border border-sable bg-white p-6 text-sm">
        <p><span className="surtitre mr-2">WhatsApp</span> {s.whatsapp}</p>
        <p><span className="surtitre mr-2">E-mail</span> {s.email}</p>
        <p className="text-xs italic text-brun/70">
          {lx({
            fr: 'Coordonnées en cours de confirmation — gérées dans les paramètres administrables.',
            en: 'Contact details being confirmed — managed in admin settings.',
          })}
        </p>
      </div>
      <div className="mt-6 space-y-3 text-sm text-brun">
        <h2 className="font-editorial text-xl text-nuit">{lx({ fr: 'Questions fréquentes', en: 'Frequently asked' })}</h2>
        <details className="border border-sable bg-white p-4">
          <summary className="cursor-pointer font-medium text-nuit">{lx({ fr: 'Ma sélection engage-t-elle une commande ?', en: 'Does my selection commit me to an order?' })}</summary>
          <p className="mt-2">{t('selection.notAnOrder')}</p>
        </details>
        <details className="border border-sable bg-white p-4">
          <summary className="cursor-pointer font-medium text-nuit">{lx({ fr: 'Comment sont fixés les prix ?', en: 'How are prices set?' })}</summary>
          <p className="mt-2">
            {lx({
              fr: 'Les prix professionnels et publics conseillés sont confirmés par la maison dans le devis, avec transport et délais.',
              en: 'Wholesale and recommended retail prices are confirmed by the house in the quote, together with shipping and lead times.',
            })}
          </p>
        </details>
        <details className="border border-sable bg-white p-4">
          <summary className="cursor-pointer font-medium text-nuit">{lx({ fr: 'Puis-je demander un échantillon ?', en: 'Can I request a sample?' })}</summary>
          <p className="mt-2">
            {lx({
              fr: 'Oui, depuis chaque fiche produit. La maison confirme faisabilité et conditions.',
              en: 'Yes, from any product page. The house confirms feasibility and terms.',
            })}
          </p>
        </details>
      </div>
    </div>
  )
}
