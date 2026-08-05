import { useEffect, useState } from 'react';

export default function ManwhaDetail({ manga, isFavorite, onToggleFavorite, isInLibrary, onToggleLibrary, preferredLang, onClose, onFindSimilar }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!manga) return null;

  const languages = manga.languages || [];
  const hasIt = languages.includes('it');
  const hasEn = languages.includes('en');

  const descriptions = manga.descriptions || {};
  const description =
    (preferredLang === 'it' ? descriptions.it : descriptions.en) ||
    descriptions.en ||
    descriptions.it ||
    manga.description ||
    'Nessuna descrizione disponibile per questo manwha.';

  const usedFallbackLang = preferredLang === 'it' && !descriptions.it && descriptions.en;

  const statusColor =
    manga.status === 'completed'
      ? 'bg-green-700 text-green-100'
      : manga.status === 'ongoing'
      ? 'bg-yellow-700 text-yellow-100'
      : 'bg-gray-700 text-gray-300';

  const updatedLabel = manga.updatedAt
    ? new Date(manga.updatedAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  function handleTachiyomi() {
    window.location.href = `tachiyomi://manga/mangadex/${manga.id}`;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div
        className="relative bg-[#14142c] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl overflow-y-auto shadow-2xl detail-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="fixed sm:absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
          aria-label="Chiudi"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Cover */}
          <div className="relative w-full sm:w-64 flex-shrink-0 h-72 sm:h-auto">
            {manga.coverUrl && !imgError ? (
              <img
                src={manga.coverUrl}
                alt={manga.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#14142c] sm:from-transparent sm:bg-gradient-to-r sm:to-[#14142c]/40 pointer-events-none" />
          </div>

          {/* Info */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col gap-4 min-w-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 leading-tight pr-10">{manga.title}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                  {manga.status ? manga.status.charAt(0).toUpperCase() + manga.status.slice(1) : 'Unknown'}
                </span>
                {manga.year && <span className="text-xs text-gray-500">{manga.year}</span>}
                {updatedLabel && <span className="text-xs text-gray-500">Aggiornato il {updatedLabel}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded ${hasIt ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-600'}`}>
                IT {hasIt ? '✓' : '✕'}
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${hasEn ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-600'}`}>
                EN {hasEn ? '✓' : '✕'}
              </span>
              {manga.chapterCount > 0 && (
                <span className="text-xs font-bold px-2 py-1 rounded bg-accent text-white">
                  {manga.chapterCount} capitoli
                </span>
              )}
            </div>

            {manga.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {manga.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-card border border-gray-700 text-gray-300 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{description}</p>
              {usedFallbackLang && (
                <p className="text-xs text-gray-500 italic mt-2">Descrizione in italiano non disponibile — mostrata la versione inglese.</p>
              )}
            </div>

            {onFindSimilar && (
              <button
                onClick={() => onFindSimilar(manga)}
                className="w-full flex items-center justify-center gap-2 bg-accent/10 border border-accent text-accent hover:bg-accent hover:text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Trova manwha simili (AI)
              </button>
            )}

            <div className="mt-auto pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onToggleFavorite(manga)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isFavorite ? 'bg-accent text-white' : 'bg-card border border-gray-700 text-gray-200 hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isFavorite ? 'Nei preferiti' : 'Aggiungi ai preferiti'}
              </button>
              <button
                onClick={() => onToggleLibrary(manga)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isInLibrary ? 'bg-blue-600 text-white' : 'bg-card border border-gray-700 text-gray-200 hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill={isInLibrary ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isInLibrary ? 'Già letto' : 'Segna come letto'}
              </button>
              <button
                onClick={handleTachiyomi}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-100 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Apri in Tachiyomi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
