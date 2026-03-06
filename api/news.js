export default async function handler(req, res) {

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

  const OFFSETS = [0, 50, 100, 150];

  try {

    const fetchSite = async (baseUrl) => {

      const requests = OFFSETS.map(offset =>
        fetch(`${baseUrl}?format=json&count=50&offset=${offset}`)
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

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");

    res.status(200).json({
      total: uniquePosts.length,
      posts: uniquePosts
    });

  } catch (error) {
    res.status(500).json({ error: "Aggregation failed" });
  }
}
