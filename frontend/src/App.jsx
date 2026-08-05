import { useState, useMemo, useEffect } from 'react';
import SearchBar from './components/SearchBar.jsx';
import FilterBar from './components/FilterBar.jsx';
import ManwhaCard from './components/ManwhaCard.jsx';
import FavoritesList from './components/FavoritesList.jsx';
import LibraryPanel from './components/LibraryPanel.jsx';
import LanguageToggle from './components/LanguageToggle.jsx';
import ManwhaDetail from './components/ManwhaDetail.jsx';
import GenreMenu from './components/GenreMenu.jsx';

const POPULAR_SEARCHES = [
  'Solo Leveling',
  'Tower of God',
  'The Beginning After The End',
  "Omniscient Reader's Viewpoint",
  'Lookism',
  'Villains Are Destined to Die',
];

const SOURCE_LABELS = {
  search: 'Risultati per ',
  genre: 'Genere: ',
  similar: 'Risultati simili a ',
};

function SkeletonCard({ delay = 0 }) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="skeleton w-full h-56" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-8 rounded mt-2" />
      </div>
    </div>
  );
}

function EmptyState({ onQuickStart }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-gray-500 gap-5">
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <div className="text-center">
        <p className="text-xl font-semibold text-gray-300">Cerca un manwha per iniziare</p>
        <p className="text-sm text-center max-w-sm mt-1">Scrivi un titolo o parola chiave e vedi subito tutti i risultati corrispondenti — quelli già nella tua libreria vengono esclusi automaticamente.</p>
      </div>

      <div className="flex flex-col items-center gap-2 mt-2">
        <span className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Prova con uno di questi</span>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {POPULAR_SEARCHES.map((title) => (
            <button
              key={title}
              onClick={() => onQuickStart(title)}
              className="text-sm bg-card border border-gray-700 hover:border-accent hover:text-accent text-gray-300 px-3 py-1.5 rounded-full transition-colors"
            >
              {title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('search'); // 'search' | 'favorites' | 'library'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('chapters_desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minChapters, setMinChapters] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [libraryIds, setLibraryIds] = useState(new Set());
  const [sourceManwha, setSourceManwha] = useState(null);
  const [selectedManga, setSelectedManga] = useState(null);
  const [quickStart, setQuickStart] = useState({ title: '', nonce: 0 });
  const [preferredLang, setPreferredLang] = useState(() => localStorage.getItem('manwhafinder_lang') || 'it');

  useEffect(() => {
    localStorage.setItem('manwhafinder_lang', preferredLang);
  }, [preferredLang]);

  useEffect(() => {
    Promise.all([
      fetch('/api/favorites').then((r) => r.json()),
      fetch('/api/library').then((r) => r.json()),
    ])
      .then(([favs, lib]) => {
        setFavoriteIds(new Set(favs.map((f) => f.id)));
        setLibraryIds(new Set(lib.map((l) => l.id)));
      })
      .catch((err) => console.error('Init error:', err));
  }, []);

  function handleSearchResults(data, query) {
    setResults(data);
    setSourceManwha({ title: query, kind: 'search' });
  }

  function handleQuickStart(title) {
    setView('search');
    setQuickStart({ title, nonce: Date.now() });
  }

  function handleGoHome() {
    setView('search');
    setResults([]);
    setSourceManwha(null);
    setSelectedManga(null);
  }

  async function handleSelectGenre(genre) {
    setView('search');
    setLoading(true);
    setSelectedManga(null);
    try {
      const res = await fetch(`/api/search-by-genre?tag=${genre.id}`);
      const data = await res.json();
      setResults(data);
      setSourceManwha({ title: genre.name, kind: 'genre' });
    } catch (err) {
      console.error('Genre search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFindSimilar(manga) {
    setSelectedManga(null);
    setView('search');
    setLoading(true);
    try {
      const res = await fetch(`/api/similar?id=${manga.id}`);
      const data = await res.json();
      setResults(data);
      setSourceManwha({ title: manga.title, kind: 'similar' });
    } catch (err) {
      console.error('Find similar error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Favorites ──────────────────────────────────────────────────────────────
  async function handleToggleFavorite(manga) {
    const isFav = favoriteIds.has(manga.id);
    if (isFav) {
      try {
        await fetch(`/api/favorites/${manga.id}`, { method: 'DELETE' });
        setFavoriteIds((prev) => { const n = new Set(prev); n.delete(manga.id); return n; });
      } catch (err) { console.error('Delete favorite error:', err); }
    } else {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: manga.id, title: manga.title, cover_url: manga.coverUrl, chapter_count: manga.chapterCount, status: manga.status }),
        });
        setFavoriteIds((prev) => new Set([...prev, manga.id]));
      } catch (err) { console.error('Save favorite error:', err); }
    }
  }

  // ── Library ────────────────────────────────────────────────────────────────
  async function handleToggleLibrary(manga) {
    const inLib = libraryIds.has(manga.id);
    if (inLib) {
      try {
        await fetch(`/api/library/${manga.id}`, { method: 'DELETE' });
        setLibraryIds((prev) => { const n = new Set(prev); n.delete(manga.id); return n; });
      } catch (err) { console.error('Delete library error:', err); }
    } else {
      try {
        await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: manga.id, title: manga.title, cover_url: manga.coverUrl, chapter_count: manga.chapterCount, status: manga.status }),
        });
        setLibraryIds((prev) => new Set([...prev, manga.id]));
      } catch (err) { console.error('Save library error:', err); }
    }
  }

  function handleLibraryChange() {
    fetch('/api/library')
      .then((r) => r.json())
      .then((lib) => setLibraryIds(new Set(lib.map((l) => l.id))))
      .catch((err) => console.error('Refresh library error:', err));
  }

  // ── Filtering & sorting (search view only) ────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...results];

    if (statusFilter !== 'all') {
      list = list.filter((m) => m.status === statusFilter);
    }

    if (minChapters > 0) {
      list = list.filter((m) => (m.chapterCount || 0) >= minChapters);
    }

    switch (sort) {
      case 'chapters_desc': list.sort((a, b) => (b.chapterCount || 0) - (a.chapterCount || 0)); break;
      case 'chapters_asc':  list.sort((a, b) => (a.chapterCount || 0) - (b.chapterCount || 0)); break;
      case 'updated_desc':  list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)); break;
      case 'updated_asc':   list.sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0)); break;
    }

    return list;
  }, [results, sort, statusFilter, minChapters]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={handleGoHome}
            className="text-xl font-bold text-accent whitespace-nowrap hover:opacity-80 transition-opacity"
          >
            ManwhaFinder
          </button>

          <div className="flex-1 max-w-2xl">
            <SearchBar
              onResults={handleSearchResults}
              onLoading={setLoading}
              quickStartTitle={quickStart.title}
              quickStartNonce={quickStart.nonce}
            />
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <GenreMenu onSelectGenre={handleSelectGenre} />
            <LanguageToggle preferredLang={preferredLang} setPreferredLang={setPreferredLang} />

            {/* Library button */}
            <button
              onClick={() => setView('library')}
              className={`relative transition-colors ${view === 'library' ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
              aria-label="Apri libreria"
              title="La mia libreria (già letti — esclusi dall'AI)"
            >
              <svg className="w-6 h-6" fill={libraryIds.size > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {libraryIds.size > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {libraryIds.size > 9 ? '9+' : libraryIds.size}
                </span>
              )}
            </button>

            {/* Favorites button */}
            <button
              onClick={() => setView('favorites')}
              className={`relative transition-colors ${view === 'favorites' ? 'text-accent' : 'text-gray-300 hover:text-accent'}`}
              aria-label="Apri preferiti"
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'favorites' && (
          <FavoritesList
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            libraryIds={libraryIds}
            onToggleLibrary={handleToggleLibrary}
            preferredLang={preferredLang}
            onOpenDetail={setSelectedManga}
          />
        )}

        {view === 'library' && (
          <LibraryPanel
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            libraryIds={libraryIds}
            onToggleLibrary={handleToggleLibrary}
            onLibraryChange={handleLibraryChange}
            preferredLang={preferredLang}
            onOpenDetail={setSelectedManga}
          />
        )}

        {view === 'search' && (
          <>
            {sourceManwha && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                <span>
                  {SOURCE_LABELS[sourceManwha.kind] || ''}
                  <span className="text-accent font-semibold">{sourceManwha.title}</span>
                </span>
                {libraryIds.size > 0 && (
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">
                    {libraryIds.size} titoli della libreria esclusi
                  </span>
                )}
              </div>
            )}

            {results.length > 0 && (
              <div className="mb-6">
                <FilterBar
                  sort={sort} setSort={setSort}
                  statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                  minChapters={minChapters} setMinChapters={setMinChapters}
                />
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} delay={i * 30} />)}
              </div>
            )}

            {!loading && results.length === 0 && <EmptyState onQuickStart={handleQuickStart} />}

            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((manga, i) => (
                  <div key={manga.id} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                    <ManwhaCard
                      manga={manga}
                      isFavorite={favoriteIds.has(manga.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isInLibrary={libraryIds.has(manga.id)}
                      onToggleLibrary={handleToggleLibrary}
                      preferredLang={preferredLang}
                      onOpenDetail={setSelectedManga}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && results.length > 0 && filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                Nessun risultato con i filtri attuali.
              </div>
            )}
          </>
        )}
      </main>

      {selectedManga && (
        <ManwhaDetail
          manga={selectedManga}
          isFavorite={favoriteIds.has(selectedManga.id)}
          onToggleFavorite={handleToggleFavorite}
          isInLibrary={libraryIds.has(selectedManga.id)}
          onToggleLibrary={handleToggleLibrary}
          preferredLang={preferredLang}
          onClose={() => setSelectedManga(null)}
          onFindSimilar={handleFindSimilar}
        />
      )}
    </div>
  );
}
