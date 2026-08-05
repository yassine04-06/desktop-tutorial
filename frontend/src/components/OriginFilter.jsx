import { useState } from 'react';

const ORIGINS = [
  { value: '', label: 'Tutti', flag: '🌐' },
  { value: 'ko', label: 'Manwha', flag: '🇰🇷' },
  { value: 'zh', label: 'Manhua', flag: '🇨🇳' },
  { value: 'ja', label: 'Manga', flag: '🇯🇵' },
];

export default function OriginFilter({ origin, setOrigin }) {
  const [open, setOpen] = useState(false);
  const current = ORIGINS.find((o) => o.value === origin) || ORIGINS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm bg-card border border-gray-700 hover:border-accent text-gray-300 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
      >
        <span>{current.flag}</span>
        {current.label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-44 bg-card border border-gray-700 rounded-xl p-1.5 z-50 shadow-2xl">
            {ORIGINS.map((o) => (
              <button
                key={o.value}
                onClick={() => { setOrigin(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 text-sm px-2.5 py-2 rounded-lg transition-colors text-left ${
                  origin === o.value ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{o.flag}</span>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
