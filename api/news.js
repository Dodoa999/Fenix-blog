export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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

  const PAGE_SIZE = 50;
  const MAX_PER_SITE = 200; // 🔥 můžeš změnit třeba na 300

  try {

    const fetchSite = async (baseUrl) => {
      let allItems = [];
      let offset = 0;

      while (offset < MAX_PER_SITE) {

        const url = `${baseUrl}?format=json&count=${PAGE_SIZE}&offset=${offset}`;
        const response = await fetch(url);
        const data = await response.json();

        const items =
          data.items ||
          data.entries ||
          data.collection?.items ||
          [];

        if (!items.length) break;

        allItems.push(...items);
        offset += PAGE_SIZE;
      }

      return allItems;
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

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");

    res.status(200).json({
      total: uniquePosts.length,
      posts: uniquePosts
    });

  } catch (error) {
    res.status(500).json({ error: "Aggregation failed" });
  }
}
