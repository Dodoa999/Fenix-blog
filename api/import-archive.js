for (const project of projects) {
  try {
    const response = await fetch(project.sitemap)
    const xml = await response.text()

    console.log("Fetched:", project.name)

    // pokračování...
    
  } catch (err) {
    console.error("FAILED:", project.name, project.sitemap)
    return res.json({ error: `Failed at ${project.name}` })
  }
}
