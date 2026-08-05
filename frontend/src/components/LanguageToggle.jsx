const LANGUAGES = [
  { value: 'it', label: 'IT' },
  { value: 'en', label: 'EN' },
];

export default function LanguageToggle({ preferredLang, setPreferredLang }) {
  return (
    <div className="flex items-center bg-card border border-gray-700 rounded-full p-0.5" role="group" aria-label="Preferred reading language">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.value}
          onClick={() => setPreferredLang(lang.value)}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
            preferredLang === lang.value
              ? 'bg-accent text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          aria-pressed={preferredLang === lang.value}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
