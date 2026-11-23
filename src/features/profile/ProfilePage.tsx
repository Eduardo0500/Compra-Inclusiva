import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import { useUserRegistry } from '../../app/UserRegistryContext';
import { hashPassword, verifyPassword } from '../../services/password';
import { CATALOG_KIND_LABELS, catalogKindForUser, needsLabel, needsForUser } from '../../services/identity';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { users } = useUserRegistry();
  const { announce } = useAccessibility();
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    fullName: user?.deliveryAddress?.fullName ?? user?.name ?? '',
    address: user?.deliveryAddress?.address ?? '',
    city: user?.deliveryAddress?.city ?? '',
    phone: user?.deliveryAddress?.phone ?? '',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  const needs = needsForUser(user);
  const kind = catalogKindForUser(user);

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (profile.name.trim().length < 2) found.name = 'Escribe tu nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) found.email = 'Escribe un correo válido.';
    if (users.some((item) => item.id !== user.id
      && item.email.toLocaleLowerCase('es') === profile.email.trim().toLocaleLowerCase('es'))) {
      found.email = 'Ese correo ya pertenece a otra cuenta.';
    }
    setErrors(found);
    if (Object.keys(found).length) {
      announce('Revisa los errores del formulario.');
      return;
    }
    updateUser({
      ...user,
      name: profile.name.trim(),
      email: profile.email.trim(),
      deliveryAddress: {
        fullName: profile.fullName.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
        phone: profile.phone.trim(),
      },
    });
    setMessage('Datos guardados correctamente.');
    announce('Datos del perfil guardados.');
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!(await verifyPassword(passwords.current, user.passwordHash))) found.current = 'La contraseña actual no es correcta.';
    if (passwords.next.length < 8) found.next = 'La nueva contraseña debe tener al menos 8 caracteres.';
    if (passwords.next !== passwords.confirm) found.confirm = 'Las contraseñas no coinciden.';
    setErrors(found);
    if (Object.keys(found).length) {
      announce('No se pudo cambiar la contraseña. Revisa los errores.');
      return;
    }
    updateUser({ ...user, passwordHash: await hashPassword(passwords.next) });
    setPasswords({ current: '', next: '', confirm: '' });
    setMessage('Contraseña actualizada.');
    announce('Contraseña actualizada correctamente.');
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page" tabIndex={-1}>
        <h1>Mi perfil</h1>
        {message && <p className="feedback feedback-ok" role="status"><span aria-hidden="true">✓</span> {message}</p>}
        <div className="profile-grid">
          <section className="card stack" aria-labelledby="profile-data">
            <h2 id="profile-data">Mis datos</h2>
            <form noValidate onSubmit={saveProfile} className="stack">
              <FormField label="Nombre completo" type="text" autoComplete="name" required
                value={profile.name} error={errors.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
              <FormField label="Correo electrónico" type="email" autoComplete="email" required
                value={profile.email} error={errors.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
              <h3>Dirección de entrega guardada</h3>
              <FormField label="Nombre de quien recibe" type="text" autoComplete="name"
                value={profile.fullName}
                onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} />
              <FormField label="Dirección" type="text" autoComplete="street-address"
                value={profile.address}
                onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
              <FormField label="Ciudad" type="text" autoComplete="address-level2"
                value={profile.city}
                onChange={(event) => setProfile({ ...profile, city: event.target.value })} />
              <FormField label="Teléfono" type="tel" autoComplete="tel"
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
              <button className="btn btn-primary" type="submit">Guardar datos</button>
            </form>
          </section>

          <div className="stack">
            <section className="card stack" aria-labelledby="profile-accessibility">
              <h2 id="profile-accessibility">Accesibilidad</h2>
              <p><strong>Necesidades:</strong> {needsLabel(needs)}</p>
              <p><strong>Consentimiento:</strong> {user.disabilityConsent ? 'Otorgado' : 'No otorgado'}</p>
              <p><strong>Catálogo asignado:</strong> {CATALOG_KIND_LABELS[kind]}</p>
              <p><strong>Fecha de registro:</strong> {user.registeredAt
                ? new Date(user.registeredAt).toLocaleDateString('es-CO')
                : 'No disponible'}</p>
              <div className="actions">
                <Link className="btn btn-secondary" to="/profile/needs">Cambiar necesidades</Link>
                <Link className="btn btn-ghost" to="/profile/accessibility">Preferencias</Link>
              </div>
            </section>

            <section className="card stack" aria-labelledby="profile-password">
              <h2 id="profile-password">Cambiar contraseña</h2>
              <form noValidate onSubmit={changePassword} className="stack">
                <FormField label="Contraseña actual" type="password" autoComplete="current-password"
                  value={passwords.current} error={errors.current}
                  onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} />
                <FormField label="Nueva contraseña" type="password" autoComplete="new-password"
                  hint="Mínimo 8 caracteres." value={passwords.next} error={errors.next}
                  onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} />
                <FormField label="Confirmar nueva contraseña" type="password" autoComplete="new-password"
                  value={passwords.confirm} error={errors.confirm}
                  onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} />
                <button className="btn btn-primary" type="submit">Actualizar contraseña</button>
              </form>
            </section>

            <Link className="btn btn-secondary" to="/orders">Ver mis pedidos</Link>
          </div>
        </div>
      </main>
    </>
  );
}
