import { kv } from "@vercel/kv"

const projects = [
  { name: "greenest", sitemap: "https://www.greenest-ecosystem.eu/sitemap.xml", type: "news" },
  { name: "apollo", sitemap: "https://www.apolloproject.eu/sitemap.xml", type: "news" },
  { name: "reuse", sitemap: "https://www.reuse-batteries.eu/sitemap.xml", type: "news" },
  { name: "perseus", sitemap: "https://www.perseus-project.eu/sitemap.xml", type: "news" },
  { name: "treasure", sitemap: "https://www.treasure-project.eu/sitemap.xml", type: "news" },
  { name: "forest", sitemap: "https://www.forest-project.eu/sitemap.xml", type: "news" },
  { name: "carbon4minerals", sitemap: "https://www.carbon4minerals.eu/sitemap.xml", type: "news-events" },
  { name: "am2pm", sitemap: "https://www.am2pm-project.eu/sitemap.xml", type: "news" },
  { name: "herit4ages", sitemap: "https://www.herit4ages.eu/sitemap.xml", type: "news" },
  { name: "fenix", sitemap: "https://www.fenixnt.cz/sitemap.xml", type: "fenix-old" }
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
  try {
    let allArticles = []

    for (const project of projects) {
      const response = await fetch(project.sitemap)
      const xml = await response.text()

      const urls = extractUrls(xml)

      for (const block of urls) {
        const loc = getTagValue(block, "loc")
        const lastmod = getTagValue(block, "lastmod")
        const image = getTagValue(block, "image:loc")

        if (!loc) continue

        // Filtr podle typu
        let isArticle = false

        if (project.type === "news") {
          isArticle = loc.includes("/news/") && !loc.includes("/category")
        }

        if (project.type === "news-events") {
          isArticle = loc.includes("/news-events/")
        }

        if (project.type === "fenix-old") {
          isArticle = loc.includes("/en/news-old/")
        }

        if (!isArticle) continue

        const title = getTagValue(block, "image:title") || loc.split("/").pop()

        allArticles.push({
          url: loc,
          title,
          image,
          date: lastmod,
          project: project.name
        })
      }
    }

    // odstranění duplicit podle URL
    const unique = Object.values(
      allArticles.reduce((acc, item) => {
        acc[item.url] = item
        return acc
      }, {})
    )

    await kv.set("archive", unique)

    res.status(200).json({
      success: true,
      totalImported: unique.length
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
