import { useI18n } from '../../i18n'
import { useStore } from '../../data/store'
import { LinkButton, SectionTitle } from '../../components/ui'

export function Contact() {
  const { t, lx } = useI18n()
  const { db } = useStore()
  const s = db.settings

  return (
    <div className="mx-auto max-w-310 px-4 py-16 md:px-8">
      <SectionTitle
        overline={t('nav.contact')}
        title={lx({ fr: 'Contacter la maison', en: 'Contact the house' })}
        lead={lx({
          fr: 'Pour toute demande professionnelle : accès showroom, rendez-vous, presse ou partenariat.',
          en: 'For any professional enquiry: showroom access, appointments, press or partnership.',
        })}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4 border border-sable bg-white p-6 text-sm">
          <p><span className="surtitre mr-2">WhatsApp</span> {s.whatsapp}</p>
          <p><span className="surtitre mr-2">E-mail</span> {s.email}</p>
          <p><span className="surtitre mr-2">Instagram</span> {s.instagram}</p>
          <p><span className="surtitre mr-2">Facebook</span> {s.facebook}</p>
          <p><span className="surtitre mr-2">{lx({ fr: 'Atelier', en: 'Atelier' })}</span> {s.atelierAddress}</p>
          <p className="pt-2 text-xs italic text-brun/70">
            {lx({
              fr: 'Coordonnées définitives en cours de confirmation — gérées dans les paramètres administrables.',
              en: 'Final contact details being confirmed — managed in the admin settings.',
            })}
          </p>
        </div>
        <div className="flex flex-col items-start justify-center gap-4">
          <p className="max-w-md leading-relaxed text-brun">
            {lx({
              fr: 'Vous êtes une boutique ou un distributeur ? Le plus court chemin vers la collection est la demande d’accès professionnel.',
              en: 'A boutique or distributor? The fastest route to the collection is the professional access request.',
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>
            <LinkButton to="/rendez-vous" variant="secondary">{t('nav.appointment')}</LinkButton>
          </div>
        </div>
      </div>
    </div>
  )
}
