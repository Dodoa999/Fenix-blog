export default async function handler(req, res) {

  const sources = [
    { url: "https://www.greenest-ecosystem.eu/news?format=json&count=50", logo: "logo", name: "Greenest" },
    { url: "https://www.apolloproject.eu/news?format=json&count=50", logo: "logo", name: "Apollo" },
    { url: "https://www.reuse-batteries.eu/news?format=json&count=50", logo: "logo", name: "Reuse Batteries" },
    { url: "https://www.perseus-project.eu/news?format=json&count=50", logo: "logo", name: "Perseus" },
    { url: "https://www.treasure-project.eu/news?format=json&count=50", logo: "logo", name: "Treasure" },
    { url: "https://www.forest-project.eu/news?format=json&count=50", logo: "logo", name: "Forest" },
    { url: "https://www.carbon4minerals.eu/news-events?format=json&count=50", logo: "logo", name: "Carbon4Minerals" },
    { url: "https://www.teapots-project.eu/news?format=json&count=50", logo: "logo", name: "Teapots" },
    { url: "https://www.am2pm-project.eu/news?format=json&count=50", logo: "logo", name: "AM2PM" },
    { url: "https://www.herit4ages.eu/news?format=json&count=50", logo: "logo", name: "Herit4Ages" },
    { url: "https://www.fenixtnt.cz/en/news?format=json&count=50", logo: "logo", name: "Fenix TNT" }
  ];

  try {

    const responses = await Promise.all(
      sources.map(async (source) => {
        try {
          const response = await fetch(source.url);
          const data = await response.json();

          const items =
            data.entries ||
            data.collection?.items ||
            [];

          return items.map(item => ({
            id: item.id,
            title: item.title,
            link: item.fullUrl || item.url,
            image: item.assetUrl || item.thumbnail || "",
            excerpt: item.excerpt || "",
            date: new Date(item.publishOn || item.pubDate),
            project: source.name
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
    res.status(500).json({ error: "Feed aggregation failed" });
  }
}
