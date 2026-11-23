import { Link } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import logo from '../../assets/logo.png';

export function WelcomePage() {
  return (
    <>
      <SkipLink />
      <main id="main-content" className="welcome-page" tabIndex={-1}>
        <section className="welcome-hero">
          <img src={logo} alt="CompraFácil Inclusiva: personas diversas comprando juntas" />
          <div>
            <p className="eyebrow">Comercio accesible para todos</p>
            <h1>CompraFácil Inclusiva</h1>
            <p className="lead">
              Compra alimentos y productos de primera necesidad en una tienda que se adapta a ti.
              Al entrar, elegimos automáticamente la experiencia que mejor se ajusta a tus necesidades.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" to="/register">Crear mi cuenta</Link>
              <Link className="btn btn-secondary" to="/login">Ya tengo cuenta</Link>
            </div>
          </div>
        </section>
        <section className="welcome-features" aria-labelledby="features-title">
          <h2 id="features-title">¿Qué encontrarás?</h2>
          <div className="feature-grid">
            <article className="card"><h3>Tu catálogo, tu forma de usarlo</h3><p>Seis experiencias con adaptaciones reales: visual, auditiva, motriz, cognitiva, combinada y general.</p></article>
            <article className="card"><h3>Accesibilidad en todas partes</h3><p>Ajusta texto, contraste, botones, subtítulos y más desde un único menú flotante.</p></article>
            <article className="card"><h3>Compra guiada</h3><p>Busca, compara, agrega al carrito y confirma tu pedido en siete pasos claros.</p></article>
            <article className="card"><h3>Ayuda incluida</h3><p>El Asistente Inclusivo responde preguntas sobre productos y compras con lenguaje adaptado.</p></article>
          </div>
        </section>
        <p className="muted welcome-note">Esta versión es una demostración local: no procesa pagos reales ni envía datos a servicios externos.</p>
      </main>
    </>
  );
}
