let cachedPosts = [];
let lastFetchTime = 0;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minut
const PAGE_SIZE = 50;
const OFFSETS = [0, 50, 100, 150, 200, 250]; // až 300 článků

const baseSources = [
  "https://www.greenest-ecosystem.eu/news",
  "https://www.apolloproject.eu/news",
  "https://www.reuse-batteries.eu/news",
  "https://www.perseus-project.eu/news",
  "https://www.treasure-project.eu/news",
  "https://www.forest-project.eu/news",
  "https://www.carbon4minerals.eu/news-events",
  "https://www.teapots-project.eu/news",
  "https://www.am2pm-project.eu/news",
  "https://www.herit4ages.eu/news",
  "https://www.fenixtnt.cz/en/news"
];

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const now = Date.now();

  // 🔥 Pokud máme čerstvá data, jen je vrať
  if (cachedPosts.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return res.status(200).json({
      total: cachedPosts.length,
      posts: cachedPosts
    });
  }

  try {

    const fetchSite = async (baseUrl) => {

      const requests = OFFSETS.map(offset =>
        fetch(`${baseUrl}?format=json&count=${PAGE_SIZE}&offset=${offset}`)
          .then(res => res.json())
          .catch(() => null)
      );

      const responses = await Promise.all(requests);

      let items = [];

      responses.forEach(data => {
        if (!data) return;

        const chunk =
          data.items ||
          data.entries ||
          data.collection?.items ||
          [];

        items.push(...chunk);
      });

      return items;
    };

    const results = await Promise.all(
      baseSources.map(fetchSite)
    );

    let allPosts = results.flat().map(item => ({
      id: item.id,
      title: item.title,
      link: item.fullUrl || item.url,
      image: item.assetUrl || item.thumbnail || "",
      excerpt: item.excerpt || "",
      date: new Date(item.publishOn || item.pubDate || 0)
    }));

    const uniquePosts = Array.from(
      new Map(allPosts.map(item => [item.id, item])).values()
    );

    uniquePosts.sort((a, b) => b.date - a.date);

    // 🔥 uložíme do cache
    cachedPosts = uniquePosts;
    lastFetchTime = now;

    res.status(200).json({
      total: uniquePosts.length,
      posts: uniquePosts
    });

  } catch (error) {
    res.status(500).json({ error: "Aggregation failed" });
  }
}
