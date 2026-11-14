import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { PublicLayout } from './components/SiteLayout';
import { Loading } from './components/Primitives';
import { HomePage, AboutPage, ShopPage, ProductPage, CartPage, CheckoutPage, ContactPage, NotFoundPage } from './pages/PublicPages';

const AdminGuard = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminGuard })));
const AdminLoginPage = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminLoginPage })));
const AdminLayout = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminLayout })));
const AdminDashboardPage = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminOrdersPage })));
const AdminEnquiriesPage = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminEnquiriesPage })));
const AdminSettingsPage = lazy(() => import('./pages/AdminPages').then((module) => ({ default: module.AdminSettingsPage })));

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <AdminGuard><AdminLayout>{children}</AdminLayout></AdminGuard>;
}

export default function App() {
  return <CartProvider><BrowserRouter><Suspense fallback={<div className="admin-auth-loading"><Loading label="Loading page" /></div>}><Routes>
    <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
    <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
    <Route path="/shop" element={<PublicLayout><ShopPage /></PublicLayout>} />
    <Route path="/products/:id" element={<PublicLayout><ProductPage /></PublicLayout>} />
    <Route path="/cart" element={<PublicLayout><CartPage /></PublicLayout>} />
    <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
    <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
    <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
    <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
    <Route path="/admin/enquiries" element={<AdminRoute><AdminEnquiriesPage /></AdminRoute>} />
    <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
    <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
    <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
  </Routes></Suspense></BrowserRouter></CartProvider>;
}
