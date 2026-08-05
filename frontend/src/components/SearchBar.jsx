import { useState, useRef, useEffect } from 'react';

export default function SearchBar({ onSimilarResults, onLoading, quickStartTitle, quickStartNonce }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function doSearch(title) {
    const res = await fetch(`/api/search?title=${encodeURIComponent(title)}`);
    return res.json();
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSuggestions([]);
    try {
      const data = await doSearch(query);
      setSuggestions(data);
      setShowDropdown(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(manga) {
    setShowDropdown(false);
    setQuery(manga.title);
    onLoading(true);
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: manga.title }),
      });
      const res = await fetch(`/api/similar?id=${manga.id}`);
      const data = await res.json();
      onSimilarResults(data, manga);
    } catch (err) {
      console.error('Similar fetch error:', err);
      onSimilarResults([], manga);
    } finally {
      onLoading(false);
    }
  }

  // Triggered by clicking a "popular search" chip on the landing state —
  // searches and jumps straight to the top match's similar results.
  useEffect(() => {
    if (!quickStartTitle || !quickStartNonce) return;
    let cancelled = false;
    (async () => {
      setQuery(quickStartTitle);
      setSearching(true);
      try {
        const data = await doSearch(quickStartTitle);
        if (cancelled) return;
        if (data.length > 0) {
          await handleSelect(data[0]);
        } else {
          setSuggestions([]);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Quick-start search error:', err);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickStartNonce]);

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a manwha title..."
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
          Search
        </button>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-gray-700 rounded-xl overflow-hidden z-50 shadow-2xl">
          {suggestions.map((manga) => (
            <button
              key={manga.id}
              onClick={() => handleSelect(manga)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
            >
              {manga.coverUrl ? (
                <img
                  src={manga.coverUrl}
                  alt={manga.title}
                  className="w-10 h-14 object-cover rounded flex-shrink-0"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-10 h-14 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-100 truncate">{manga.title}</p>
                <p className="text-sm text-gray-400">
                  {manga.status} {manga.year ? `· ${manga.year}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && suggestions.length === 0 && !searching && (
        <div className="absolute top-full mt-2 w-full bg-card border border-gray-700 rounded-xl px-4 py-3 z-50 text-gray-400 text-sm">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
