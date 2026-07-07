const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export async function searchTrends(keywords) {
  const query = keywords.join(' ') + ' 最新トレンド 2026';

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  const data = await res.json();

  const results = (data.results || []).map((r) => `・${r.title}\n  ${r.url}`).join('\n');
  const answer = data.answer || '';

  return { answer, results };
}

export async function searchQuery(query) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  const data = await res.json();

  return {
    answer: data.answer || '',
    results: (data.results || []).map((r) => `・${r.title}\n  ${r.url}`).join('\n'),
  };
}
