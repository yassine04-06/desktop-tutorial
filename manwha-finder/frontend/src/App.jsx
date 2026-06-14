import { useState, useMemo, useEffect } from 'react';
import SearchBar from './components/SearchBar.jsx';
import FilterBar from './components/FilterBar.jsx';
import ManwhaCard from './components/ManwhaCard.jsx';
import FavoritesList from './components/FavoritesList.jsx';

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      <div className="skeleton w-full h-56" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-8 rounded mt-2" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
      <svg className="w-24 h-24 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p className="text-xl font-semibold">Search a manwha to get started</p>
      <p className="text-sm text-center max-w-xs">Enter a title above, pick from the dropdown, and get AI-powered similar recommendations</p>
    </div>
  );
}

export default function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('chapters_desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [sourceManwha, setSourceManwha] = useState(null);

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((data) => setFavoriteIds(new Set(data.map((f) => f.id))))
      .catch((err) => console.error('Init favorites error:', err));
  }, []);

  function handleSimilarResults(data, source) {
    setResults(data);
    setSourceManwha(source);
  }

  async function handleToggleFavorite(manga) {
    const isFav = favoriteIds.has(manga.id);
    if (isFav) {
      try {
        await fetch(`/api/favorites/${manga.id}`, { method: 'DELETE' });
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(manga.id);
          return next;
        });
      } catch (err) {
        console.error('Delete favorite error:', err);
      }
    } else {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: manga.id,
            title: manga.title,
            cover_url: manga.coverUrl,
            chapter_count: manga.chapterCount,
            status: manga.status,
          }),
        });
        setFavoriteIds((prev) => new Set([...prev, manga.id]));
      } catch (err) {
        console.error('Save favorite error:', err);
      }
    }
  }

  function handleRemoveFavorite(id) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = [...results];

    if (statusFilter !== 'all') {
      list = list.filter((m) => m.status === statusFilter);
    }

    switch (sort) {
      case 'chapters_desc':
        list.sort((a, b) => (b.chapterCount || 0) - (a.chapterCount || 0));
        break;
      case 'chapters_asc':
        list.sort((a, b) => (a.chapterCount || 0) - (b.chapterCount || 0));
        break;
      case 'updated_desc':
        list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        break;
      case 'updated_asc':
        list.sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
        break;
    }

    return list;
  }, [results, sort, statusFilter]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-accent whitespace-nowrap">
            ManwhaFinder
          </h1>
          <div className="flex-1 max-w-2xl">
            <SearchBar onSimilarResults={handleSimilarResults} onLoading={setLoading} />
          </div>
          <button
            onClick={() => setFavoritesOpen(true)}
            className="relative text-gray-300 hover:text-accent transition-colors flex-shrink-0"
            aria-label="Open favorites"
          >
            <svg className="w-6 h-6" fill={favoriteIds.size > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {favoriteIds.size > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {favoriteIds.size > 9 ? '9+' : favoriteIds.size}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {sourceManwha && (
          <div className="mb-4 text-sm text-gray-400">
            Showing results similar to{' '}
            <span className="text-accent font-semibold">{sourceManwha.title}</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-6">
            <FilterBar sort={sort} setSort={setSort} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && results.length === 0 && <EmptyState />}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((manga) => (
              <ManwhaCard
                key={manga.id}
                manga={manga}
                isFavorite={favoriteIds.has(manga.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {!loading && results.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No results match the current filters.
          </div>
        )}
      </main>

      <FavoritesList
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        favoriteIds={favoriteIds}
        onRemove={handleRemoveFavorite}
      />
    </div>
  );
}
