import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './AccessibilityContext';
import { AuthProvider } from './AuthContext';
import { UserRegistryProvider } from './UserRegistryContext';
import { AccessibilityButton } from '../features/accessibility/AccessibilityButton';
import { RegisterPage } from '../features/auth/RegisterPage';
import { LoginPage } from '../features/auth/LoginPage';
import { AccessibilityProfilePage } from '../features/profile/AccessibilityProfilePage';
import { AdminPage } from '../features/admin/AdminPage';
import { RequireAuth } from '../shared/RequireAuth';
import { ShopProvider } from './ShopContext';
import { AppNav } from '../shared/AppNav';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { OrdersPage } from '../features/profile/OrdersPage';
import { ChatPage } from '../features/chat/ChatPage';
import { ProfilePage } from '../features/profile/ProfilePage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <UserRegistryProvider>
          <AuthProvider>
            <ShopProvider>
              <AppNav />
              <AccessibilityButton />
              <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Ruta protegida: solo usuarios autenticados */}
              <Route
                path="/profile/accessibility"
                element={
                  <RequireAuth>
                    <AccessibilityProfilePage />
                  </RequireAuth>
                }
              />

              {/* Ruta del administrador – protección interna en AdminPage */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
              <Route path="/catalog/:kind" element={<RequireAuth><CatalogPage /></RequireAuth>} />
              <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
              <Route path="/orders/:id" element={<RequireAuth><OrdersPage /></RequireAuth>} />
              <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </ShopProvider>
          </AuthProvider>
        </UserRegistryProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
