import { kv } from "@vercel/kv"

const projects = [
  { name: "apollo", sitemap: "https://www.apolloproject.eu/sitemap.xml", match: "/news/" },
  { name: "reuse", sitemap: "https://www.reuse-batteries.eu/sitemap.xml", match: "/news/" },
  { name: "perseus", sitemap: "https://www.perseus-project.eu/sitemap.xml", match: "/news/" },
  { name: "treasure", sitemap: "https://www.treasure-project.eu/sitemap.xml", match: "/news/" },
  { name: "forest", sitemap: "https://www.forest-project.eu/sitemap.xml", match: "/news/" },
  { name: "carbon4minerals", sitemap: "https://www.carbon4minerals.eu/sitemap.xml", match: "/news-events/" },
  { name: "am2pm", sitemap: "https://www.am2pm-project.eu/sitemap.xml", match: "/news/" },
  { name: "herit4ages", sitemap: "https://www.herit4ages.eu/sitemap.xml", match: "/news/" },
  { name: "fenix", sitemap: "https://www.fenixtnt.cz/sitemap.xml", match: "/en/news/" }
]

function extractLocs(xml) {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
  return matches.map(m => m[1])
}

function extractMeta(html, property) {
  const regex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"]+)["']`,
    "i"
  )
  const match = html.match(regex)
  return match ? match[1] : null
}

function extractDescription(html) {
  const regex = /<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i
  const match = html.match(regex)
  return match ? match[1] : null
}

export default async function handler(req, res) {

  try {

    let totalImported = 0

    for (const project of projects) {

      const response = await fetch(project.sitemap)
      if (!response.ok) continue

      const xml = await response.text()
      const locs = extractLocs(xml)

      const articleUrls = locs.filter(url =>
        url.includes(project.match) &&
        !url.endsWith(project.match)
      )

      const articles = []

      for (const url of articleUrls) {

        try {

          const pageRes = await fetch(url)
          if (!pageRes.ok) continue

          const html = await pageRes.text()

          const title =
            extractMeta(html, "og:title") ||
            null

          const image =
            extractMeta(html, "og:image") ||
            null

          const description =
            extractDescription(html) ||
            null

          if (!title) continue

          articles.push({
            project: project.name,
            url,
            title,
            image,
            excerpt: description,
            date: null
          })

        } catch (err) {
          console.log("Failed article:", url)
        }
      }

      await kv.set(`articles:${project.name}`, articles)

      totalImported += articles.length
    }

    return res.status(200).json({
      message: "Full professional archive import completed",
      total: totalImported
    })

  } catch (error) {

    return res.status(500).json({
      error: error.message
    })

  }
}
