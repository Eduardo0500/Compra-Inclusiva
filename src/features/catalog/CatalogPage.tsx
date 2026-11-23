import { Navigate, useParams } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAuth } from '../../app/AuthContext';
import { catalogKindForUser, type CatalogKind } from '../../services/identity';
import { useCatalogController } from './useCatalogController';
import { CatalogoVisual } from './variants/CatalogoVisual';
import { CatalogoAuditivo } from './variants/CatalogoAuditivo';
import { CatalogoMotriz } from './variants/CatalogoMotriz';
import { CatalogoCognitivo } from './variants/CatalogoCognitivo';
import { CatalogoCombinado } from './variants/CatalogoCombinado';
import { CatalogoGeneral } from './variants/CatalogoGeneral';

export { catalogKindForUser } from '../../services/identity';

const KINDS: CatalogKind[] = ['visual', 'auditivo', 'motriz', 'cognitivo', 'combinado', 'general'];

const VARIANTS: Record<CatalogKind, (props: { controller: ReturnType<typeof useCatalogController> }) => JSX.Element> = {
  visual: CatalogoVisual,
  auditivo: CatalogoAuditivo,
  motriz: CatalogoMotriz,
  cognitivo: CatalogoCognitivo,
  combinado: CatalogoCombinado,
  general: CatalogoGeneral,
};

export function CatalogPage() {
  const { kind } = useParams();
  const { user } = useAuth();
  const requested = KINDS.includes(kind as CatalogKind) ? (kind as CatalogKind) : 'general';
  const controller = useCatalogController(requested);
  const expected = catalogKindForUser(user);

  if (!kind || kind !== expected) {
    return <Navigate to={`/catalog/${expected}`} replace />;
  }

  const Variant = VARIANTS[requested];

  return (
    <>
      <SkipLink />
      <main id="main-content" className={`page wide-page catalog-page catalog-${requested}`} tabIndex={-1}>
        <Variant controller={controller} />
      </main>
    </>
  );
}
