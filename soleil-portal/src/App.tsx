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
import { RequireRole } from './auth/guards'
import { BuyerLayout } from './components/layout/BuyerLayout'
import { BuyerDashboard } from './pages/buyer/Dashboard'
import { Showroom } from './pages/buyer/Showroom'
import { ProductDetail } from './pages/buyer/ProductDetail'
import { Selection } from './pages/buyer/Selection'
import { LineSheet } from './pages/buyer/LineSheet'
import { QuoteNew } from './pages/buyer/QuoteNew'
import { Quotes, QuoteDetail } from './pages/buyer/Quotes'
import { Orders } from './pages/buyer/Orders'
import { Partnership } from './pages/buyer/Partnership'
import { Documents } from './pages/buyer/Documents'
import { OrganizationPage } from './pages/buyer/Organization'
import { Support } from './pages/buyer/Support'

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="espace-pro"
          element={
            <RequireRole roles={['buyer']}>
              <BuyerLayout />
            </RequireRole>
          }
        >
          <Route index element={<BuyerDashboard />} />
          <Route path="showroom" element={<Showroom />} />
          <Route path="produit/:ref" element={<ProductDetail />} />
          <Route path="selection" element={<Selection />} />
          <Route path="line-sheet" element={<LineSheet />} />
          <Route path="devis/nouveau" element={<QuoteNew />} />
          <Route path="devis" element={<Quotes />} />
          <Route path="devis/:id" element={<QuoteDetail />} />
          <Route path="commandes" element={<Orders />} />
          <Route path="partenariat" element={<Partnership />} />
          <Route path="documents" element={<Documents />} />
          <Route path="organisation" element={<OrganizationPage />} />
          <Route path="support" element={<Support />} />
        </Route>
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
