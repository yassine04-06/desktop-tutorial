require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { searchManga, getMangaById, getChapterCount, searchSimilar } = require('./mangadex');
const {
  saveFavorite, getFavorites, deleteFavorite,
  saveSearchHistory, getSearchHistory,
  addToLibrary, getLibrary, getLibraryIds, removeFromLibrary, importLibrary,
  saveRecommended, getRecommendedIds, clearRecommendedHistory,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Search ────────────────────────────────────────────────────────────────────

app.get('/api/search', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'title param required' });
  try {
    const results = await searchManga(title, 5);
    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── Similar (AI-powered, excludes library + recommendation history) ───────────

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

    // Build the exclusion set: source + library + previously recommended
    const libraryIds = new Set(getLibraryIds());
    const seenIds = new Set(getRecommendedIds());
    const excludeIds = new Set([id, ...libraryIds, ...seenIds]);

    const results = await searchSimilar(queries, excludeIds);

    // Persist what we're about to show so it won't repeat next time
    saveRecommended(results.map((r) => r.id));

    res.json(results);
  } catch (err) {
    console.error('Similar error:', err.message);
    res.status(500).json({ error: 'Similar search failed' });
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

// ── Favorites ─────────────────────────────────────────────────────────────────

app.post('/api/favorites', (req, res) => {
  const { id, title, cover_url, chapter_count, status } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  try {
    saveFavorite({ id, title, cover_url, chapter_count, status });
    res.json({ success: true });
  } catch (err) {
    console.error('Save favorite error:', err.message);
    res.status(500).json({ error: 'Save failed' });
  }
});

app.get('/api/favorites', (req, res) => {
  try { res.json(getFavorites()); }
  catch (err) { console.error('Get favorites error:', err.message); res.status(500).json({ error: 'Fetch failed' }); }
});

app.delete('/api/favorites/:id', (req, res) => {
  try { deleteFavorite(req.params.id); res.json({ success: true }); }
  catch (err) { console.error('Delete favorite error:', err.message); res.status(500).json({ error: 'Delete failed' }); }
});

// ── Search history ────────────────────────────────────────────────────────────

app.get('/api/history', (req, res) => {
  try { res.json(getSearchHistory()); }
  catch (err) { console.error('History error:', err.message); res.status(500).json({ error: 'History fetch failed' }); }
});

app.post('/api/history', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  try { saveSearchHistory(query); res.json({ success: true }); }
  catch (err) { console.error('Save history error:', err.message); res.status(500).json({ error: 'Save history failed' }); }
});

// ── Library ───────────────────────────────────────────────────────────────────

app.get('/api/library', (req, res) => {
  try { res.json(getLibrary()); }
  catch (err) { console.error('Library fetch error:', err.message); res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/library', (req, res) => {
  const { id, title, cover_url, chapter_count, status } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  try { addToLibrary({ id, title, cover_url, chapter_count, status }); res.json({ success: true }); }
  catch (err) { console.error('Add library error:', err.message); res.status(500).json({ error: 'Save failed' }); }
});

app.delete('/api/library/:id', (req, res) => {
  try { removeFromLibrary(req.params.id); res.json({ success: true }); }
  catch (err) { console.error('Remove library error:', err.message); res.status(500).json({ error: 'Delete failed' }); }
});

// Export library as JSON
app.get('/api/library/export', (req, res) => {
  try {
    const data = getLibrary();
    res.setHeader('Content-Disposition', 'attachment; filename="manwha-library.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Import library from JSON array
app.post('/api/library/import', (req, res) => {
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
    importLibrary(normalized);
    res.json({ imported: normalized.length });
  } catch (err) {
    console.error('Import error:', err.message);
    res.status(500).json({ error: 'Import failed' });
  }
});

// Reset recommendation history so the AI can suggest previously shown manwha again
app.delete('/api/recommended-history', (req, res) => {
  try {
    clearRecommendedHistory();
    res.json({ success: true });
  } catch (err) {
    console.error('Reset history error:', err.message);
    res.status(500).json({ error: 'Reset failed' });
  }
});

app.listen(PORT, () => {
  console.log(`ManwhaFinder backend running on http://localhost:${PORT}`);
});
