import { kv } from "@vercel/kv"

const projects = [
  { name: "apollo", sitemap: "https://www.apollo-project.eu/sitemap.xml", type: "news" },
  { name: "reuse", sitemap: "https://www.reuse-batteries.eu/sitemap.xml", type: "news" },
  { name: "perseus", sitemap: "https://www.perseus-project.eu/sitemap.xml", type: "news" },
  { name: "treasure", sitemap: "https://www.treasure-project.eu/sitemap.xml", type: "news" },
  { name: "forest", sitemap: "https://www.forest-project.eu/sitemap.xml", type: "news" },
  { name: "carbon4minerals", sitemap: "https://www.carbon4minerals.eu/sitemap.xml", type: "news-events" },
  { name: "am2pm", sitemap: "https://www.am2pm-project.eu/sitemap.xml", type: "news" },
  { name: "herit4ages", sitemap: "https://www.herit4ages.eu/sitemap.xml", type: "news" },
  { name: "fenix", sitemap: "https://www.fenixtnt.cz/sitemap.xml", type: "fenix-old" }
]

// 🔥 Nová robustní extrakce <loc>
function extractLocs(xml) {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
  return matches.map(match => match[1])
}

// 🔥 Robustní extrakce <lastmod>
function extractLastmods(xml) {
  const matches = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)]
  return matches.map(match => match[1])
}

export default async function handler(req, res) {

  const results = []

  for (const project of projects) {

    try {

      console.log("Fetching:", project.sitemap)

      const response = await fetch(project.sitemap)

      if (!response.ok) {
        throw new Error("Invalid response")
      }

      const xml = await response.text()

      const locs = extractLocs(xml)
      const lastmods = extractLastmods(xml)

      const articles = []

      for (let i = 0; i < locs.length; i++) {

        const loc = locs[i]
        const lastmod = lastmods[i] || null

        if (!loc) continue

        // 🔎 Filtrace podle typu
        if (project.type === "news" && !loc.includes("/news/")) continue
        if (project.type === "news-events" && !loc.includes("/news-events/")) continue
        if (project.type === "fenix-old" && !loc.includes("/en/news-old/")) continue

        // ❌ Nechceme root stránky typu /news/
        if (loc.endsWith("/news/") || loc.endsWith("/news-events/")) continue

        articles.push({
          project: project.name,
          url: loc,
          lastmod
        })
      }

      // 🧠 Uložit do KV
      await kv.set(`articles:${project.name}`, articles)

      results.push({
        project: project.name,
        imported: articles.length,
        status: "success"
      })

    } catch (error) {

      results.push({
        project: project.name,
        status: "failed",
        error: error.message
      })

    }
  }

  return res.status(200).json({
    message: "Import finished safely",
    results
  })
}
