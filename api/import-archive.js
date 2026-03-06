import { kv } from "@vercel/kv"

const projects = [
  { name: "apollo", sitemap: "https://www.apolloproject.eu/sitemap.xml" },
  { name: "reuse", sitemap: "https://www.reuse-batteries.eu/sitemap.xml" },
  { name: "perseus", sitemap: "https://www.perseus-project.eu/sitemap.xml" },
  { name: "treasure", sitemap: "https://www.treasure-project.eu/sitemap.xml" },
  { name: "forest", sitemap: "https://www.forest-project.eu/sitemap.xml" },
  { name: "carbon4minerals", sitemap: "https://www.carbon4minerals.eu/sitemap.xml" },
  { name: "am2pm", sitemap: "https://www.am2pm-project.eu/sitemap.xml" },
  { name: "herit4ages", sitemap: "https://www.herit4ages.eu/sitemap.xml" },
  { name: "fenix", sitemap: "https://www.fenixtnt.cz/sitemap.xml" }
]

function extractMeta(html, property) {
  const regex = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")
  const match = html.match(regex)
  return match ? match[1] : null
}

function extractNameMeta(html, name) {
  const regex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")
  const match = html.match(regex)
  return match ? match[1] : null
}

export default async function handler(req, res) {

  try {

    let totalImported = 0

    for (const project of projects) {

      console.log("Processing:", project.name)

      const response = await fetch(project.sitemap)
      const xml = await response.text()

      const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
        .map(match => match[1])
        .filter(url =>
          url.includes("/news") &&
          !url.includes("/category/") &&
          !url.endsWith("/news") &&
          !url.endsWith("/news/")
        )

      const articles = []

      for (const url of urls) {

        try {

          const pageRes = await fetch(url)
          const html = await pageRes.text()

          const title =
            extractMeta(html, "og:title") ||
            extractNameMeta(html, "twitter:title")

          const image =
            extractMeta(html, "og:image")

          const published =
            extractMeta(html, "article:published_time")

          const description =
            extractNameMeta(html, "description")

          if (!title) continue

          articles.push({
            project: project.name,
            url,
            title,
            image: image || null,
            excerpt: description || null,
            date: published || null
          })

        } catch (err) {
          console.log("Failed:", url)
        }
      }

      await kv.set(`articles:${project.name}`, articles)

      totalImported += articles.length

      console.log(project.name, "imported:", articles.length)
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
