import { kv } from "@vercel/kv"

export default async function handler(req, res) {

  try {
    const data = await kv.get("news:global") || []

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
