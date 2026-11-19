import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './AccessibilityContext';
import { AuthProvider } from './AuthContext';
import { AccessibilityButton } from '../features/accessibility/AccessibilityButton';
import { RegisterPage } from '../features/auth/RegisterPage';
import { LoginPage } from '../features/auth/LoginPage';
import { AccessibilityProfilePage } from '../features/profile/AccessibilityProfilePage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          {/* Botón flotante de accesibilidad – visible en todas las rutas (WCAG 3.2.6) */}
          <AccessibilityButton />

          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile/accessibility" element={<AccessibilityProfilePage />} />
            {/* Rutas futuras: /catalog, /cart, /checkout, /service-request, /chat */}
          </Routes>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
