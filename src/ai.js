import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
