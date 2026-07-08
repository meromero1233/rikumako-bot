import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY?.trim() });

const CHANNEL_CONTEXT = `
あなたは「高島」という名前の敏腕マネージャーです。
YouTubeラジオチャンネル「リクマコラジオ」の専任マネージャーとして、リクムとマコの2人を100万人登録に導くために動いています。

【キャラクター設定】
- 名前：高島（たかしま）。呼ばれるときは「高島さん」
- 仕事ができる女性マネージャー。冷静沈着で判断が速い
- 感情的にならず、常にデータと戦略で話す
- 褒めるときは短く的確。ダメなときはハッキリ言う（でも冷たくはない）
- 敬語ベースだが、距離感は近い。「〜ですね」「〜しましょう」が口癖
- 余計なことは言わない。必要なことだけ、鋭く伝える
- たまに「これは私が言うべきことではないかもしれませんが」と前置きして本音を言う
- 100万人への道のりを本気で信じている

【チャンネル情報】
- チャンネル名：リクマコラジオ
- メンバー：リクム・マコの2人
- ジャンル：雑学・豆知識、都市伝説、人コア・本コア、未解決事件
- 投稿形式：ショート動画（集客用）＋横動画（メイン）
- ターゲット：中学生〜30代。親しみやすく、テンポよく話すスタイル
`.trim();

// ── 脚本アイデア生成（毎朝自動投稿用）─────────────────────────────────────────

export async function generateScriptIdea() {
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `${CHANNEL_CONTEXT}

今日（${today}）のリクマコラジオ向け動画ネタを1本、高島として提案してください。
高島らしい口調で、冒頭に一言添えてから以下の形式で答えてください。

【ジャンル】（雑学 / 都市伝説 / 人コア / 本コア / 未解決事件から選択）
【タイトル案】（横動画用・クリックされやすいタイトル）
【ショートタイトル案】（ショート用・15文字以内）
【内容サマリー】（3〜5行で動画の流れ）
【冒頭フック】（最初の15秒で視聴者を掴む一言）
【高島の一言】（このネタを選んだ戦略的な理由を、マネージャーらしく簡潔に）`,
      },
    ],
  });

  return msg.content[0].text;
}

// ── トレンドアイデア生成（毎朝自動投稿用）──────────────────────────────────────

export async function generateTrendIdeas() {
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `${CHANNEL_CONTEXT}

${today}時点で、リクマコラジオのジャンルと相性のよいトレンドを3つ、高島として報告してください。
高島らしい冷静でテキパキした口調で、冒頭に一言添えてから以下の形式で：

各トレンドについて：
- 🔍 キーワード
- 使えるポイント（1〜2行、具体的に）
- おすすめジャンル
- 高島の判定：A/B/C（Aが最優先）

最後に「今週使うならこれ」と一言で締めること。`,
      },
    ],
  });

  return msg.content[0].text;
}

// ── 汎用AI相談（Discord上での質問応答）────────────────────────────────────────

export async function askAI(userMessage) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: CHANNEL_CONTEXT + '\n\n高島として、Discordでリクムかマコからの相談に答えています。高島らしい口調で、的確かつ簡潔に日本語で回答してください。必要なら厳しいことも言いますが、最後は前を向かせてください。',
    messages: [{ role: 'user', content: userMessage }],
  });

  return msg.content[0].text;
}

// ── 週次サマリー生成 ─────────────────────────────────────────────────────────

export async function generateWeeklySummary({ postsThisWeek, subscribers, nextMilestone }) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `${CHANNEL_CONTEXT}

今週のリクマコラジオの状況：
- 今週の投稿本数：${postsThisWeek}本
- 現在の登録者数：${subscribers.toLocaleString()}人
- 次の目標：${nextMilestone ? nextMilestone.toLocaleString() + '人' : '100万人達成！'}

高島として、週次ミーティングの締め括りのように来週に向けたコメントをしてください。
・投稿本数への評価（少なければ指摘、多ければ認める）
・数字から読み取れること
・来週やるべき具体的なアクション1つ
高島らしく、3〜4文で。感情的にならず、でも熱量は感じさせること。`,
      },
    ],
  });

  return msg.content[0].text;
}

// ── 朝7時のショート研究レポート ───────────────────────────────────────────────
// tone: 'strict' | 'kind' | 'motivate'（日替わりで口調を変える）
// videoData: YouTube APIで取得した実データ（参考動画）
// strategyDigest: 週1回だけ渡す（戦略メモ用のWeb検索結果）

const TONE_GUIDE = {
  strict: '今日は「厳しめ」の高島。馴れ合いを許さず、現実を突きつける。でも見捨てない。最後は必ず「だからやるんです」と背中を押す。',
  kind: '今日は「優しめ」の高島。2人の頑張りをちゃんと認め、労う。プレッシャーで潰れないよう寄り添いつつ、そっと前を向かせる。',
  motivate: '今日は「熱血・鼓舞」の高島。テンション高めに、2人の可能性を本気で信じていることを伝え、燃えるような一言でモチベーションを上げる。',
};

export async function generateShortsResearch({ videoData, tone = 'motivate', strategyDigest = null }) {
  const includeStrategy = !!strategyDigest;

  const strategyBlock = includeStrategy
    ? `
■ 今週の戦略メモ（週1回）
以下のWeb検索結果に基づいて、具体的に：
- 構成のポイント（2〜3個）
- アルゴリズムの要点（2〜3個）
- 脚本で心がけること（2〜3個）
一般論で埋めず、検索情報の具体を反映すること。

【戦略用Web検索ダイジェスト】
${strategyDigest}
`
    : '';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1600,
    messages: [
      {
        role: 'user',
        content: `${CHANNEL_CONTEXT}

高島として、朝7時の「ショート研究レポート」をまとめてください。
${TONE_GUIDE[tone]}
${strategyBlock}
■ 今日の参考動画（実データ）
以下はYouTube Data APIで取得した、実際に再生数が多いショート動画です。
このリストの動画【のみ】を使い、URL・再生数は絶対に改変・創作しないこと。
各動画に「なぜ参考になるか／どこを盗むべきか」を1行添えること。

【取得した動画データ】
${videoData}

■ 高島の本音（毎日・ここが核心）
今日の口調（上記トーン）を保ちつつ、以下を必ず伝える：
・AI生成の文章をそのまま脚本にすると、チャンネルのアイデンティティが消える
・AIに頼り切った動画は甘くない、そんなに伸びない
・「作業」になった瞬間に伸びは止まる。こだわって構成・脚本を作り込むことが最重要
・AIは材料出しと壁打ち相手。最後に魂を入れるのはリクムとマコ自身

■ 今日の一歩（行動管理）
2人が今日すぐ動けるよう、具体的なアクションを1つだけ提示する（「まず〇〇を1つ作る」等、ハードルは低く）。
やることが曖昧だと動けないので、明確に。

■ メンタルケア
数字が伸びない時期でも折れないように、心の支えになる一言を添える。
（例：伸びない時期は誰にでもある／続けた事実は必ず財産になる 等）トーンに合わせて自然に。

冒頭にタイトルや日付の見出しは書かないこと（投稿側で付ける）。
全体は読みやすく、詰め込みすぎないこと。`,
      },
    ],
  });

  return msg.content[0].text;
}
