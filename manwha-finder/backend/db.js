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

  CREATE TABLE IF NOT EXISTS library (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover_url TEXT,
    chapter_count INTEGER,
    status TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recommended_history (
    id TEXT NOT NULL,
    recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  );
`);

function saveFavorite({ id, title, cover_url, chapter_count, status }) {
  db.prepare(`
    INSERT OR REPLACE INTO favorites (id, title, cover_url, chapter_count, status)
    VALUES (@id, @title, @cover_url, @chapter_count, @status)
  `).run({ id, title, cover_url, chapter_count, status });
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

// Library (already-read manwha — excluded from recommendations)
function addToLibrary({ id, title, cover_url, chapter_count, status }) {
  db.prepare(`
    INSERT OR REPLACE INTO library (id, title, cover_url, chapter_count, status)
    VALUES (@id, @title, @cover_url, @chapter_count, @status)
  `).run({ id, title, cover_url, chapter_count, status });
}

function getLibrary() {
  return db.prepare('SELECT * FROM library ORDER BY added_at DESC').all();
}

function getLibraryIds() {
  return db.prepare('SELECT id FROM library').all().map((r) => r.id);
}

function removeFromLibrary(id) {
  db.prepare('DELETE FROM library WHERE id = ?').run(id);
}

function importLibrary(items) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO library (id, title, cover_url, chapter_count, status)
    VALUES (@id, @title, @cover_url, @chapter_count, @status)
  `);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) stmt.run(row);
  });
  insertMany(items);
}

// Recommendation history — track what was ever shown so AI can avoid it
function saveRecommended(ids) {
  const stmt = db.prepare('INSERT OR IGNORE INTO recommended_history (id) VALUES (?)');
  const insertMany = db.transaction((rows) => {
    for (const id of rows) stmt.run(id);
  });
  insertMany(ids);
}

function getRecommendedIds() {
  return db.prepare('SELECT id FROM recommended_history').all().map((r) => r.id);
}

function clearRecommendedHistory() {
  db.prepare('DELETE FROM recommended_history').run();
}

module.exports = {
  saveFavorite, getFavorites, deleteFavorite,
  saveSearchHistory, getSearchHistory,
  addToLibrary, getLibrary, getLibraryIds, removeFromLibrary, importLibrary,
  saveRecommended, getRecommendedIds, clearRecommendedHistory,
};
