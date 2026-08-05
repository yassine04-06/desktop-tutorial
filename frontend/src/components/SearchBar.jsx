import { useState, useEffect } from 'react';

export default function SearchBar({ onResults, onLoading, quickStartTitle, quickStartNonce, origin }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  async function runSearch(title) {
    onLoading(true);
    setSearching(true);
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title }),
      });
      const originParam = origin ? `&origin=${origin}` : '';
      const res = await fetch(`/api/search?title=${encodeURIComponent(title)}${originParam}`);
      const data = await res.json();
      onResults(data, title);
    } catch (err) {
      console.error('Search error:', err);
      onResults([], title);
    } finally {
      setSearching(false);
      onLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    runSearch(query.trim());
  }

  // Triggered by clicking a "popular search" chip on the landing state.
  useEffect(() => {
    if (!quickStartTitle || !quickStartNonce) return;
    setQuery(quickStartTitle);
    runSearch(quickStartTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickStartNonce]);

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca per titolo o parola chiave..."
        className="flex-1 bg-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
      />
      <button
        type="submit"
        disabled={searching}
        className="bg-accent hover:bg-accent-dark disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
      >
        {searching ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        )}
        Cerca
      </button>
    </form>
  );
}
