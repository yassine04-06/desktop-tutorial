require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { searchManga, getMangaById, getChapterCount, searchSimilar } = require('./mangadex');
const { saveFavorite, getFavorites, deleteFavorite, saveSearchHistory, getSearchHistory } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

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

app.get('/api/similar', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id param required' });
  try {
    const source = await getMangaById(id);
    const tagList = source.tags.join(', ');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system:
        'You are a manwha recommendation expert. Given a list of tags and genres, return a JSON array of 20 search queries (single keywords or short phrases) that would find similar manwha on MangaDex. Return ONLY a raw JSON array of strings, no markdown, no explanation.',
      messages: [{ role: 'user', content: `Tags and genres: ${tagList}` }],
    });

    let queries;
    try {
      queries = JSON.parse(message.content[0].text);
    } catch {
      // Fallback: use tags directly as queries
      queries = source.tags.slice(0, 20);
    }

    const results = await searchSimilar(queries, id);
    res.json(results);
  } catch (err) {
    console.error('Similar error:', err.message);
    res.status(500).json({ error: 'Similar search failed' });
  }
});

app.get('/api/manga/:id/chapters', async (req, res) => {
  try {
    const count = await getChapterCount(req.params.id);
    res.json({ chapterCount: count });
  } catch (err) {
    console.error('Chapters error:', err.message);
    res.status(500).json({ error: 'Chapter fetch failed' });
  }
});

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
  try {
    res.json(getFavorites());
  } catch (err) {
    console.error('Get favorites error:', err.message);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.delete('/api/favorites/:id', (req, res) => {
  try {
    deleteFavorite(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete favorite error:', err.message);
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.get('/api/history', (req, res) => {
  try {
    res.json(getSearchHistory());
  } catch (err) {
    console.error('History error:', err.message);
    res.status(500).json({ error: 'History fetch failed' });
  }
});

app.post('/api/history', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  try {
    saveSearchHistory(query);
    res.json({ success: true });
  } catch (err) {
    console.error('Save history error:', err.message);
    res.status(500).json({ error: 'Save history failed' });
  }
});

app.listen(PORT, () => {
  console.log(`ManwhaFinder backend running on http://localhost:${PORT}`);
});
