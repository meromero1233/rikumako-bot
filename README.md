# 🎙️ リクマコラジオ Discord Bot

リクムとマコの2人が100万人登録を目指すための Discord チーム管理ボット。

## セットアップ手順

### 1. 必要なものを用意する

- **Discordボットトークン** → [Discord Developer Portal](https://discord.com/developers/applications) で作成
- **Anthropic APIキー** → [Anthropic Console](https://console.anthropic.com) で取得

### 2. 環境変数を設定する

```bash
cp .env.example .env
```

`.env` を開いて3つの値を入力：

```
DISCORD_TOKEN=（Discordボットのトークン）
DISCORD_CLIENT_ID=（アプリケーションID）
ANTHROPIC_API_KEY=（AnthropicのAPIキー）
```

### 3. パッケージをインストール

```bash
npm install
```

### 4. スラッシュコマンドを登録

```bash
npm run deploy-commands
```

### 5. ボットを起動

```bash
npm start
```

### 6. Discordでチャンネルを自動作成

Discordサーバーで管理者が `/setup` を実行するだけ！

---

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `/setup` | サーバーのチャンネルを自動作成（管理者のみ） |
| `/task add <内容>` | タスクを追加 |
| `/task done <番号>` | タスクを完了にする |
| `/task delete <番号>` | タスクを削除 |
| `/task list` | タスク一覧を表示 |
| `/subscribers <人数>` | YouTube登録者数を更新 |
| `/progress` | 現在の進捗（登録者・タスク）を表示 |
| `/script` | AIに脚本アイデアを生成してもらう |
| `/trend` | AIに今日のトレンドネタをピックアップしてもらう |
| `/ask <質問>` | AIに何でも相談する |
| `/posted <タイトル> <種類>` | 動画投稿を記録する |

## 自動投稿（毎朝9時 JST）

- **📋 今日のタスク** → `今日のタスク` チャンネルに自動投稿
- **🎙️ 脚本アイデア** → `今日の脚本案` チャンネルにAIが生成して投稿
- **🔥 トレンドネタ** → `トレンド情報` チャンネルにAIがまとめて投稿
- **📊 週次サマリー** → 月曜のみ `雑談` チャンネルに週まとめを投稿
