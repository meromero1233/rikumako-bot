// リクマコラジオ Discordサーバー構成
// チャンネル名・カテゴリーをここで管理

export const CATEGORIES = [
  {
    name: '📌 スタート',
    channels: [
      { name: 'ようこそ', type: 'text', topic: 'リクマコラジオへようこそ！まずここを読んでね🎙️' },
      { name: 'ルール', type: 'text', topic: 'チームのルール・約束ごと' },
      { name: '目標マイルストーン', type: 'text', topic: '100万人への道のり・節目の目標をここに記録' },
    ],
  },
  {
    name: '📋 タスク管理',
    channels: [
      { name: '今日のタスク', type: 'text', topic: '毎朝9時にAIが自動投稿。その日やることをここで確認・報告！' },
      { name: '進捗報告', type: 'text', topic: '動画投稿・編集・企画などの進捗をここに報告' },
      { name: '完了ログ', type: 'text', topic: '完了したタスクの記録。振り返りに使おう' },
    ],
  },
  {
    name: '🤖 AI活用',
    channels: [
      { name: '今日の脚本案', type: 'text', topic: '毎朝AIがネタ・脚本アイデアを自動投稿！' },
      { name: 'トレンド情報', type: 'text', topic: '今日のトレンド・バズってる話題をAIがまとめて投稿' },
      { name: 'ai相談室', type: 'text', topic: '「この脚本どう？」「サムネ案考えて」などAIに何でも相談できる部屋' },
    ],
  },
  {
    name: '📈 チャンネル分析',
    channels: [
      { name: 'youtube登録者数', type: 'text', topic: '登録者数の記録。/subscribers コマンドで更新！' },
      { name: '改善メモ', type: 'text', topic: 'サムネ・タイトル・編集など改善したいことのメモ' },
      { name: 'バズ研究', type: 'text', topic: '伸びた動画・参考にしたいチャンネルの分析メモ' },
    ],
  },
  {
    name: '💬 コミュニケーション',
    channels: [
      { name: '雑談', type: 'text', topic: 'なんでも気軽に話せる場所' },
      { name: 'ミーティング議事録', type: 'text', topic: 'ミーティングで決まったことを記録しておく場所' },
      { name: 'アイデアメモ', type: 'text', topic: 'ふと思いついたネタ・企画案をメモする場所。思いついたらすぐ書こう！' },
    ],
  },
  {
    name: '🔊 ボイスチャンネル',
    channels: [
      { name: '作業通話', type: 'voice' },
      { name: 'ミーティング', type: 'voice' },
      { name: '収録スタジオ', type: 'voice' },
    ],
  },
];

// チャンネル名の定数（コード内から参照するため）
export const CH = {
  WELCOME: 'ようこそ',
  TASK: '今日のタスク',
  PROGRESS: '進捗報告',
  DONE_LOG: '完了ログ',
  SCRIPT: '今日の脚本案',
  TREND: 'トレンド情報',
  AI_CHAT: 'ai相談室',
  SUBSCRIBERS: 'youtube登録者数',
  CHAT: '雑談',
};
