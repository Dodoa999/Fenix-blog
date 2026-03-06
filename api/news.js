import { kv } from "@vercel/kv"

export default async function handler(req, res) {

  // ✅ CORS povolení
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {

    const data = await kv.get("news:global")

    if (!data) {
      return res.status(200).json({
        total: 0,
        posts: []
      })
    }

    return res.status(200).json({
      total: data.length,
      posts: data
    })

  } catch (error) {

    return res.status(500).json({
      error: error.message
    })

  }
}
