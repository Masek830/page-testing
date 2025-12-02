import { fetchNews } from "../api/NewsApi";

let cachedNews = null;
let inflight = null;

export async function loadNewsOnce() {
  if (cachedNews) return cachedNews;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const items = await fetchNews();
      cachedNews = Array.isArray(items) ? items : items?.items || [];
    } catch (err) {
      console.error("Error cargando noticias", err);
      cachedNews = [];
    }
    inflight = null;
    return cachedNews;
  })();

  return inflight;
}

export function getCachedNews() {
  return cachedNews;
}
