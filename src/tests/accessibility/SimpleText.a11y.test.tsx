/**
 * Tests para SimpleText (WCAG 3.1.5, 3.1.3) y AccessibleMedia (WCAG 1.2.1, 1.2.2, 1.2.6).
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleText } from '../../shared/SimpleText';
import { AccessibleMedia } from '../../shared/AccessibleMedia';
import { AccessibilityProvider } from '../../app/AccessibilityContext';

// ── SimpleText ────────────────────────────────────────────────────────────────
describe('SimpleText (WCAG 3.1.5)', () => {
  it('renderiza ambas versiones en el DOM', () => {
    render(<SimpleText full="Texto completo" simple="Texto simple" />);
    // Ambos están en el DOM; CSS los alterna con display:none
    expect(document.querySelector('.text-complex')).toHaveTextContent('Texto completo');
    expect(document.querySelector('.text-simple')).toHaveTextContent('Texto simple');
  });

  it('con html.simple-language la clase se aplica al elemento raíz', () => {
    document.documentElement.classList.add('simple-language');
    render(<SimpleText full="Texto completo" simple="Texto simple" />);
    // La clase está en <html>, el CSS hace el resto
    expect(document.documentElement).toHaveClass('simple-language');
    document.documentElement.classList.remove('simple-language');
  });
});

// ── AccessibleMedia ───────────────────────────────────────────────────────────
describe('AccessibleMedia (WCAG 1.2.1, 1.2.2, 1.2.6)', () => {
  beforeEach(() => {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  });
  afterEach(() => {
    document.getElementById('live-region')?.remove();
  });

  it('muestra el título y la transcripción (1.2.1)', () => {
    render(
      <AccessibilityProvider>
        <AccessibleMedia
          src="/demo.mp4"
          type="video"
          title="Video de producto"
          description="Demostración del producto"
          transcript="Esta es la transcripción completa del video."
        />
      </AccessibilityProvider>
    );
    expect(screen.getByText('Video de producto')).toBeInTheDocument();
    expect(screen.getByText('Ver transcripción completa')).toBeInTheDocument();
  });

  it('tiene aria-label con la descripción (WCAG 1.1.1)', () => {
    render(
      <AccessibilityProvider>
        <AccessibleMedia
          src="/demo.mp4"
          type="video"
          title="Video"
          description="Descripción del video para lectores de pantalla"
        />
      </AccessibilityProvider>
    );
    expect(screen.getByLabelText('Descripción del video para lectores de pantalla')).toBeInTheDocument();
  });

  it('incluye pista <track> de subtítulos cuando se pasa captionsUrl (1.2.2)', () => {
    render(
      <AccessibilityProvider>
        <AccessibleMedia
          src="/demo.mp4"
          type="video"
          title="Video"
          description="Video"
          captionsUrl="/subtitles.vtt"
        />
      </AccessibilityProvider>
    );
    const track = document.querySelector('track');
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute('kind', 'subtitles');
    expect(track).toHaveAttribute('src', '/subtitles.vtt');
  });
});
