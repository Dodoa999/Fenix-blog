import { kv } from "@vercel/kv"

const projects = [
  { name: "apollo", json: "https://www.apolloproject.eu/news?format=json&count=50" },
  { name: "reuse", json: "https://www.reuse-batteries.eu/news?format=json&count=50" },
  { name: "perseus", json: "https://www.perseus-project.eu/news?format=json&count=50" },
  { name: "treasure", json: "https://www.treasure-project.eu/news?format=json&count=50" },
  { name: "forest", json: "https://www.forest-project.eu/news?format=json&count=50" },
  { name: "carbon4minerals", json: "https://www.carbon4minerals.eu/news-events?format=json&count=50" },
  { name: "am2pm", json: "https://www.am2pm-project.eu/news?format=json&count=50" },
  { name: "herit4ages", json: "https://www.herit4ages.eu/news?format=json&count=50" },
  { name: "fenix", json: "https://www.fenixtnt.cz/en/news?format=json&count=50" }
]

function dedupeByUrl(items) {
  const map = new Map()
  items.forEach(item => {
    if (item.url) {
      map.set(item.url, item)
    }
  })
  return Array.from(map.values())
}

export default async function handler(req, res) {

  // 🔐 CRON SECRET ochrana
  const { secret } = req.query

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {

    let archiveAll = []

    // 1️⃣ načti existující archiv z KV
    for (const project of projects) {
      const stored = await kv.get(`articles:${project.name}`)
      if (stored && Array.isArray(stored)) {
        archiveAll.push(...stored)
      }
    }

    let liveAll = []

    // 2️⃣ načti posledních 50 live článků
    for (const project of projects) {

      try {
        const response = await fetch(project.json)

        if (!response.ok) {
          console.log("Fetch failed:", project.name)
          continue
        }

        const data = await response.json()
        const items = data.items || data.entries || []

        const mapped = items
          .map(item => {

            const url = item.fullUrl || item.url || null
            const title = item.title ? item.title.trim() : null
            const date = item.publishOn || item.pubDate || null

            // ❌ základní validace
            if (!url) return null
            if (!title) return null

            // ❌ ignoruj category stránky
            if (url.includes("/category/")) return null

            // ❌ ignoruj root listingy
            if (
              url.endsWith("/news/") ||
              url.endsWith("/news-events/") ||
              url.endsWith("/news-old/")
            ) return null

            return {
              project: project.name,
              url,
              title,
              image: item.assetUrl || null,
              date
            }
          })
          .filter(Boolean)

        liveAll.push(...mapped)

      } catch (err) {
        console.log("Live fetch error:", project.name)
      }
    }

    // 3️⃣ merge + dedupe
    let merged = [...archiveAll, ...liveAll]
    merged = dedupeByUrl(merged)

    // 4️⃣ finální bezpečnostní filtr
    merged = merged.filter(item => item.title && item.url)

    // 5️⃣ seřazení podle data
    merged.sort((a, b) => {
      const dateA = new Date(a.date || a.lastmod || 0)
      const dateB = new Date(b.date || b.lastmod || 0)
      return dateB - dateA
    })

    // 6️⃣ uložit globální dataset
    await kv.set("news:global", merged)

    // 7️⃣ uložit timestamp posledního syncu
    await kv.set("news:lastSync", new Date().toISOString())

    return res.status(200).json({
      message: "Daily sync completed",
      total: merged.length
    })

  } catch (error) {

    return res.status(500).json({
      error: error.message
    })

  }
}
