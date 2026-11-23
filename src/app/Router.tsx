import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AccessibilityProvider } from './AccessibilityContext';
import { AuthProvider } from './AuthContext';
import { UserRegistryProvider } from './UserRegistryContext';
import { ShopProvider } from './ShopContext';
import { RequireAuth } from '../shared/RequireAuth';
import { AppNav } from '../shared/AppNav';
import { AccessibilityButton } from '../features/accessibility/AccessibilityButton';
import { AssistantWidget } from '../features/chat/AssistantWidget';
import { WelcomePage } from '../features/welcome/WelcomePage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegistrationConfirmationPage, RegisterPage } from '../features/auth/RegisterPage';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { CategoriesPage } from '../features/catalog/CategoriesPage';
import { ProductDetailPage } from '../features/catalog/ProductDetailPage';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { OrdersPage } from '../features/profile/OrdersPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { AccessibilityProfilePage } from '../features/profile/AccessibilityProfilePage';
import { AccessibilityNeedsPage } from '../features/profile/AccessibilityNeedsPage';
import { ChatPage } from '../features/chat/ChatPage';
import { AdminPage } from '../features/admin/AdminPage';

const protectedRoute = (element: React.ReactNode) => <RequireAuth>{element}</RequireAuth>;

export function AppRouter() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <UserRegistryProvider>
          <AuthProvider>
            <ShopProvider>
              <AppNav />
              <AccessibilityButton />
              <AssistantWidget />
              <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register/confirmation" element={<RegistrationConfirmationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<RequireAuth role="admin"><AdminPage /></RequireAuth>} />
                <Route path="/catalog" element={protectedRoute(<CatalogPage />)} />
                <Route path="/catalog/:kind" element={protectedRoute(<CatalogPage />)} />
                <Route path="/categories" element={protectedRoute(<CategoriesPage />)} />
                <Route path="/producto/:id" element={protectedRoute(<ProductDetailPage />)} />
                <Route path="/cart" element={protectedRoute(<CartPage />)} />
                <Route path="/checkout" element={protectedRoute(<CheckoutPage />)} />
                <Route path="/orders" element={protectedRoute(<OrdersPage />)} />
                <Route path="/orders/:id" element={protectedRoute(<OrdersPage />)} />
                <Route path="/profile" element={protectedRoute(<ProfilePage />)} />
                <Route path="/profile/accessibility" element={protectedRoute(<AccessibilityProfilePage />)} />
                <Route path="/profile/needs" element={protectedRoute(<AccessibilityNeedsPage />)} />
                <Route path="/chat" element={protectedRoute(<ChatPage />)} />
                <Route path="*" element={<Navigate to="/welcome" replace />} />
              </Routes>
            </ShopProvider>
          </AuthProvider>
        </UserRegistryProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
