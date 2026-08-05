const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { searchManga, getMangaById, getChapterCount, searchSimilar, getGenres, searchByGenre, fetchCoverImage, enrichWithChapterCounts } = require('./mangadex');
const {
  saveFavorite, getFavorites, deleteFavorite,
  saveSearchHistory, getSearchHistory,
  addToLibrary, getLibrary, getLibraryIds, removeFromLibrary, importLibrary,
  saveRecommended, getRecommendedIds, clearRecommendedHistory,
} = require('./db');

const app = express();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/search', async (req, res) => {
  const { title, origin } = req.query;
  if (!title) return res.status(400).json({ error: 'title param required' });
  try {
    const libraryIds = new Set(await getLibraryIds());
    const results = await searchManga(title, 40, origin);
    const enriched = await enrichWithChapterCounts(results.filter((m) => !libraryIds.has(m.id)));
    res.json(enriched);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/api/similar', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id param required' });
  try {
    const source = await getMangaById(id);
    const tagList = source.tags.join(', ');

    let queries;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system:
          'You are a manwha recommendation expert. Given a list of tags and genres, return a JSON array of 20 search queries (single keywords or short phrases) that would find similar manwha on MangaDex. Return ONLY a raw JSON array of strings, no markdown, no explanation.',
        messages: [{ role: 'user', content: `Tags and genres: ${tagList}` }],
      });
      queries = JSON.parse(message.content[0].text);
    } catch {
      queries = source.tags.slice(0, 20);
    }

    const libraryIds = new Set(await getLibraryIds());
    const seenIds = new Set(await getRecommendedIds());
    const excludeIds = new Set([id, ...libraryIds, ...seenIds]);

    const results = await searchSimilar(queries, excludeIds);

    await saveRecommended(results.map((r) => r.id));

    res.json(results);
  } catch (err) {
    console.error('Similar error:', err.message);
    res.status(500).json({ error: 'Similar search failed' });
  }
});

// ── Genres ────────────────────────────────────────────────────────────────────

app.get('/api/genres', async (req, res) => {
  try {
    const genres = await getGenres();
    res.json(genres);
  } catch (err) {
    console.error('Genres error:', err.message);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/search-by-genre', async (req, res) => {
  const { tag, origin } = req.query;
  if (!tag) return res.status(400).json({ error: 'tag param required' });
  try {
    const libraryIds = new Set(await getLibraryIds());
    const results = await searchByGenre(tag, 40, origin);
    res.json(results.filter((m) => !libraryIds.has(m.id)));
  } catch (err) {
    console.error('Search by genre error:', err.message);
    res.status(500).json({ error: 'Genre search failed' });
  }
});

// ── Cover proxy (bypasses MangaDex's anti-hotlink placeholder) ────────────────

// Query params, not path segments — Vercel routes a path ending in a known
// static-file extension (this one ends in .jpg) to its static-asset lookup
// before it ever considers serverless functions, so /api/cover/:id/:file.jpg
// 404'd at the platform level without ever reaching Express. A query string
// is never treated as part of that extension check.
app.get('/api/cover', async (req, res) => {
  const { mangaId, filename } = req.query;
  if (!mangaId || !filename) return res.status(400).json({ error: 'mangaId and filename required' });
  try {
    const upstream = await fetchCoverImage(mangaId, filename);
    if (!upstream.ok) {
      console.error(`Cover proxy upstream ${upstream.status} for ${mangaId}/${filename}`);
      return res.status(upstream.status).end();
    }
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Cover proxy error:', err.message);
    res.status(502).end();
  }
});

// Full manga details on demand — used when opening the detail modal from
// Favorites/Library, where only the compact saved fields (title, cover,
// chapter count, status) are stored, not the full description/tags.
app.get('/api/manga/:id', async (req, res) => {
  try {
    const manga = await getMangaById(req.params.id);
    const chapterCount = await getChapterCount(req.params.id);
    res.json({ ...manga, chapterCount });
  } catch (err) {
    console.error('Manga detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch manga details' });
  }
});

// ── Chapter count ─────────────────────────────────────────────────────────────

app.get('/api/manga/:id/chapters', async (req, res) => {
  try {
    const count = await getChapterCount(req.params.id);
    res.json({ chapterCount: count });
  } catch (err) {
    console.error('Chapters error:', err.message);
    res.status(500).json({ error: 'Chapter fetch failed' });
  }
});

app.post('/api/favorites', async (req, res) => {
  const { id, title, cover_url, chapter_count, status } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  try {
    await saveFavorite({ id, title, cover_url, chapter_count, status });
    res.json({ success: true });
  } catch (err) {
    console.error('Save favorite error:', err.message);
    res.status(500).json({ error: 'Save failed' });
  }
});

app.get('/api/favorites', async (req, res) => {
  try { res.json(await getFavorites()); }
  catch (err) { console.error('Get favorites error:', err.message); res.status(500).json({ error: 'Fetch failed' }); }
});

app.delete('/api/favorites/:id', async (req, res) => {
  try { await deleteFavorite(req.params.id); res.json({ success: true }); }
  catch (err) { console.error('Delete favorite error:', err.message); res.status(500).json({ error: 'Delete failed' }); }
});

app.get('/api/history', async (req, res) => {
  try { res.json(await getSearchHistory()); }
  catch (err) { console.error('History error:', err.message); res.status(500).json({ error: 'History fetch failed' }); }
});

app.post('/api/history', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  try { await saveSearchHistory(query); res.json({ success: true }); }
  catch (err) { console.error('Save history error:', err.message); res.status(500).json({ error: 'Save history failed' }); }
});

app.get('/api/library', async (req, res) => {
  try { res.json(await getLibrary()); }
  catch (err) { console.error('Library fetch error:', err.message); res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/library', async (req, res) => {
  const { id, title, cover_url, chapter_count, status } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  try { await addToLibrary({ id, title, cover_url, chapter_count, status }); res.json({ success: true }); }
  catch (err) { console.error('Add library error:', err.message); res.status(500).json({ error: 'Save failed' }); }
});

app.delete('/api/library/:id', async (req, res) => {
  try { await removeFromLibrary(req.params.id); res.json({ success: true }); }
  catch (err) { console.error('Remove library error:', err.message); res.status(500).json({ error: 'Delete failed' }); }
});

app.get('/api/library/export', async (req, res) => {
  try {
    const data = await getLibrary();
    res.setHeader('Content-Disposition', 'attachment; filename="manwha-library.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

app.post('/api/library/import', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected a JSON array' });
  try {
    const normalized = items.map((item) => ({
      id: item.id,
      title: item.title,
      cover_url: item.cover_url || item.coverUrl || null,
      chapter_count: item.chapter_count || item.chapterCount || 0,
      status: item.status || null,
    })).filter((i) => i.id && i.title);
    await importLibrary(normalized);
    res.json({ imported: normalized.length });
  } catch (err) {
    console.error('Import error:', err.message);
    res.status(500).json({ error: 'Import failed' });
  }
});

app.delete('/api/recommended-history', async (req, res) => {
  try {
    await clearRecommendedHistory();
    res.json({ success: true });
  } catch (err) {
    console.error('Reset history error:', err.message);
    res.status(500).json({ error: 'Reset failed' });
  }
});

module.exports = app;
