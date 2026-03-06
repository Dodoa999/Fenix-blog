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
  { name: "fenix", json: "https://www.fenixtnt.cz/en/news-old?format=json&count=50" }
]

function dedupeByUrl(items) {
  const map = new Map()
  items.forEach(item => {
    map.set(item.url, item)
  })
  return Array.from(map.values())
}

export default async function handler(req, res) {

  try {

    let archiveAll = []

    // 1️⃣ načti existující archiv
    for (const project of projects) {
      const stored = await kv.get(`articles:${project.name}`)
      if (stored) {
        archiveAll.push(...stored)
      }
    }

    let liveAll = []

    // 2️⃣ načti posledních 50
    for (const project of projects) {

      try {
        const response = await fetch(project.json)
        if (!response.ok) continue

        const data = await response.json()
        const items = data.items || data.entries || []

        const mapped = items.map(item => ({
          project: project.name,
          url: item.fullUrl || item.url,
          title: item.title,
          image: item.assetUrl || null,
          date: item.publishOn || item.pubDate || null
        }))

        liveAll.push(...mapped)

      } catch (err) {
        console.log("Live fetch failed:", project.name)
      }
    }

    // 3️⃣ merge + dedupe
    let merged = [...archiveAll, ...liveAll]
    merged = dedupeByUrl(merged)

    // 4️⃣ seřadit
    merged.sort((a, b) => {
      return new Date(b.date || b.lastmod) - new Date(a.date || a.lastmod)
    })

    // 5️⃣ uložit jako globální dataset
    await kv.set("news:global", merged)

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
