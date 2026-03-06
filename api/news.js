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

    // 1️⃣ načti archiv z databáze
    let storedPosts = await kv.get("all-posts") || [];

    // převedeme na mapu kvůli deduplikaci
    const postMap = new Map(storedPosts.map(p => [p.id, p]));

    // 2️⃣ stáhni nové články
    for (const url of sources) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (!data.entries) continue;

        data.entries.forEach(item => {
          postMap.set(item.id, {
            id: item.id,
            title: item.title,
            link: item.fullUrl || item.url,
            image: item.assetUrl || "",
            excerpt: item.excerpt || "",
            date: item.publishOn
          });
        });

      } catch (e) {}
    }

    // 3️⃣ zpět na pole
    const allPosts = Array.from(postMap.values());

    // 4️⃣ seřadit podle data
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 5️⃣ uložit zpět do databáze
    await kv.set("all-posts", allPosts);

    res.status(200).json({
      total: allPosts.length,
      posts: allPosts
    });

  } catch (error) {
    res.status(500).json({ error: "Archive system failed" });
  }
}
