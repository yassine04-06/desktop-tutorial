import { useEffect, useRef, useState } from 'react';
import ManwhaCard from './ManwhaCard.jsx';

function toCardShape(item) {
  return {
    id: item.id,
    title: item.title,
    coverUrl: item.cover_url,
    chapterCount: item.chapter_count,
    status: item.status,
    tags: [],
    languages: [],
    updatedAt: null,
  };
}

export default function LibraryPanel({ favoriteIds, onToggleFavorite, libraryIds, onToggleLibrary, onLibraryChange, preferredLang, onOpenDetail }) {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/library')
      .then((r) => r.json())
      .then(setLibrary)
      .catch((err) => console.error('Fetch library error:', err))
      .finally(() => setLoading(false));
  }, [libraryIds]);

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

  function handleExport() {
    window.location.href = '/api/library/export';
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/library/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (data.imported !== undefined) {
        onLibraryChange();
        alert(`Importati ${data.imported} manwha nella libreria.`);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Import fallito — controlla che il file sia un JSON valido.');
    } finally {
      e.target.value = '';
    }
  }

  async function handleResetHistory() {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
      return;
    }
    try {
      await fetch('/api/recommended-history', { method: 'DELETE' });
      setResetConfirm(false);
      alert('Cronologia consigli azzerata. La prossima ricerca darà risultati freschi.');
    } catch (err) {
      console.error('Reset error:', err);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">La mia libreria</h2>
          <p className="text-sm text-gray-500 mt-1">{library.length} manwha già letti — esclusi dai consigli AI</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExport}
            disabled={library.length === 0}
            className="flex items-center gap-1.5 bg-card border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Esporta JSON
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1.5 bg-card border border-gray-700 hover:bg-gray-700 text-gray-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Importa JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          <button
            onClick={handleResetHistory}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
              resetConfirm ? 'bg-accent text-white' : 'bg-card border border-gray-700 hover:bg-gray-700 text-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {resetConfirm ? 'Conferma reset' : 'Reset cronologia consigli'}
          </button>
        </div>
      </div>

      {!loading && library.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
          <svg className="w-20 h-20 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-xl font-semibold text-gray-300">Libreria vuota</p>
          <p className="text-sm text-center max-w-sm">Segna un manwha come già letto per escluderlo dai futuri consigli.</p>
        </div>
      )}

      {library.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {library.map((item) => {
            const manga = toCardShape(item);
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
