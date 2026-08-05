import { useEffect, useState } from 'react';

export default function FavoritesList({ isOpen, onClose, favoriteIds, onRemove }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/favorites')
      .then((r) => r.json())
      .then(setFavorites)
      .catch((err) => console.error('Fetch favorites error:', err));
  }, [isOpen, favoriteIds]);

  async function handleRemove(id) {
    try {
      await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      onRemove(id);
    } catch (err) {
      console.error('Remove favorite error:', err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="relative bg-[#12122a] w-80 max-w-full h-full flex flex-col slide-in shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-gray-100">Favorites</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Close favorites"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {favorites.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-sm">No favorites saved yet</p>
            </div>
          )}

          {favorites.map((fav) => (
            <div key={fav.id} className="flex items-center gap-3 bg-card rounded-xl p-2">
              {fav.cover_url ? (
                <img
                  src={fav.cover_url}
                  alt={fav.title}
                  className="w-10 h-14 object-cover rounded flex-shrink-0"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-10 h-14 bg-gray-700 rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate">{fav.title}</p>
                {fav.chapter_count > 0 && (
                  <p className="text-xs text-accent">{fav.chapter_count} chapters</p>
                )}
                <p className="text-xs text-gray-500 capitalize">{fav.status || 'Unknown'}</p>
              </div>
              <button
                onClick={() => handleRemove(fav.id)}
                className="text-gray-500 hover:text-accent transition-colors flex-shrink-0"
                aria-label="Remove from favorites"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
