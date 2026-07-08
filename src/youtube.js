const KEY = process.env.YOUTUBE_API_KEY?.trim();

export const hasYouTube = () => !!KEY;

function fmtViews(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '不明';
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万回`;
  return `${v.toLocaleString()}回`;
}

// キーワードで再生数の多いショート動画を検索して返す
export async function searchTopShorts(query, max = 3) {
  if (!KEY) throw new Error('YOUTUBE_API_KEY not set');

  // 1) search.list で候補を集める（再生数順・ショート尺・日本）
  const s = new URL('https://www.googleapis.com/youtube/v3/search');
  s.searchParams.set('key', KEY);
  s.searchParams.set('part', 'snippet');
  s.searchParams.set('q', query);
  s.searchParams.set('type', 'video');
  s.searchParams.set('order', 'viewCount');
  s.searchParams.set('videoDuration', 'short'); // 4分未満
  s.searchParams.set('maxResults', '12');
  s.searchParams.set('regionCode', 'JP');
  s.searchParams.set('relevanceLanguage', 'ja');

  const sr = await fetch(s);
  if (!sr.ok) throw new Error(`youtube search ${sr.status}: ${await sr.text()}`);
  const sd = await sr.json();
  const ids = (sd.items || []).map((i) => i.id?.videoId).filter(Boolean);
  if (ids.length === 0) return [];

  // 2) videos.list で再生数など統計を取得
  const v = new URL('https://www.googleapis.com/youtube/v3/videos');
  v.searchParams.set('key', KEY);
  v.searchParams.set('part', 'snippet,statistics');
  v.searchParams.set('id', ids.join(','));

  const vr = await fetch(v);
  if (!vr.ok) throw new Error(`youtube videos ${vr.status}`);
  const vd = await vr.json();

  const videos = (vd.items || [])
    .map((it) => ({
      title: it.snippet?.title ?? '(無題)',
      channel: it.snippet?.channelTitle ?? '',
      views: Number(it.statistics?.viewCount ?? 0),
      viewsLabel: fmtViews(it.statistics?.viewCount),
      url: `https://www.youtube.com/watch?v=${it.id}`,
      publishedAt: it.snippet?.publishedAt ?? '',
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, max);

  return videos;
}

// 複数ジャンルをまとめて調べ、レポート用テキストに整形する
export async function researchGenres(genres) {
  const out = [];
  for (const g of genres) {
    try {
      const vids = await searchTopShorts(g.query, 3);
      if (vids.length === 0) {
        out.push(`【${g.label}】本日は有力な事例なし`);
        continue;
      }
      const lines = vids
        .map((x) => `・${x.title}（${x.viewsLabel}／${x.channel}）\n  ${x.url}`)
        .join('\n');
      out.push(`【${g.label}】\n${lines}`);
    } catch (e) {
      console.error(`[youtube] ${g.label} failed:`, e.message);
      out.push(`【${g.label}】取得失敗（${e.message}）`);
    }
  }
  return out.join('\n\n');
}
