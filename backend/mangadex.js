const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE = 'https://api.mangadex.org';

async function searchManga(title, limit = 5) {
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

async function enrichWithChapterCounts(results) {
  return Promise.all(
    results.map(async (manga) => {
      const chapterCount = await getChapterCount(manga.id);
      return { ...manga, chapterCount };
    })
  );
}

async function getChapterCount(mangaId) {
  try {
    const res = await fetch(`${BASE}/manga/${mangaId}/aggregate?translatedLanguage[]=en&translatedLanguage[]=it`);
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

// Genres/themes list from MangaDex's tag taxonomy, for browsing by genre
// instead of by title.
async function getGenres() {
  const res = await fetch(`${BASE}/manga/tag`);
  if (!res.ok) throw new Error(`MangaDex tags failed: ${res.status}`);
  const json = await res.json();
  return json.data
    .filter((t) => t.attributes.group === 'genre')
    .map((t) => ({ id: t.id, name: t.attributes.name.en || Object.values(t.attributes.name)[0] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function searchByGenre(tagId, limit = 30) {
  const qs = `includedTags[]=${tagId}&limit=${limit}&contentRating[]=safe&contentRating[]=suggestive&originalLanguage[]=ko&includes[]=cover_art&order[followedCount]=desc`;
  const res = await fetch(`${BASE}/manga?${qs}`);
  if (!res.ok) throw new Error(`MangaDex genre search failed: ${res.status}`);
  const json = await res.json();
  return enrichWithChapterCounts(json.data.map(normalizeManga));
}

// excludeIds can be a string (single id) or a Set of ids
async function searchSimilar(queries, excludeIds) {
  const seen = typeof excludeIds === 'string' ? new Set([excludeIds]) : new Set(excludeIds);
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

  return enrichWithChapterCounts(results.slice(0, 30));
}

function normalizeManga(data) {
  const titleObj = data.attributes.title;
  const title = titleObj.en || titleObj.ko || titleObj['ko-ro'] || Object.values(titleObj)[0] || 'Unknown';

  const tags = (data.attributes.tags || []).map((t) => {
    const n = t.attributes.name;
    return n.en || Object.values(n)[0];
  });

  // Routed through our own /api/cover proxy rather than linking directly to
  // uploads.mangadex.org — MangaDex serves a "read this at mangadex.org"
  // placeholder image instead of the real cover when it's hotlinked straight
  // from a third-party browser tab, so the request needs to go through our
  // server first.
  const coverRel = (data.relationships || []).find((r) => r.type === 'cover_art');
  const coverFile = coverRel?.attributes?.fileName;
  const coverUrl = coverFile ? `/api/cover/${data.id}/${coverFile}` : null;

  const updatedAt = data.attributes.updatedAt || data.attributes.lastChapter || null;

  const languages = data.attributes.availableTranslatedLanguages || [];

  const descAttr = data.attributes.description || {};

  return {
    id: data.id,
    title,
    description: descAttr.en || descAttr.ko || Object.values(descAttr)[0] || '',
    descriptions: { en: descAttr.en || '', it: descAttr.it || '' },
    tags,
    status: data.attributes.status,
    year: data.attributes.year,
    coverUrl,
    updatedAt,
    languages,
    chapterCount: 0,
  };
}

// Fetches a cover image server-side with a Referer MangaDex's CDN accepts,
// so the real artwork comes back instead of their anti-hotlink placeholder.
async function fetchCoverImage(mangaId, filename) {
  const res = await fetch(`https://uploads.mangadex.org/covers/${mangaId}/${filename}.256.jpg`, {
    headers: {
      Referer: 'https://mangadex.org/',
      'User-Agent': 'Mozilla/5.0 (compatible; ManwhaFinder/1.0; +https://mangadex.org)',
    },
  });
  return res;
}

module.exports = { searchManga, getMangaById, getChapterCount, searchSimilar, getGenres, searchByGenre, fetchCoverImage, enrichWithChapterCounts };
