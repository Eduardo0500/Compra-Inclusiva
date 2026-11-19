# CompraFácil Inclusiva

Mercado local de servicios esenciales accesible. WCAG 2.2 AA+.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run test` | Tests unitarios y de accesibilidad |

## Estructura

```
src/
├── app/               # Contextos globales (Accesibilidad, Auth) y Router
├── features/
│   ├── accessibility/ # Botón flotante + panel (WCAG 3.2.6)
│   ├── auth/          # Registro e inicio de sesión
│   ├── profile/       # Perfil de accesibilidad
│   ├── catalog/       # (próximo: 26/11)
│   ├── cart/          # (próximo: 26/11)
│   ├── checkout/      # (próximo: 10/12)
│   ├── service-request/
│   └── chat/
├── shared/            # FormField, SkipLink – reutilizables en todos los formularios
├── styles/            # Variables CSS, clases base, alto contraste, botones grandes
├── types/             # AccessibilityPreferences, User
└── tests/             # Unitarios y de accesibilidad (vitest + testing-library)
```

## Criterios WCAG implementados en este sprint

| Criterio | Componente principal |
|---|---|
| 1.1.1 Texto alternativo | `AccessibilityIcon` (aria-hidden + label en botón) |
| 1.3.1 Información y relaciones | `FormField` (label + describedby) |
| 1.3.5 Propósito del campo | `autocomplete` en todos los inputs |
| 1.4.1 Uso del color | Errores con icono ⚠ además de color |
| 1.4.3 Contraste mínimo | Variables CSS base (4.5:1) + modo alto contraste |
| 1.4.4 Redimensionar texto | `--text-scale` CSS hasta 200 % |
| 2.1.1 Teclado | Todo operable sin ratón; Esc cierra el panel |
| 2.4.3 Orden del foco | Foco devuelto al botón al cerrar el panel |
| 2.4.7 Foco visible | `:focus-visible` naranja alto contraste |
| 2.4.11 Foco no oculto | Panel posicionado sin tapar el foco |
| 2.5.8 Tamaño objetivo | `--target-size: 44px` base, 56px en modo grande |
| 3.2.6 Ayuda consistente | FAB siempre en esquina inferior derecha |
| 3.3.1 Identificación de errores | `role="alert"` en mensajes de error |
| 3.3.2 Etiquetas e instrucciones | Label + hint en cada campo |
| 3.3.4 Prevención de errores | Pantalla de resumen antes de confirmar registro |
| 3.3.7 Entrada redundante | Preferencias se cargan solas al hacer login |
| 3.3.8 Autenticación accesible | Sin CAPTCHA; `autocomplete` obligatorio |
| 4.1.2 Nombre, función, valor | `role="switch"` + `aria-checked` en toggles |
| 4.1.3 Mensajes de estado | `announce()` vía `aria-live="polite"` |
