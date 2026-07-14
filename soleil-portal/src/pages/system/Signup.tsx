/* Création de compte professionnel : dans le prototype, cette page renvoie vers
 * la demande d'accès (le compte est créé par la maison à l'approbation, comme
 * dans le flux de production avec invitation Supabase Auth). */
import { useI18n } from '../../i18n'
import { LinkButton, SectionTitle } from '../../components/ui'

export function Signup() {
  const { t, lx } = useI18n()
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 md:px-8">
      <SectionTitle
        overline={t('auth.signup')}
        title={lx({ fr: 'Les comptes professionnels sont créés sur validation', en: 'Professional accounts are created upon approval' })}
        lead={lx({
          fr: 'Pour protéger les conditions commerciales de la maison, chaque compte est ouvert après examen de la candidature. Déposez votre demande : vous recevrez vos identifiants dès l’approbation.',
          en: 'To protect the house’s trade terms, every account is opened after review. Submit your request: you will receive your credentials upon approval.',
        })}
      />
      <div className="flex flex-wrap gap-3">
        <LinkButton to="/acces-professionnel">{t('nav.access')}</LinkButton>
        <LinkButton to="/connexion" variant="secondary">{t('auth.login')}</LinkButton>
      </div>
    </div>
  )
}
