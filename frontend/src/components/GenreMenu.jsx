import { useEffect, useState } from 'react';

export default function GenreMenu({ onSelectGenre }) {
  const [open, setOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || genres.length > 0) return;
    setLoading(true);
    fetch('/api/genres')
      .then((r) => r.json())
      .then(setGenres)
      .catch((err) => console.error('Genres fetch error:', err))
      .finally(() => setLoading(false));
  }, [open, genres.length]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm bg-card border border-gray-700 hover:border-accent text-gray-300 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
      >
        Genere
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-card border border-gray-700 rounded-xl p-3 z-50 shadow-2xl">
            {loading && <p className="text-sm text-gray-500 text-center py-4">Caricamento...</p>}
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { onSelectGenre(g); setOpen(false); }}
                  className="text-xs bg-bg border border-gray-700 hover:border-accent hover:text-accent text-gray-300 px-2.5 py-1 rounded-full transition-colors"
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
