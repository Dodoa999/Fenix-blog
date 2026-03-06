export default async function handler(req, res) {

  const sources = [
    "https://www.greenest-ecosystem.eu/news?format=json&count=50",
    "https://www.apolloproject.eu/news?format=json&count=50",
    "https://www.reuse-batteries.eu/news?format=json&count=50",
    "https://www.perseus-project.eu/news?format=json&count=50",
    "https://www.treasure-project.eu/news?format=json&count=50",
    "https://www.forest-project.eu/news?format=json&count=50",
    "https://www.carbon4minerals.eu/news-events?format=json&count=50",
    "https://www.teapots-project.eu/news?format=json&count=50",
    "https://www.am2pm-project.eu/news?format=json&count=50",
    "https://www.herit4ages.eu/news?format=json&count=50",
    "https://www.fenixtnt.cz/en/news?format=json&count=50"
  ];

  try {

    const responses = await Promise.all(
      sources.map(async (url) => {
        try {
          const response = await fetch(url);
          const data = await response.json();

          const items =
            data.items ||
            data.entries ||
            data.collection?.items ||
            [];

          return items.map(item => ({
            id: item.id,
            title: item.title,
            link: item.fullUrl || item.url,
            image: item.assetUrl || item.thumbnail || "",
            excerpt: item.excerpt || "",
            date: new Date(item.publishOn || item.pubDate || 0)
          }));

        } catch (err) {
          return [];
        }
      })
    );

    let allPosts = responses.flat();

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
