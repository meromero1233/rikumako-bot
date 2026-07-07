import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('リクマコラジオ用のDiscordチャンネルを自動作成します（管理者のみ）'),

  new SlashCommandBuilder()
    .setName('task')
    .setDescription('タスク管理')
    .addSubcommand((s) =>
      s.setName('add').setDescription('タスクを追加').addStringOption((o) =>
        o.setName('内容').setDescription('タスクの内容').setRequired(true),
      ),
    )
    .addSubcommand((s) =>
      s.setName('done').setDescription('タスクを完了にする').addIntegerOption((o) =>
        o.setName('番号').setDescription('タスクID（/task listで確認）').setRequired(true),
      ),
    )
    .addSubcommand((s) =>
      s.setName('delete').setDescription('タスクを削除').addIntegerOption((o) =>
        o.setName('番号').setDescription('タスクID').setRequired(true),
      ),
    )
    .addSubcommand((s) => s.setName('list').setDescription('タスク一覧を表示')),

  new SlashCommandBuilder()
    .setName('subscribers')
    .setDescription('現在のYouTube登録者数を更新')
    .addIntegerOption((o) =>
      o.setName('人数').setDescription('現在の登録者数').setRequired(true).setMinValue(0),
    ),

  new SlashCommandBuilder()
    .setName('progress')
    .setDescription('チャンネルの現在の進捗を表示（登録者数・タスク状況）'),

  new SlashCommandBuilder()
    .setName('script')
    .setDescription('今日の動画脚本アイデアをAIに生成してもらう'),

  new SlashCommandBuilder()
    .setName('trend')
    .setDescription('今日のトレンドネタをAIにピックアップしてもらう'),

  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('AIに何でも相談する')
    .addStringOption((o) =>
      o.setName('質問').setDescription('AIへの質問・相談内容').setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName('posted')
    .setDescription('動画を投稿したことを記録する')
    .addStringOption((o) =>
      o.setName('タイトル').setDescription('投稿した動画のタイトル').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('種類').setDescription('動画の種類').setRequired(true).addChoices(
        { name: 'ショート', value: 'short' },
        { name: '横動画', value: 'long' },
      ),
    ),
].map((c) => c.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  console.log('スラッシュコマンドを登録中...');
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
  console.log('✅ 登録完了！');
})();
