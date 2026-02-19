import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { SelectRolePage } from "./pages/auth/SelectRolePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { BusinessDashboardPlaceholder } from "./pages/dashboard/BusinessDashboardPlaceholder";
import { ProviderDashboardPlaceholder } from "./pages/dashboard/ProviderDashboardPlaceholder";

export function Router() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/auth/select-role" element={<SelectRolePage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/business/dashboard"
        element={<DashboardLayout type="business" />}
      >
        <Route index element={<BusinessDashboardPlaceholder />} />
      </Route>
      <Route
        path="/provider/dashboard"
        element={<DashboardLayout type="provider" />}
      >
        <Route index element={<ProviderDashboardPlaceholder />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
