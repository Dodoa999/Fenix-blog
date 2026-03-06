export default async function handler(req, res) {

  const sources = [
    { url: "https://www.greenest-ecosystem.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/9db75774-b5b5-4025-8d0a-5ea5d4da2ead/4.png?content-type=image%2Fpng", name: "Greenest" },
    { url: "https://www.apolloproject.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/69e6d755-e8ba-4604-b7c5-8ccbf73e7628/6.png?content-type=image%2Fpng", name: "Apollo" },
    { url: "https://www.reuse-batteries.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/4ff75b19-8d44-438e-8cc0-466ba1d77f05/11.png?content-type=image%2Fpng", name: "Reuse Batteries" },
    { url: "https://www.perseus-project.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/67b4289f-616e-4301-b6e7-a390ca733fdc/2.png?content-type=image%2Fpng", name: "Perseus" },
    { url: "https://www.treasure-project.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/3cc1ceca-e0ec-48cc-a33d-1a9a196a8516/8.png?content-type=image%2Fpng", name: "Treasure" },
    { url: "https://www.forest-project.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/87de089c-d4fd-4b62-8ad3-71d3cae10891/7.png?content-type=image%2Fpng", name: "Forest" },
    { url: "https://www.carbon4minerals.eu/news-events?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/d1b6f93f-dd3d-4b09-bf12-12f424097ab9/10.png?content-type=image%2Fpng", name: "Carbon4Minerals" },
    { url: "https://www.teapots-project.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/56c47b55-382b-41fc-a3a7-1a66a2320cdb/3.png?content-type=image%2Fpng", name: "Teapots" },
    { url: "https://www.am2pm-project.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/0f58a97d-912e-4d6a-9601-cd934f3524cd/1.png?content-type=image%2Fpng", name: "AM2PM" },
    { url: "https://www.herit4ages.eu/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/7e01a101-68fb-4de6-96ff-78e6b6c96ddd/5.png?content-type=image%2Fpng", name: "Herit4Ages" },
    { url: "https://www.fenixtnt.cz/en/news?format=json&count=50", logo: "https://images.squarespace-cdn.com/content/6007f11c18739e1ddbd5f7a5/85cd8d6b-caad-4bb5-ab8b-eac65b86fd23/fenix.png?content-type=image%2Fpng", name: "Fenix TNT" }
  ];

  try {

    const responses = await Promise.all(
      sources.map(async (source) => {
        try {
          const response = await fetch(source.url);
          const data = await response.json();

          if (!data.entries) return [];

          return data.entries.map(item => ({
            id: item.id,
            title: item.title,
            link: item.fullUrl || item.url,
            image: item.assetUrl || "",
            excerpt: item.excerpt || "",
            date: new Date(item.publishOn),
            logo: source.logo,
            project: source.name
          }));

        } catch (err) {
          return [];
        }
      })
    );

    let allPosts = responses.flat();

    // odstranění duplicit podle ID
    const uniquePosts = Array.from(
      new Map(allPosts.map(item => [item.id, item])).values()
    );

    // seřazení podle data (nejnovější první)
    uniquePosts.sort((a, b) => b.date - a.date);

    // cache 10 minut
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");

    res.status(200).json({
      total: uniquePosts.length,
      posts: uniquePosts
    });

  } catch (error) {
    res.status(500).json({ error: "Feed aggregation failed" });
  }
}
