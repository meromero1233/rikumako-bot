import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType, EmbedBuilder } from 'discord.js';
import { setupServer } from './commands/setupServer.js';
import {
  addTask, completeTask, deleteTask, getTasks, getPendingTasks,
  setSubscribers, getSubscribers, getNextMilestone, checkNewMilestone,
  incrementWeeklyPosts, getWeeklyPosts, resetWeeklyPosts,
  recordPost, getDaysSinceLastPost, getStaleTasks,
} from './store.js';
import { generateScriptIdea, generateTrendIdeas, askAI, generateWeeklySummary } from './ai.js';
import { chat, generateScriptFromTrends } from './chat.js';
import { searchTrends, searchQuery } from './search.js';
import { persona } from './personas/rikumako.js';
import { CH } from './config.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ─── ユーティリティ ──────────────────────────────────────────────────────────────

function findChannel(guild, name) {
  return guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === name,
  );
}

function jstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function isMondayJST() {
  return jstNow().getUTCDay() === 1;
}

function scheduleDailyJST(hourJST, callback) {
  const hourUTC = (hourJST - 9 + 24) % 24;
  function msUntilNext() {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(hourUTC, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next - now;
  }
  function loop() { callback(); setTimeout(loop, msUntilNext()); }
  setTimeout(loop, msUntilNext());
}

// ─── 登録者数バー表示 ────────────────────────────────────────────────────────────

function buildProgressBar(current, next) {
  if (!next) return '🏆 100万人達成！';
  const pct = Math.min(current / next, 1);
  const filled = Math.round(pct * 20);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  return `\`${bar}\` ${(pct * 100).toFixed(1)}%`;
}

// ─── 毎朝の自動投稿 ──────────────────────────────────────────────────────────────

async function postMorningRoutine() {
  const pending = getPendingTasks();
  const jst = jstNow();
  const dateStr = jst.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });

  for (const guild of client.guilds.cache.values()) {

    // ── 今日のタスク投稿 ────────────────────────────────────────────────────────
    const taskCh = findChannel(guild, CH.TASK);
    if (taskCh) {
      const taskLines = pending.length > 0
        ? pending.map((t) => `> **#${t.id}** ${t.text}`).join('\n')
        : '> 📭 現在タスクなし。`/task add` で追加しよう！';

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📋 ${dateStr} のタスク確認`)
        .setDescription(taskLines)
        .setFooter({ text: '高島 | 完了したら /task done <番号> を入れてください。報告は義務です。' });

      await taskCh.send({ content: `おはようございます。高島です。本日のタスクを確認します。`, embeds: [embed] }).catch(() => {});
    }

    // ── 脚本アイデア投稿（AIが生成）─────────────────────────────────────────────
    const scriptCh = findChannel(guild, CH.SCRIPT);
    if (scriptCh) {
      await scriptCh.send('今日のネタを精査しています。少し待ってください。— 高島').catch(() => {});
      try {
        const idea = await generateScriptIdea();
        const embed = new EmbedBuilder()
          .setColor(0xeb459e)
          .setTitle(`🎙️ ${dateStr} — 高島からのネタ提案`)
          .setDescription(idea)
          .setFooter({ text: '高島 | 採用する場合は /task add でタスクに入れること。判断は2人に任せます。' });
        await scriptCh.send({ embeds: [embed] }).catch(() => {});
      } catch (e) {
        await scriptCh.send('⚠️ 高島です。本日はネタ提案の生成に失敗しました。APIを確認してください。').catch(() => {});
        console.error('script idea error:', e);
      }
    }

    // ── トレンド情報投稿（Web検索 + AI生成）────────────────────────────────────
    const trendCh = findChannel(guild, CH.TREND);
    if (trendCh) {
      try {
        const { answer, results } = await searchTrends(persona.searchKeywords);
        const trendInfo = answer ? `${answer}\n\n参考記事:\n${results}` : results;
        const scripts = await generateScriptFromTrends(persona, trendInfo);
        const embed = new EmbedBuilder()
          .setColor(0xfee75c)
          .setTitle(`🔥 ${dateStr} — 高島のリアルタイムトレンド分析`)
          .setDescription(scripts)
          .setFooter({ text: '高島 | Web検索ベースの最新情報です。判定Aから検討してください。' });
        await trendCh.send({ embeds: [embed] }).catch(() => {});
      } catch (e) {
        console.error('trend error:', e);
      }
    }

    // ── 月曜は週次サマリーも ───────────────────────────────────────────────────
    if (isMondayJST()) {
      const chatCh = findChannel(guild, CH.CHAT);
      if (chatCh) {
        const subs = getSubscribers();
        const next = getNextMilestone();
        const posts = getWeeklyPosts();
        try {
          const summary = await generateWeeklySummary({
            postsThisWeek: posts,
            subscribers: subs,
            nextMilestone: next,
          });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('📊 週次レポート — 高島より')
            .addFields(
              { name: '📹 今週の投稿', value: `${posts}本`, inline: true },
              { name: '👥 登録者数', value: `${subs.toLocaleString()}人`, inline: true },
              { name: '🎯 次の目標', value: next ? `${next.toLocaleString()}人` : '100万人！', inline: true },
            )
            .setDescription('\n' + summary)
            .setFooter({ text: '高島 | 数字は嘘をつきません。現実を見て、動いてください。' });
          await chatCh.send({ embeds: [embed] }).catch(() => {});
        } catch (e) {
          console.error('weekly summary error:', e);
        }
        resetWeeklyPosts();
      }
    }
  }
}

// ─── 週次目標投稿（月曜8時） ──────────────────────────────────────────────────────

async function postWeeklyGoal() {
  if (!isMondayJST()) return;
  for (const guild of client.guilds.cache.values()) {
    const chatCh = findChannel(guild, CH.CHAT);
    if (!chatCh) continue;
    const subs = getSubscribers();
    const next = getNextMilestone();
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎯 今週の目標 — 高島より')
      .setDescription(
        `おはようございます。今週もよろしくお願いします。\n\n` +
        `**現在の登録者数：${subs.toLocaleString()}人**\n` +
        `**次の目標：${next ? next.toLocaleString() + '人' : '100万人！'}**\n\n` +
        `今週やること：\n` +
        `✅ ショート動画 最低3本\n` +
        `✅ 横動画 1本以上\n` +
        `✅ サムネとタイトルのA/Bテスト\n\n` +
        `数字を動かすのは行動だけです。今週も全力で。— 高島`,
      )
      .setFooter({ text: '高島 | 月曜の朝に動き出した人間が、週末に結果を出します。' });
    await chatCh.send({ embeds: [embed] }).catch(() => {});
  }
}

// ─── 投稿催促・タスク警告チェック（毎日12時） ────────────────────────────────────

async function postAlerts() {
  for (const guild of client.guilds.cache.values()) {
    const chatCh = findChannel(guild, CH.CHAT);
    const taskCh = findChannel(guild, CH.TASK);

    // 3日以上投稿がない場合の催促
    const daysSince = getDaysSinceLastPost();
    if (chatCh && (daysSince === null || daysSince >= 3)) {
      const msg = daysSince === null
        ? `高島です。まだ一度も投稿が記録されていません。\`/posted\` で記録を始めてください。動かないと何も変わりません。— 高島`
        : `高島です。最後の投稿から**${Math.floor(daysSince)}日**が経過しています。\nショートでもいいので今日中に1本出してください。止まると流れが死にます。— 高島`;
      await chatCh.send(msg).catch(() => {});
    }

    // 2日以上放置されているタスクの警告
    const staleTasks = getStaleTasks(2);
    if (taskCh && staleTasks.length > 0) {
      const lines = staleTasks.map((t) => `> **#${t.id}** ${t.text}（${Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000)}日放置）`).join('\n');
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('⚠️ 放置タスクの警告 — 高島')
        .setDescription(`以下のタスクが2日以上手付かずです。\n\n${lines}\n\n理由があるなら教えてください。ないなら今すぐ動いてください。`)
        .setFooter({ text: '高島 | タスクは作るだけでは意味がありません。' });
      await taskCh.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

// ─── 起動 ──────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, (c) => {
  console.log(`✅ ログイン完了: ${c.user.tag}`);
  scheduleDailyJST(8, postWeeklyGoal);
  scheduleDailyJST(9, postMorningRoutine);
  scheduleDailyJST(12, postAlerts);
});

