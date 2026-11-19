/**
 * AccessibleMedia – reproductor de video/audio accesible reutilizable.
 * Implementa WCAG:
 *   1.2.1 – transcripción de audio/video grabado
 *   1.2.2 – subtítulos en video grabado (pista <track kind="subtitles">)
 *   1.2.6 – lengua de señas (overlay de video intérprete)
 *   1.3.3 – no depende solo del sonido
 *
 * Las preferencias captions y signLanguage se leen del AccessibilityContext.
 * Si el usuario las activó en el menú/perfil, se aplican automáticamente.
 */
import { useRef } from 'react';
import { useAccessibility } from '../app/AccessibilityContext';

export interface AccessibleMediaProps {
  /** URL del video o audio */
  src: string;
  /** 'video' | 'audio' */
  type: 'video' | 'audio';
  /** Título visible del contenido (1.3.1, 3.3.2) */
  title: string;
  /** URL del archivo de subtítulos .vtt (1.2.2) */
  captionsUrl?: string;
  /** Idioma de los subtítulos, por defecto 'es' */
  captionsLang?: string;
  /** URL del video de intérprete de lengua de señas (1.2.6) */
  signLanguageUrl?: string;
  /** Texto de transcripción completa (1.2.1) */
  transcript?: string;
  /** Texto corto que describe el contenido para lectores de pantalla (1.1.1) */
  description: string;
}

export function AccessibleMedia({
  src,
  type,
  title,
  captionsUrl,
  captionsLang = 'es',
  signLanguageUrl,
  transcript,
  description,
}: AccessibleMediaProps) {
  const { prefs } = useAccessibility();
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);

  return (
    <figure
      aria-label={title}
      style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      {/* Título visible (1.3.1) */}
      <figcaption style={{ fontWeight: 600 }}>{title}</figcaption>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {type === 'video' ? (
          <video
            ref={mediaRef}
            src={src}
            controls
            aria-label={description}
            style={{ maxWidth: '100%', borderRadius: 'var(--radius)' }}
          >
            {/* Subtítulos (1.2.2): se muestran si captionsUrl existe Y el usuario los activó */}
            {captionsUrl && (
              <track
                kind="subtitles"
                src={captionsUrl}
                srcLang={captionsLang}
                label="Subtítulos en español"
                default={prefs.captions}
              />
            )}
            {/* Texto alternativo para navegadores sin soporte de video (1.1.1) */}
            <p>{description}</p>
          </video>
        ) : (
          <audio
            ref={mediaRef}
            src={src}
            controls
            aria-label={description}
            style={{ width: '100%' }}
          >
            <p>{description}</p>
          </audio>
        )}

        {/* Overlay de intérprete de lengua de señas (1.2.6) */}
        {signLanguageUrl && prefs.signLanguage && (
          <video
            src={signLanguageUrl}
            autoPlay
            muted={false}
            aria-label={`Intérprete de lengua de señas para: ${title}`}
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: '25%',
              minWidth: 120,
              borderRadius: 6,
              border: '2px solid var(--color-primary)',
              background: '#000',
            }}
          />
        )}
      </div>

      {/* Transcripción completa (1.2.1): siempre visible, no solo para sordos */}
      {transcript && (
        <details style={{ marginTop: '0.25rem' }}>
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              color: 'var(--color-primary)',
              minHeight: 'var(--target-size)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Ver transcripción completa
          </summary>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              lineHeight: 1.7,
            }}
          >
            {transcript}
          </div>
        </details>
      )}
    </figure>
  );
}
