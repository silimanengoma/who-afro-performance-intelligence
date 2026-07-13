import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { Home } from './pages/public/Home'
import { Maison } from './pages/public/Maison'
import { Lookbook } from './pages/public/Lookbook'
import { Capsules, CapsuleDetail } from './pages/public/Capsules'
import { Signatures } from './pages/public/Signatures'
import { DevenirPartenaire } from './pages/public/DevenirPartenaire'
import { AccesProfessionnel } from './pages/public/AccesProfessionnel'
import { RendezVous } from './pages/public/RendezVous'
import { Contact } from './pages/public/Contact'
import { PersonalLink } from './pages/public/PersonalLink'
import { Login } from './pages/system/Login'
import { Signup } from './pages/system/Signup'
import { ForgotPassword } from './pages/system/ForgotPassword'
import { Forbidden, ErrorPage, Maintenance } from './pages/system/states'
import { Expired } from './pages/system/Expired'
import { NotFound } from './pages/system/NotFound'
import { ScrollToTop } from './components/ScrollToTop'

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="maison" element={<Maison />} />
          <Route path="lookbook" element={<Lookbook />} />
          <Route path="capsules" element={<Capsules />} />
          <Route path="capsules/:slug" element={<CapsuleDetail />} />
          <Route path="signatures" element={<Signatures />} />
          <Route path="devenir-partenaire" element={<DevenirPartenaire />} />
          <Route path="acces-professionnel" element={<AccesProfessionnel />} />
          <Route path="rendez-vous" element={<RendezVous />} />
          <Route path="contact" element={<Contact />} />
          <Route path="l/:token" element={<PersonalLink />} />
          <Route path="connexion" element={<Login />} />
          <Route path="inscription" element={<Signup />} />
          <Route path="mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="acces-refuse" element={<Forbidden />} />
          <Route path="lien-expire" element={<Expired />} />
          <Route path="erreur" element={<ErrorPage />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