// ─── スラッシュコマンド処理 ───────────────────────────────────────────────────────

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ── /setup ──────────────────────────────────────────────────────────────────
  if (commandName === 'setup') {
    if (!interaction.memberPermissions?.has('Administrator')) {
      return interaction.reply({ content: '管理者のみ実行できます。', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const log = await setupServer(interaction.guild);
    await interaction.editReply(
      log.length > 0
        ? `セットアップ完了！\n${log.join('\n')}`
        : '✅ すでにセットアップ済みです（変更なし）',
    );
    return;
  }

  // ── /task ────────────────────────────────────────────────────────────────────
  if (commandName === 'task') {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const text = interaction.options.getString('内容');
      const task = addTask(text);
      return interaction.reply(`承りました。**#${task.id}「${task.text}」** をタスクに追加しました。— 高島`);
    }

    if (sub === 'done') {
      const id = interaction.options.getInteger('番号');
      const task = completeTask(id);
      if (!task) return interaction.reply({ content: `高島です。タスク #${id} は存在しないか、すでに完了しています。番号を確認してください。`, ephemeral: true });

      const logCh = findChannel(interaction.guild, CH.DONE_LOG);
      if (logCh) {
        await logCh.send(`✅ **${interaction.user.displayName}** — **「${task.text}」** 完了。記録しました。— 高島`).catch(() => {});
      }
      return interaction.reply(`完了を確認しました。**「${task.text}」**、お疲れ様です。次に進んでください。— 高島`);
    }

    if (sub === 'delete') {
      const id = interaction.options.getInteger('番号');
      const ok = deleteTask(id);
      return interaction.reply(
        ok
          ? `タスク #${id} を削除しました。意図的な削除であれば問題ありません。— 高島`
          : { content: `高島です。タスク #${id} が見つかりません。番号を確認してください。`, ephemeral: true },
      );
    }

    if (sub === 'list') {
      const tasks = getTasks();
      if (tasks.length === 0) {
        return interaction.reply('現在タスクはありません。`/task add` で追加してください。動いていない時間は無駄です。— 高島');
      }
      const lines = tasks.map(
        (t) => `${t.done ? '✅' : '⬜'} **#${t.id}** ${t.text}`,
      );
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📋 タスク一覧')
        .setDescription(lines.join('\n'))
        .setFooter({ text: '高島 | 未完了のものを潰すことに集中してください。' });
      return interaction.reply({ embeds: [embed] });
    }
  }

  // ── /subscribers ─────────────────────────────────────────────────────────────
  if (commandName === 'subscribers') {
    const n = interaction.options.getInteger('人数');
    const { prev, current } = setSubscribers(n);
    const newMilestone = checkNewMilestone(prev, current);
    if (newMilestone) {
      const chatCh = findChannel(interaction.guild, CH.CHAT);
      if (chatCh) {
        const embed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle(`🎉 ${newMilestone.toLocaleString()}人 達成！`)
          .setDescription(`リクム、マコ。**${newMilestone.toLocaleString()}人**に到達しました。\nこれは通過点です。次は${(getNextMilestone() ?? 1000000).toLocaleString()}人。止まらないでください。— 高島`)
          .setFooter({ text: '高島 | 祝うのは一瞬でいい。すぐ次に動いてください。' });
        await chatCh.send({ embeds: [embed] }).catch(() => {});
      }
    }
    const next = getNextMilestone();
    const diff = current - prev;

    const diffLabel = diff > 0 ? `+${diff.toLocaleString()}人。順調です。` : diff < 0 ? `${diff.toLocaleString()}人。原因を分析してください。` : '変動なし。動画の本数と質を見直す必要があります。';
    const embed = new EmbedBuilder()
      .setColor(diff >= 0 ? 0x57f287 : 0xed4245)
      .setTitle('📈 登録者数 更新報告 — 高島')
      .addFields(
        { name: '現在', value: `**${current.toLocaleString()}人**`, inline: true },
        { name: '前回比', value: `${diff >= 0 ? '+' : ''}${diff.toLocaleString()}人`, inline: true },
        { name: '次の目標', value: next ? `${next.toLocaleString()}人` : '🏆 100万人達成！', inline: true },
      )
      .setDescription(buildProgressBar(current, next) + `\n\n${diffLabel}`)
      .setFooter({ text: '高島 | 数字は現実です。受け止めて、次の手を打ってください。' });

    // 登録者チャンネルにも記録
    const subsCh = findChannel(interaction.guild, CH.SUBSCRIBERS);
    if (subsCh) {
      await subsCh.send({ embeds: [embed] }).catch(() => {});
    }

    return interaction.reply({ embeds: [embed] });
  }

  // ── /progress ────────────────────────────────────────────────────────────────
  if (commandName === 'progress') {
    const subs = getSubscribers();
    const next = getNextMilestone();
    const pending = getPendingTasks();
    const all = getTasks();
    const done = all.filter((t) => t.done).length;

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('🎯 現状レポート — 高島')
      .addFields(
        { name: '👥 登録者数', value: `${subs.toLocaleString()}人`, inline: true },
        { name: '🎯 次の目標', value: next ? `${next.toLocaleString()}人` : '100万人達成！', inline: true },
        { name: '📹 今週の投稿', value: `${getWeeklyPosts()}本`, inline: true },
        { name: '✅ 完了タスク', value: `${done}件`, inline: true },
        { name: '⬜ 残りタスク', value: `${pending.length}件`, inline: true },
      )
      .setDescription('**目標まで**\n' + buildProgressBar(subs, next))
      .setFooter({ text: '高島 | 現実から目を逸らさないこと。それだけが前に進む方法です。' });

    return interaction.reply({ embeds: [embed] });
  }

  // ── /script ──────────────────────────────────────────────────────────────────
  if (commandName === 'script') {
    await interaction.deferReply();
    try {
      const idea = await generateScriptIdea();
      const embed = new EmbedBuilder()
        .setColor(0xeb459e)
        .setTitle('🎙️ 高島からのネタ提案')
        .setDescription(idea)
        .setFooter({ text: '高島 | 採用・不採用はあなたたちが決めてください。私は材料を出すだけです。' });
      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      return interaction.editReply('高島です。現在ネタ提案の生成ができません。APIの状態を確認してください。');
    }
  }

  // ── /trend ───────────────────────────────────────────────────────────────────
  if (commandName === 'trend') {
    await interaction.deferReply();
    try {
      const trends = await generateTrendIdeas();
      const embed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('🔥 高島のトレンド分析')
        .setDescription(trends)
        .setFooter({ text: '高島 | 判定Aから検討してください。時機を逃すと意味がありません。' });
      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      return interaction.editReply('高島です。トレンド分析の生成に失敗しました。後ほど再試行してください。');
    }
  }

  // ── /ask ─────────────────────────────────────────────────────────────────────
  if (commandName === 'ask') {
    const question = interaction.options.getString('質問');
    await interaction.deferReply();
    try {
      const answer = await askAI(question);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('💼 高島への相談')
        .addFields({ name: '質問', value: question })
        .setDescription(answer)
        .setFooter({ text: '高島 | 私の回答はあくまで参考です。最終判断はあなたたちがしてください。' });
      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      return interaction.editReply('高島です。現在応答できません。後ほど再度お試しください。');
    }
  }

  // ── /posted ──────────────────────────────────────────────────────────────────
  if (commandName === 'posted') {
    const title = interaction.options.getString('タイトル');
    const type = interaction.options.getString('種類');
    const label = type === 'short' ? '📱 ショート' : '📺 横動画';

    recordPost();

    const progressCh = findChannel(interaction.guild, CH.PROGRESS);
    const weekCount = getWeeklyPosts();
    const weekComment = weekCount >= 5
      ? '今週は本数が出ています。質も維持できているか確認してください。'
      : weekCount >= 3
      ? 'ペースは悪くありません。このまま続けましょう。'
      : '本数がまだ少ないです。ショートでもいいので積み上げてください。';

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('📹 投稿記録 — 高島')
      .addFields(
        { name: '種類', value: label, inline: true },
        { name: '今週の投稿', value: `${weekCount}本目`, inline: true },
      )
      .setDescription(`**「${title}」** の投稿を確認しました。\n\n${weekComment}`)
      .setFooter({ text: '高島 | 投稿した事実は財産です。続けてください。' });

    if (progressCh) {
      await progressCh.send({ embeds: [embed] }).catch(() => {});
    }
    return interaction.reply({ embeds: [embed] });
  }
});

// ─── メンション対応チャット ───────────────────────────────────────────────────────

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  const userText = message.content.replace(/<@!?\d+>/g, '').trim();
  if (!userText) {
    return message.reply('何かご用でしょうか？— 高島');
  }

  await message.channel.sendTyping();

  try {
    // 検索が必要そうなキーワードがあれば Web 検索して情報を補完
    const needsSearch = /トレンド|最新|流行|ニュース|今|検索/.test(userText);
    let searchContext = '';
    if (needsSearch) {
      const { answer } = await searchQuery(userText).catch(() => ({ answer: '' }));
      searchContext = answer;
    }

    const reply = await chat(message.guildId, userText, persona, searchContext);
    await message.reply(reply);
  } catch (e) {
    console.error('chat error:', e);
    await message.reply('申し訳ありません、現在応答できません。後ほど再度お試しください。— 高島');
  }
});

client.login(process.env.DISCORD_TOKEN);
