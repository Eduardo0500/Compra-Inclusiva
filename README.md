# CompraFácil Inclusiva

Tienda demo de servicios esenciales con registro accesible, perfiles de necesidades, seis catálogos adaptados desde un único inventario, carrito, checkout de demostración, historial de pedidos y Asistente Inclusivo.

> El proyecto funciona sin backend. La autenticación, las preferencias, el carrito y los pedidos se guardan en almacenamiento local del navegador solo para demostración. No es un sistema seguro para producción.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos + build de producción |
| `npm run preview` | Previsualización del build |
| `npm test` | Todos los tests (Vitest + Testing Library + jest-axe) |
| `npm run test:a11y` | Solo tests de accesibilidad |

Última verificación local: `npm run build` correcto; `npm test` → 8 archivos, 31 tests correctos.

## Cuentas de demostración

Todas usan la contraseña `Demo1234!`:

| Correo | Perfil | Catálogo |
|---|---|---|
| `maria@ejemplo.com` | Visual | `/catalog/visual` |
| `carlos@ejemplo.com` | Auditiva | `/catalog/auditivo` |
| `ana@ejemplo.com` | Motriz | `/catalog/motriz` |
| `pedro@ejemplo.com` | Cognitiva | `/catalog/cognitivo` |
| `elena@ejemplo.com` | Visual + motriz | `/catalog/combinado` |
| `laura@ejemplo.com` | Prefirió no indicarlo | `/catalog/general` |

También puedes registrar una cuenta nueva. El registro pregunta necesidades con consentimiento explícito, muestra una vista previa y redirige al catálogo correcto tras iniciar sesión.

## Flujo implementado

1. **Registro** (`/register`): datos personales, contraseña protegida con PBKDF2, necesidades múltiples, consentimiento y confirmación.
2. **Login** (`/login`): autenticación demo, carga de preferencias y redirección automática a `/catalog/<perfil>`.
3. **Catálogos** (`/catalog/:kind`): seis adaptaciones sobre `PRODUCTS`; si la URL no coincide con el perfil, se redirige al catálogo real.
4. **Producto** (`/producto/:id`) y **categorías** (`/categories`).
5. **Carrito** (`/cart`): cantidades, eliminación, validación de stock y totales.
6. **Checkout** (`/checkout`): 7 pasos, dirección, pago de demostración, resumen y confirmación expresa. No se realizan cobros.
7. **Pedidos** (`/orders`): historial por usuario y detalle de cada pedido.
8. **Perfil** (`/profile`): datos, dirección, cambio de contraseña, necesidades (`/profile/needs`) y accesibilidad (`/profile/accessibility`).
9. **Asistente Inclusivo** (`/chat` y botón flotante): búsqueda, precios, categorías y guía de compra con lenguaje adaptado.

## Catálogos

| Ruta | Adaptación principal |
|---|---|
| `/catalog/visual` | Lectura en voz alta, alto contraste, escala de texto y navegación por teclado |
| `/catalog/auditivo` | Avisos visuales, transcripciones y lengua de señas |
| `/catalog/motriz` | Botones grandes, más espaciado y agregado rápido por cantidad |
| `/catalog/cognitivo` | Lenguaje simple, pasos numerados y confirmación antes de agregar |
| `/catalog/combinado` | Unión de todas las adaptaciones declaradas |
| `/catalog/general` | Catálogo base accesible para `ninguna` / `no_indica` |

Todos consultan el mismo `src/features/catalog/products.ts` a través de `src/services/catalog.ts`. No existen seis inventarios independientes.

## Accesibilidad

El botón flotante «Opciones de accesibilidad» y la página de perfil permiten cambiar en cualquier momento:

- Alto contraste y modo amarillo/azul.
- Escala de texto de 100 % a 200 %.
- Botones grandes y espaciado extra.
- Subtítulos, lengua de señas y alertas visuales.
- Lenguaje simple, lectura de contenido y navegación por teclado.
- Aplicación automática de recomendaciones según necesidades declaradas, separando «Mi configuración personalizada» de «Otras opciones de accesibilidad».

Se conservan: enlace de salto, foco visible, `role="status"`/`role="log"`, mensajes con icono además de color, nombres ARIA, cierre con Escape y devolución del foco.

### Criterios WCAG 2.2 AA cubiertos por implementación y tests automatizados

1.1.1, 1.2.1, 1.2.2, 1.2.6, 1.3.1, 1.3.3, 1.3.5, 1.4.1, 1.4.3, 1.4.4, 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11, 2.5.8, 3.1.5, 3.2.6, 3.3.1, 3.3.2, 3.3.4, 3.3.7, 3.3.8, 4.1.2, 4.1.3.

Los tests automáticos no sustituyen una auditoría completa. Antes de publicar se recomienda revisión manual con lector de pantalla, zoom al 200 %, navegación solo con teclado y comprobación de contraste real con las imágenes finales.

## Configuración opcional

Crea `.env.local` solo si vas a conectar servicios externos:

```text
VITE_ADMIN_EMAIL=administrador@tu-dominio.com
VITE_ADMIN_PASSWORD=contraseña-segura-generada
VITE_AI_API_URL=https://tu-backend.example.com/asistente
VITE_API_BASE_URL=https://tu-backend.example.com/api
```

- Sin `VITE_AI_API_URL`, el asistente usa respuestas demo basadas en el catálogo real.
- Con `VITE_AI_API_URL`, se envían la pregunta, el perfil accesible y el catálogo; si falla, se usa respuesta demo con aviso.
- **No pongas claves API ni secretos en variables `VITE_*`**: se exponen al navegador. La IA, los pagos y la autenticación real deben resolverse en backend.
- Las credenciales de administrador en `VITE_*` son una limitación demo; en producción deben validarse solo en servidor.

## Pendiente para producción

- API/DB real con sesiones httpOnly, autorización por rol y auditoría.
- Pasarela de pago real y confirmación de pedidos en servidor.
- Descuento atómico de inventario y control de concurrencia.
- Subtítulos/archivos de lengua de señas reales para contenido multimedia.
- Auditoría WCAG 2.2 AA manual y pruebas con usuarios.

## Estructura

```text
src/
├── app/                # Contextos: Accesibilidad, Registro, Auth, Tienda, Router
├── features/
│   ├── accessibility/  # Botón flotante y panel
│   ├── admin/          # Panel de administración demo
│   ├── auth/           # Registro y login
│   ├── cart/           # Carrito por usuario
│   ├── catalog/        # Controlador, componentes y seis variantes
│   ├── chat/           # ChatPage, AssistantWidget y hook compartido
│   ├── checkout/       # Checkout de 7 pasos
│   ├── profile/        # Perfil, necesidades, accesibilidad y pedidos
│   └── welcome/        # Portada
├── services/           # storage, identity, catalog, password, assistant
├── shared/             # FormField, SkipLink, AppNav, RequireAuth
├── styles/             # CSS global, tokens y alto contraste
├── types/              # User, AccessibilityPreferences, Product, Order
└── tests/              # Tests lógicos, funcionales y de accesibilidad
```
