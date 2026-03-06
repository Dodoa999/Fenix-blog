import { kv } from "@vercel/kv";

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

    // 1️⃣ načteme archiv z KV
    let archive = await kv.get("news-archive");
    if (!archive) archive = [];

    // 2️⃣ stáhneme nové články
    const responses = await Promise.all(
      sources.map(async (url) => {
        try {
          const response = await fetch(url);
          const data = await response.json();

          if (!data.items) return [];

          return data.items.map(item => ({
            id: item.id || item.guid || item.url,
            title: item.title,
            link: item.fullUrl || item.url,
            image: item.assetUrl || "",
            excerpt: item.excerpt || "",
            date: item.publishOn
          }));

        } catch {
          return [];
        }
      })
    );

    let newPosts = responses.flat();

    // 3️⃣ spojíme archiv + nové články
    let combined = [...archive, ...newPosts];

    // 4️⃣ odstraníme duplicity podle ID
    const uniquePosts = Array.from(
      new Map(combined.map(item => [item.id, item])).values()
    );

    // 5️⃣ seřadíme podle data
    uniquePosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 6️⃣ uložíme zpět do KV
    await kv.set("news-archive", uniquePosts);

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");

    res.status(200).json({
      total: uniquePosts.length,
      posts: uniquePosts
    });

  } catch (error) {
    res.status(500).json({ error: "Archive aggregation failed" });
  }
}
