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

También puedes registrar una cuenta nueva. El registro pregunta necesidades con consentimiento explícito, muestra una vista previa y, al terminar, muestra el correo y la contraseña creados para que puedas iniciar sesión sin dudas. Solo se guarda el hash PBKDF2 de la contraseña, nunca el texto plano.

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

El panel flotante se puede arrastrar desde su encabezado o mover con las flechas del botón «Mover panel»; recuerda su posición y puede volver al centro con «Centrar botón». Incluye accesos rápidos (texto y contraste), buscador de herramientas y el atajo `Alt + A` para abrirlo o cerrarlo.

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

---

## Funcionalidades implementadas

### Tarea 1 — Menú de accesibilidad organizado por categorías

El botón flotante (Alt+A, arrastrable) abre un panel con cuatro categorías plegables:

| Categoría | Herramientas |
|---|---|
| Visual | Tamaño de texto, Alto contraste, Cambiar colores, Lectura de contenido |
| Auditiva | Subtítulos, Lengua de señas, Alertas visuales |
| Motriz | Botones grandes, Mayor espaciado, Navegación por teclado |
| Cognitiva | Lenguaje sencillo, Mayor espaciado, Navegación por teclado |

- Las categorías del usuario (según `needsForUser`) aparecen primero, **abiertas** y marcadas «Para ti».
- El buscador filtra dentro de todas las categorías.
- Cada toggle anuncia su estado con `role="status"` (WCAG 4.1.3).
- Botón «Mover panel» desplazable con flechas del teclado.

**WCAG cubiertos:** 1.3.1, 2.1.1, 2.4.3, 2.4.7, 4.1.2, 4.1.3

---

### Tarea 2 — Formularios del flujo de compra adaptados por perfil

`src/features/checkout/profileAdaptations.ts` exporta `getCheckoutAdaptation(needs, levels)` que combina adaptaciones según discapacidad y nivel funcional:

| Perfil | Adaptaciones activas |
|---|---|
| Visual | Foco en título de paso, resumen aria-live, errores role="alert", instrucciones |
| Auditiva | Solo avisos visuales, instrucciones claras |
| Motriz | Campos ≥56 px, espaciado extra, autocomplete, ejemplos en campos |
| Cognitiva | Lenguaje simple, indicador paso X/7, ejemplos, confirmación explícita |

**WCAG cubiertos:** 1.3.1, 1.3.5, 2.4.3, 2.5.8, 3.3.1, 3.3.3, 3.3.4, 3.3.7

---

### Tarea 3 — Chatbot accesible para personas con discapacidad visual

- **Entrada por voz** (`SpeechRecognition`, es-EC): botón «🎤 Hablar» oculto si el navegador no lo soporta. Estados anunciados con `announce()`.
- **Respuesta por voz** (`SpeechSynthesis`): activa por defecto si `needs.includes('visual')` o `prefs.readContent`. Controles Pausar / Reanudar / Detener / 🔁 Repetir / velocidad.
- **Lector de pantalla**: historial con `role="log" aria-live="polite"`, prefijos visualmente ocultos «Tú dijiste:» / «Asistente dijo:», foco devuelto al input tras enviar.
- **Atajos**: Alt+C abre/cierra, Escape cierra, Enter envía. Botón «⌨ Atajos» documenta los atajos.

**WCAG cubiertos:** 1.3.1, 2.1.1, 2.4.3, 4.1.2, 4.1.3

---

### Tarea 4 — Cuestionario de nivel de discapacidad en el registro

Después de elegir necesidades (con consentimiento), el registro incluye un paso «Cuéntanos cómo te afecta»:

- 5 preguntas por tipo de discapacidad, una por pantalla, con radiogroup nativo.
- Respuestas: 0 Sin dificultad, 1 Algo, 2 Mucha, 3 No puedo.
- `calcularNivel(respuestas)` suma 0–15 → leve (0–3) / moderado (4–8) / alto (9–15).
- Niveles guardados en `User.disabilityLevels`.
- **Leve** → herramientas sugeridas. **Moderado** → activa recomendadas. **Alto** → activa todas + máximas adaptaciones en checkout y TTS automático en chat.
- Botón «Omitir» disponible en todo momento.
- El panel `/admin` muestra la columna «Niveles» con el resumen por categoría.

**WCAG cubiertos:** 2.1.1, 3.1.5, 3.3.1, 3.3.4, 3.3.7, 4.1.2

---

## Cuentas de demostración

Contraseña de todas: **Demo1234!**

| Correo | Perfil |
|---|---|
| `maria@ejemplo.com` | Visual |
| `carlos@ejemplo.com` | Auditiva |
| `ana@ejemplo.com` | Motriz |
| `pedro@ejemplo.com` | Cognitiva |
| `elena@ejemplo.com` | Visual + Motriz (combinado) |
| `laura@ejemplo.com` | Sin discapacidad declarada |

Administrador: `admin@compral.com` / `Admin2024!` → `/admin`

## Cómo probar las tareas

1. **Tarea 1**: Entra con `maria@ejemplo.com`. Pulsa el botón azul ♿ (o Alt+A). La categoría «Visual» aparece abierta y marcada «Para ti». Usa el buscador escribiendo «contraste».

2. **Tarea 2**: Con `ana@ejemplo.com` (motriz), añade un producto al carrito y ve al checkout. Los botones son más grandes y los campos muestran ejemplos.

3. **Tarea 3**: Con `maria@ejemplo.com` (visual), abre el chat (botón 💬 o Alt+C). La voz se activa automáticamente. Usa «🎤 Hablar» si tu navegador soporta la API.

4. **Tarea 4**: Crea una cuenta nueva, selecciona «Visual» y da consentimiento. Aparece el cuestionario de 5 preguntas. Al terminar verás el nivel en el resumen. Entra a `/admin` para ver la columna «Niveles».
