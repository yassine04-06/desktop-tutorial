import { useEffect, useRef, useState } from 'react';

export default function LibraryPanel({ isOpen, onClose, libraryIds, onLibraryChange }) {
  const [library, setLibrary] = useState([]);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/library')
      .then((r) => r.json())
      .then(setLibrary)
      .catch((err) => console.error('Fetch library error:', err));
  }, [isOpen, libraryIds]);

  async function handleRemove(id) {
    try {
      await fetch(`/api/library/${id}`, { method: 'DELETE' });
      setLibrary((prev) => prev.filter((m) => m.id !== id));
      onLibraryChange();
    } catch (err) {
      console.error('Remove library error:', err);
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
        const updated = await fetch('/api/library').then((r) => r.json());
        setLibrary(updated);
        onLibraryChange();
        alert(`Imported ${data.imported} manwha into your library.`);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Import failed — make sure the file is a valid JSON array.');
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
      alert('Recommendation history cleared. Fresh results next search.');
    } catch (err) {
      console.error('Reset error:', err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="relative bg-[#12122a] w-80 max-w-full h-full flex flex-col slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-100">My Library</h2>
            <p className="text-xs text-gray-500">These are excluded from recommendations</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 transition-colors" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-b border-gray-800 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={library.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
            <button
              onClick={handleImportClick}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          </div>

          <button
            onClick={handleResetHistory}
            className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-colors ${
              resetConfirm
                ? 'bg-accent text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {resetConfirm ? 'Tap again to confirm reset' : 'Reset recommendation history'}
          </button>
        </div>

        {/* Library list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {library.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 text-center">
              <svg className="w-14 h-14 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-sm">Library is empty</p>
              <p className="text-xs px-4">Add manwha you've already read — they'll be excluded from future recommendations.</p>
            </div>
          )}

          {library.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl p-2">
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-10 h-14 object-cover rounded flex-shrink-0"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-10 h-14 bg-gray-700 rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate">{item.title}</p>
                {item.chapter_count > 0 && (
                  <p className="text-xs text-accent">{item.chapter_count} ch</p>
                )}
                <p className="text-xs text-gray-500 capitalize">{item.status || 'Unknown'}</p>
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-gray-500 hover:text-accent transition-colors flex-shrink-0"
                aria-label="Remove from library"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {library.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-800 text-center text-xs text-gray-500">
            {library.length} manwha in library
          </div>
        )}
      </aside>
    </div>
  );
}
