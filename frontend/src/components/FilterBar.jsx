const SORT_OPTIONS = [
  { value: 'chapters_desc', label: 'Most Chapters' },
  { value: 'chapters_asc', label: 'Fewest Chapters' },
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'updated_asc', label: 'Oldest Updated' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'ongoing', label: 'Ongoing' },
];

export default function FilterBar({ sort, setSort, statusFilter, setStatusFilter, minChapters, setMinChapters }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4">
        {/* Sort */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sort === opt.value
                  ? 'bg-accent text-white'
                  : 'bg-card text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Status:</span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-accent text-white'
                  : 'bg-card text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 50+ chapters toggle */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Chapters:</span>
          <button
            onClick={() => setMinChapters(minChapters === 50 ? 0 : 50)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              minChapters === 50
                ? 'bg-accent text-white'
                : 'bg-card text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {minChapters === 50 && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            50+ chapters
          </button>
        </div>
      </div>
    </div>
  );
}
