import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardLayout } from "./components/DashboardLayout";
import { HeroSection } from "./components/home/HeroSection";
import { TrustSection } from "./components/home/TrustSection";
import { HowItWorksSection } from "./components/home/HowItWorksSection";
import { InfoSection } from "./components/home/InfoSection";
import { useAuth } from "./context/AuthContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { BuyerDashboard } from "./pages/buyer/BuyerDashboard";
import { BuyerBusiness } from "./pages/buyer/BuyerBusiness";
import { Discover } from "./pages/buyer/Discover";
import { ProviderCatalog } from "./pages/buyer/ProviderCatalog";
import { BuyerOrders } from "./pages/buyer/BuyerOrders";
import { BuyerInvoices } from "./pages/buyer/BuyerInvoices";
import { ProviderDashboard } from "./pages/provider/ProviderDashboard";
import { ProviderProfile } from "./pages/provider/ProviderProfile";
import { ProviderProducts } from "./pages/provider/ProviderProducts";
import { ProviderOrders } from "./pages/provider/ProviderOrders";
import { ProviderOrderDetail } from "./pages/provider/ProviderOrderDetail";
import { ProviderInvoices } from "./pages/provider/ProviderInvoices";
import { Settings } from "./pages/Settings";

function RequireAuth({
  children,
  buyer,
  provider,
}: {
  children: React.ReactNode;
  buyer?: boolean;
  provider?: boolean;
}) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  const hasBusiness = user.memberships.some(
    (m: { business_id?: string }) => m.business_id
  );
  const hasProvider = user.memberships.some(
    (m: { provider_id?: string }) => m.provider_id
  );
  if (buyer && !hasBusiness && !loc.pathname.startsWith("/buyer/business"))
    return <Navigate to="/buyer/business" replace />;
  if (provider && !hasProvider && !loc.pathname.startsWith("/provider/profile"))
    return <Navigate to="/provider/profile" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="buyer"
          element={
            <RequireAuth buyer>
              <DashboardLayout type="buyer" />
            </RequireAuth>
          }
        >
          <Route index element={<BuyerDashboard />} />
          <Route path="business" element={<BuyerBusiness />} />
          <Route path="discover" element={<Discover />} />
          <Route path="providers/:providerId" element={<ProviderCatalog />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="invoices" element={<BuyerInvoices />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route
          path="provider"
          element={
            <RequireAuth provider>
              <DashboardLayout type="provider" />
            </RequireAuth>
          }
        >
          <Route index element={<ProviderDashboard />} />
          <Route path="profile" element={<ProviderProfile />} />
          <Route path="products" element={<ProviderProducts />} />
          <Route path="orders" element={<ProviderOrders />} />
          <Route path="orders/:orderId" element={<ProviderOrderDetail />} />
          <Route path="invoices" element={<ProviderInvoices />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Home() {
  const { user, loading, isBuyer, isProvider } = useAuth();
  if (loading)
    return (
      <div className="container" style={{ paddingTop: "1.5rem" }}>
        Loading...
      </div>
    );
  if (user) {
    if (isBuyer) return <Navigate to="/buyer" replace />;
    if (isProvider) return <Navigate to="/provider" replace />;
    return (
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <p>
          You are logged in as {user.email}. Add a business or provider to
          continue.
        </p>
        <p>
          <Link to="/buyer/business">Add business (buyer)</Link> ·{" "}
          <Link to="/provider/profile">Add provider</Link>
        </p>
      </div>
    );
  }
  return (
    <>
      <HeroSection />
      <TrustSection />
      <HowItWorksSection />
      <InfoSection />
    </>
  );
}
