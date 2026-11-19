/**
 * SimpleText – muestra texto alternativo simplificado cuando el modo
 * "lenguaje simple" está activo (WCAG 3.1.5, 3.1.3).
 *
 * Uso:
 *   <SimpleText
 *     full="El proceso de autenticación requiere credenciales válidas."
 *     simple="Escribe tu correo y contraseña para entrar."
 *   />
 *
 * En modo normal muestra `full`; con html.simple-language activo muestra `simple`.
 * Ambos están en el DOM para que el CSS los alterne sin JS adicional.
 */
interface SimpleTextProps {
  full: string;
  simple: string;
  as?: keyof JSX.IntrinsicElements;
}

export function SimpleText({ full, simple, as: Tag = 'span' }: SimpleTextProps) {
  return (
    <>
      <Tag className="text-complex">{full}</Tag>
      <Tag className="text-simple">{simple}</Tag>
    </>
  );
}
