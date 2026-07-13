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
import { AdminLayout } from './components/layout/AdminLayout'
import { Overview } from './pages/admin/Overview'
import { ProductsAdmin, ProductEdit } from './pages/admin/Products'
import { PricesAdmin } from './pages/admin/Prices'
import { TermsAdmin } from './pages/admin/Terms'
import { AccessRequests } from './pages/admin/AccessRequests'
import { Prospects, ProspectDetail } from './pages/admin/Prospects'
import { QuotesAdmin, QuoteAdminDetail } from './pages/admin/QuotesAdmin'
import { StatsAdmin } from './pages/admin/Stats'
import { SettingsAdmin } from './pages/admin/Settings'
import {
  AuditAdmin, CapsulesAdmin, ContentsAdmin, DocumentsAdmin, MediaAdmin,
  NotificationsAdmin, OrdersAdmin, SelectionsAdmin, UsersAdmin,
} from './pages/admin/misc'

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
        <Route
          path="admin"
          element={
            <RequireRole roles={['sales_admin', 'content_admin', 'super_admin']}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<Overview />} />
          <Route path="produits" element={<ProductsAdmin />} />
          <Route path="produits/:id" element={<ProductEdit />} />
          <Route path="collections" element={<CapsulesAdmin />} />
          <Route path="capsules" element={<CapsulesAdmin />} />
          <Route path="medias" element={<MediaAdmin />} />
          <Route path="prix" element={<PricesAdmin />} />
          <Route path="conditions" element={<TermsAdmin />} />
          <Route path="demandes-acces" element={<AccessRequests />} />
          <Route path="prospects" element={<Prospects />} />
          <Route path="prospects/:id" element={<ProspectDetail />} />
          <Route path="partenaires" element={<Prospects />} />
          <Route path="selections" element={<SelectionsAdmin />} />
          <Route path="devis" element={<QuotesAdmin />} />
          <Route path="devis/:id" element={<QuoteAdminDetail />} />
          <Route path="commandes" element={<OrdersAdmin />} />
          <Route path="documents" element={<DocumentsAdmin />} />
          <Route path="contrats" element={<DocumentsAdmin />} />
          <Route path="contenus" element={<ContentsAdmin />} />
          <Route path="utilisateurs" element={<UsersAdmin />} />
          <Route path="statistiques" element={<StatsAdmin />} />
          <Route path="parametres" element={<SettingsAdmin />} />
          <Route path="audit" element={<AuditAdmin />} />
          <Route path="notifications" element={<NotificationsAdmin />} />
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
