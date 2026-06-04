async function searchTavily(query, apiKey) {
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 5
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn("Tavily search API failed:", errText);
      return [];
    }
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("Error calling Tavily search:", err.message);
    return [];
  }
}

async function scrapeFirecrawl(url, apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"]
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Firecrawl scrape failed for ${url}:`, errText);
      return null;
    }
    const data = await res.json();
    if (data.success && data.data) {
      return {
        markdown: data.data.markdown || "",
        title: data.data.metadata?.title || "",
        description: data.data.metadata?.description || ""
      };
    }
    return null;
  } catch (err) {
    console.error(`Error calling Firecrawl scrape for ${url}:`, err.message);
    return null;
  }
}

export const webService = {
  async search(query, apiKey = process.env.TAVILY_API_KEY) {
    return await searchTavily(query, apiKey);
  },
  async scrape(url, apiKey = process.env.FIRECRAWL_API_KEY) {
    return await scrapeFirecrawl(url, apiKey);
  }
};
