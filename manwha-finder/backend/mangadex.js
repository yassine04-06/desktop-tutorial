const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE = 'https://api.mangadex.org';

async function searchManga(title, limit = 5) {
  const params = new URLSearchParams({
    title,
    limit: String(limit),
    'contentRating[]': ['safe', 'suggestive'],
    'originalLanguage[]': 'ko',
    'includes[]': 'cover_art',
  });
  // URLSearchParams doesn't handle array params well, build manually
  const qs = `title=${encodeURIComponent(title)}&limit=${limit}&contentRating[]=safe&contentRating[]=suggestive&originalLanguage[]=ko&includes[]=cover_art`;
  const res = await fetch(`${BASE}/manga?${qs}`);
  if (!res.ok) throw new Error(`MangaDex search failed: ${res.status}`);
  const json = await res.json();
  return json.data.map(normalizeManga);
}

async function getMangaById(id) {
  const res = await fetch(`${BASE}/manga/${id}?includes[]=cover_art`);
  if (!res.ok) throw new Error(`MangaDex fetch manga failed: ${res.status}`);
  const json = await res.json();
  return normalizeManga(json.data);
}

async function getChapterCount(mangaId) {
  try {
    const res = await fetch(`${BASE}/manga/${mangaId}/aggregate?translatedLanguage[]=en`);
    if (!res.ok) return 0;
    const json = await res.json();
    let total = 0;
    if (json.volumes) {
      for (const vol of Object.values(json.volumes)) {
        if (vol.chapters) total += Object.keys(vol.chapters).length;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

async function searchSimilar(queries, excludeId) {
  const seen = new Set([excludeId]);
  const results = [];

  for (const query of queries) {
    try {
      const items = await searchManga(query, 5);
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          results.push(item);
        }
      }
      if (results.length >= 30) break;
    } catch (err) {
      console.error(`Query "${query}" failed:`, err.message);
    }
  }

  // Enrich with chapter counts in parallel (batched)
  const enriched = await Promise.all(
    results.slice(0, 30).map(async (manga) => {
      const chapterCount = await getChapterCount(manga.id);
      return { ...manga, chapterCount };
    })
  );

  return enriched;
}

function normalizeManga(data) {
  const titleObj = data.attributes.title;
  const title = titleObj.en || titleObj.ko || titleObj['ko-ro'] || Object.values(titleObj)[0] || 'Unknown';

  const tags = (data.attributes.tags || []).map((t) => {
    const n = t.attributes.name;
    return n.en || Object.values(n)[0];
  });

  const coverRel = (data.relationships || []).find((r) => r.type === 'cover_art');
  const coverFile = coverRel?.attributes?.fileName;
  const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${data.id}/${coverFile}.256.jpg` : null;

  const updatedAt = data.attributes.updatedAt || data.attributes.lastChapter || null;

  return {
    id: data.id,
    title,
    description: getDescription(data.attributes.description),
    tags,
    status: data.attributes.status,
    year: data.attributes.year,
    coverUrl,
    updatedAt,
    chapterCount: 0,
  };
}

function getDescription(desc) {
  if (!desc) return '';
  return desc.en || desc.ko || Object.values(desc)[0] || '';
}

module.exports = { searchManga, getMangaById, getChapterCount, searchSimilar };
