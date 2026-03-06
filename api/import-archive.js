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

function extractUrls(xml) {
  const matches = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  return matches.map(match => match[1])
}

function getTagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))
  return match ? match[1] : null
}

export default async function handler(req, res) {
  const results = []

  for (const project of projects) {
    try {
      console.log(`Importing ${project.name}...`)

      const response = await fetch(project.sitemap)

      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap`)
      }

      const xml = await response.text()
      const blocks = extractUrls(xml)

      let articles = []

      for (const block of blocks) {
        const loc = getTagValue(block, "loc")
        const lastmod = getTagValue(block, "lastmod")

        if (!loc) continue

        // filtrovat jen články podle typu
        if (project.type === "news" && !loc.includes("/news/")) continue
        if (project.type === "news-events" && !loc.includes("/news-events/")) continue
        if (project.type === "fenix-old" && !loc.includes("/en/news-old/")) continue

        articles.push({
          project: project.name,
          url: loc,
          lastmod: lastmod || null
        })
      }

      await kv.set(`articles:${project.name}`, articles)

      results.push({
        project: project.name,
        imported: articles.length,
        status: "success"
      })

    } catch (error) {
      console.error(`Error importing ${project.name}:`, error.message)

      results.push({
        project: project.name,
        status: "failed",
        error: error.message
      })
    }
  }

  res.status(200).json({
    message: "Import finished",
    results
  })
}
