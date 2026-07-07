import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// サーバーごとの会話履歴（最大20件保持）
const histories = new Map();

function getHistory(guildId) {
  if (!histories.has(guildId)) histories.set(guildId, []);
  return histories.get(guildId);
}

function trimHistory(history) {
  if (history.length > 20) history.splice(0, history.length - 20);
}

export async function chat(guildId, userMessage, persona, searchContext = '') {
  const history = getHistory(guildId);

  const userContent = searchContext
    ? `【最新情報】\n${searchContext}\n\n【質問】\n${userMessage}`
    : userMessage;

  history.push({ role: 'user', content: userContent });
  trimHistory(history);

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: persona.systemPrompt,
    messages: history,
  });

  const reply = msg.content[0].text;
  history.push({ role: 'assistant', content: reply });
  trimHistory(history);

  return reply;
}

export async function generateScriptFromTrends(persona, trendInfo) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [
      {
        role: 'user',
        content: `${persona.systemPrompt}

以下の最新トレンド情報をもとに、${persona.scriptGenreList.join('・')}のジャンルで
ショート動画の脚本候補を3本、高島として提案してください。

【最新トレンド情報】
${trendInfo}

各脚本について：
【タイトル】（ショート用・15文字以内）
【ジャンル】
【冒頭フック】（最初の10秒で掴む一言）
【流れ】（3行で）
【高島の判定】A/B/C

最後に「今日イチオシ」を一言で。`,
      },
    ],
  });

  return msg.content[0].text;
}
