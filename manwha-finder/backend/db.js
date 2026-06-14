const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'manwha.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover_url TEXT,
    chapter_count INTEGER,
    status TEXT,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function saveFavorite({ id, title, cover_url, chapter_count, status }) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO favorites (id, title, cover_url, chapter_count, status)
    VALUES (@id, @title, @cover_url, @chapter_count, @status)
  `);
  stmt.run({ id, title, cover_url, chapter_count, status });
}

function getFavorites() {
  return db.prepare('SELECT * FROM favorites ORDER BY saved_at DESC').all();
}

function deleteFavorite(id) {
  db.prepare('DELETE FROM favorites WHERE id = ?').run(id);
}

function saveSearchHistory(query) {
  db.prepare('INSERT INTO search_history (query) VALUES (?)').run(query);
}

function getSearchHistory() {
  return db.prepare('SELECT * FROM search_history ORDER BY searched_at DESC LIMIT 20').all();
}

module.exports = { saveFavorite, getFavorites, deleteFavorite, saveSearchHistory, getSearchHistory };
