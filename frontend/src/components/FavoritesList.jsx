import { useEffect, useState } from 'react';
import ManwhaCard from './ManwhaCard.jsx';

function toCardShape(fav) {
  return {
    id: fav.id,
    title: fav.title,
    coverUrl: fav.cover_url,
    chapterCount: fav.chapter_count,
    status: fav.status,
    tags: [],
    languages: [],
    updatedAt: null,
  };
}

export default function FavoritesList({ favoriteIds, onToggleFavorite, libraryIds, onToggleLibrary, preferredLang, onOpenDetail }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => r.json())
      .then(setFavorites)
      .catch((err) => console.error('Fetch favorites error:', err))
      .finally(() => setLoading(false));
  }, [favoriteIds]);

  async function handleOpenDetail(manga) {
    try {
      const res = await fetch(`/api/manga/${manga.id}`);
      const full = await res.json();
      onOpenDetail({ ...manga, ...full });
    } catch (err) {
      console.error('Fetch manga detail error:', err);
      onOpenDetail(manga);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Preferiti</h2>
        <p className="text-sm text-gray-500 mt-1">{favorites.length} manwha salvati</p>
      </div>

      {!loading && favorites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
          <svg className="w-20 h-20 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-xl font-semibold text-gray-300">Nessun preferito ancora</p>
          <p className="text-sm text-center max-w-sm">Clicca il cuore su una card per salvarla qui.</p>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((fav) => {
            const manga = toCardShape(fav);
            return (
              <ManwhaCard
                key={manga.id}
                manga={manga}
                isFavorite={favoriteIds.has(manga.id)}
                onToggleFavorite={onToggleFavorite}
                isInLibrary={libraryIds.has(manga.id)}
                onToggleLibrary={onToggleLibrary}
                preferredLang={preferredLang}
                onOpenDetail={handleOpenDetail}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
