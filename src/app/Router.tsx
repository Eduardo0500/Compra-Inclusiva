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

export function AppRouter() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <UserRegistryProvider>
          <AuthProvider>
            {/* Botón flotante de accesibilidad – visible en todas las rutas (WCAG 3.2.6) */}
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

              {/* Rutas futuras: /catalog, /cart, /checkout, /service-request, /chat */}
            </Routes>
          </AuthProvider>
        </UserRegistryProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
