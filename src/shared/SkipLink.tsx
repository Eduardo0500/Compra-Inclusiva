/**
 * SkipLink – enlace de salto al contenido principal (WCAG 2.4.1).
 * Solo visible al recibir foco con teclado.
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Ir al contenido principal
    </a>
  );
}
