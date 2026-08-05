import { useState } from 'react';

export default function ManwhaCard({ manga, isFavorite, onToggleFavorite, isInLibrary, onToggleLibrary, preferredLang, onOpenDetail }) {
  const [imgError, setImgError] = useState(false);

  const languages = manga.languages || [];
  const hasIt = languages.includes('it');
  const hasEn = languages.includes('en');
  const topTags = (manga.tags || []).slice(0, 2);

  const statusColor =
    manga.status === 'completed'
      ? 'bg-green-700 text-green-100'
      : manga.status === 'ongoing'
      ? 'bg-yellow-700 text-yellow-100'
      : 'bg-gray-700 text-gray-300';

  const updatedLabel = manga.updatedAt
    ? new Date(manga.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  function handleTachiyomi(e) {
    e.stopPropagation();
    window.location.href = `tachiyomi://manga/mangadex/${manga.id}`;
  }

  function handleFavoriteClick(e) {
    e.stopPropagation();
    onToggleFavorite(manga);
  }

  function handleLibraryClick(e) {
    e.stopPropagation();
    onToggleLibrary(manga);
  }

  return (
    <div
      onClick={() => onOpenDetail(manga)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpenDetail(manga); }}
      className="group bg-card rounded-2xl overflow-hidden flex flex-col shadow-lg hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      <div className="relative">
        {manga.coverUrl && !imgError ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-56 bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Bottom gradient for legibility + tag pills */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />
        {topTags.length > 0 && (
          <div className="absolute bottom-2 right-2 flex flex-wrap gap-1 justify-end max-w-[70%]">
            {topTags.map((tag) => (
              <span key={tag} className="text-[10px] font-medium bg-black/50 text-gray-200 px-1.5 py-0.5 rounded-full truncate">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Favorites heart */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full transition-colors"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            className={`w-5 h-5 transition-colors ${isFavorite ? 'text-accent fill-accent' : 'text-white'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Library bookmark */}
        <button
          onClick={handleLibraryClick}
          className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full transition-colors"
          aria-label={isInLibrary ? 'Remove from library' : 'Add to library (already read)'}
          title={isInLibrary ? 'In your library' : 'Mark as read'}
        >
          <svg
            className={`w-5 h-5 transition-colors ${isInLibrary ? 'text-blue-400 fill-blue-400' : 'text-white'}`}
            fill={isInLibrary ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {manga.chapterCount > 0 && (
          <span
            className="absolute bottom-2 left-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-full"
            title="Capitoli combinati disponibili in italiano + inglese"
          >
            {manga.chapterCount} ch
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-gray-100 text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors">
          {manga.title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
            {manga.status ? manga.status.charAt(0).toUpperCase() + manga.status.slice(1) : 'Unknown'}
          </span>
          {updatedLabel && (
            <span className="text-xs text-gray-500">{updatedLabel}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              hasIt ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-600'
            }`}
            title={hasIt ? 'Disponibile in italiano' : 'Non disponibile in italiano'}
          >
            IT
          </span>
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              hasEn ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-600'
            }`}
            title={hasEn ? 'Available in English' : 'Not available in English'}
          >
            EN
          </span>
          {preferredLang && !languages.includes(preferredLang) && (hasIt || hasEn) && (
            <span className="text-xs text-yellow-500" title={`Non disponibile in ${preferredLang.toUpperCase()}, ma leggibile nell'altra lingua`}>
              ⚠
            </span>
          )}
        </div>

        <button
          onClick={handleTachiyomi}
          className="mt-auto w-full bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in Tachiyomi
        </button>
      </div>
    </div>
  );
}
