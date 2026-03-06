import { kv } from "@vercel/kv"

const projects = [
  { name: "apollo", sitemap: "https://www.apolloproject.eu/sitemap.xml", type: "news" },
  { name: "reuse", sitemap: "https://www.reuse-batteries.eu/sitemap.xml", type: "news" },
  { name: "perseus", sitemap: "https://www.perseus-project.eu/sitemap.xml", type: "news" },
  { name: "treasure", sitemap: "https://www.treasure-project.eu/sitemap.xml", type: "news" },
  { name: "forest", sitemap: "https://www.forest-project.eu/sitemap.xml", type: "news" },
  { name: "carbon4minerals", sitemap: "https://www.carbon4minerals.eu/sitemap.xml", type: "news-events" },
  { name: "am2pm", sitemap: "https://www.am2pm-project.eu/sitemap.xml", type: "news" },
  { name: "herit4ages", sitemap: "https://www.herit4ages.eu/sitemap.xml", type: "news" },
  { name: "fenix", sitemap: "https://www.fenixtnt.cz/sitemap.xml", type: "fenix-news" }
]

// extrakce <loc>
function extractLocs(xml) {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
  return matches.map(m => m[1])
}

// extrakce <lastmod>
function extractLastmods(xml) {
  const matches = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)]
  return matches.map(m => m[1])
}

export default async function handler(req, res) {

  try {

    const results = []

    for (const project of projects) {

      const response = await fetch(project.sitemap)
      if (!response.ok) continue

      const xml = await response.text()

      const locs = extractLocs(xml)
      const lastmods = extractLastmods(xml)

      const articles = []

      for (let i = 0; i < locs.length; i++) {

        const url = locs[i]
        const lastmod = lastmods[i] || null

        if (!url) continue

        // Filtrace podle typu
        if (project.type === "news" && !url.includes("/news/")) continue
        if (project.type === "news-events" && !url.includes("/news-events/")) continue
        if (project.type === "fenix-news" && !url.includes("/en/news/")) continue

        // Nechceme root listing
        if (
          url.endsWith("/news/") ||
          url.endsWith("/news-events/") ||
          url.endsWith("/en/news/")
        ) continue

        articles.push({
          project: project.name,
          url,
          lastmod
        })
      }

      await kv.set(`articles:${project.name}`, articles)

      results.push({
        project: project.name,
        imported: articles.length
      })
    }

    return res.status(200).json({
      message: "Full archive import completed",
      results
    })

  } catch (error) {

    return res.status(500).json({
      error: error.message
    })

  }
}
