const { createClient } = require('@libsql/client');
const path = require('path');

// TURSO_DATABASE_URL/TURSO_AUTH_TOKEN point at a hosted Turso (libSQL) database
// in production. Without them, falls back to a local SQLite file — same
// engine, zero cloud setup required to develop. On Vercel the deployed
// function bundle is read-only outside /tmp, so the fallback path there is
// /tmp (ephemeral, but at least writable) instead of __dirname; set the Turso
// env vars in the Vercel project for data that actually persists.
const localDbPath = process.env.VERCEL
  ? '/tmp/manwha.db'
  : path.join(__dirname, 'manwha.db');

const db = createClient(
  process.env.TURSO_DATABASE_URL
    ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: `file:${localDbPath}` }
);

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover_url TEXT,
    chapter_count INTEGER,
    status TEXT,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS library (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover_url TEXT,
    chapter_count INTEGER,
    status TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS recommended_history (
    id TEXT NOT NULL,
    recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
];

// Netlify Functions are stateless per invocation, so schema creation can't
// happen once at process start the way it did with a persistent server —
// this promise runs once per cold start and every exported function awaits
// it first, memoized so warm invocations skip straight through.
const ready = (async () => {
  for (const statement of SCHEMA) {
    await db.execute(statement);
  }
})();

async function saveFavorite({ id, title, cover_url, chapter_count, status }) {
  await ready;
  // libSQL rejects `undefined` bind params (unlike better-sqlite3, which
  // coerced them to NULL) — normalize optional fields explicitly.
  await db.execute({
    sql: `INSERT OR REPLACE INTO favorites (id, title, cover_url, chapter_count, status) VALUES (?, ?, ?, ?, ?)`,
    args: [id, title, cover_url ?? null, chapter_count ?? null, status ?? null],
  });
}

async function getFavorites() {
  await ready;
  const rs = await db.execute('SELECT * FROM favorites ORDER BY saved_at DESC');
  return rs.rows;
}

async function deleteFavorite(id) {
  await ready;
  await db.execute({ sql: 'DELETE FROM favorites WHERE id = ?', args: [id] });
}

async function saveSearchHistory(query) {
  await ready;
  await db.execute({ sql: 'INSERT INTO search_history (query) VALUES (?)', args: [query] });
}

async function getSearchHistory() {
  await ready;
  const rs = await db.execute('SELECT * FROM search_history ORDER BY searched_at DESC LIMIT 20');
  return rs.rows;
}

// Library (already-read manwha — excluded from recommendations)
async function addToLibrary({ id, title, cover_url, chapter_count, status }) {
  await ready;
  await db.execute({
    sql: `INSERT OR REPLACE INTO library (id, title, cover_url, chapter_count, status) VALUES (?, ?, ?, ?, ?)`,
    args: [id, title, cover_url ?? null, chapter_count ?? null, status ?? null],
  });
}

async function getLibrary() {
  await ready;
  const rs = await db.execute('SELECT * FROM library ORDER BY added_at DESC');
  return rs.rows;
}

async function getLibraryIds() {
  await ready;
  const rs = await db.execute('SELECT id FROM library');
  return rs.rows.map((r) => r.id);
}

async function removeFromLibrary(id) {
  await ready;
  await db.execute({ sql: 'DELETE FROM library WHERE id = ?', args: [id] });
}

async function importLibrary(items) {
  await ready;
  if (items.length === 0) return;
  const statements = items.map((item) => ({
    sql: `INSERT OR IGNORE INTO library (id, title, cover_url, chapter_count, status) VALUES (?, ?, ?, ?, ?)`,
    args: [item.id, item.title, item.cover_url ?? null, item.chapter_count ?? null, item.status ?? null],
  }));
  await db.batch(statements, 'write');
}

// Recommendation history — track what was ever shown so AI can avoid it
async function saveRecommended(ids) {
  await ready;
  if (ids.length === 0) return;
  const statements = ids.map((id) => ({
    sql: 'INSERT OR IGNORE INTO recommended_history (id) VALUES (?)',
    args: [id],
  }));
  await db.batch(statements, 'write');
}

async function getRecommendedIds() {
  await ready;
  const rs = await db.execute('SELECT id FROM recommended_history');
  return rs.rows.map((r) => r.id);
}

async function clearRecommendedHistory() {
  await ready;
  await db.execute('DELETE FROM recommended_history');
}

module.exports = {
  saveFavorite, getFavorites, deleteFavorite,
  saveSearchHistory, getSearchHistory,
  addToLibrary, getLibrary, getLibraryIds, removeFromLibrary, importLibrary,
  saveRecommended, getRecommendedIds, clearRecommendedHistory,
};
