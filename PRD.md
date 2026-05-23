単語帳アプリ — 仕様書　Palemu
概要
バロック音楽用ポルトガル語単語帳。Space Repetitionで効率よく定着させる、モバイル・デスクトップ対応のWebアプリ。

技術スタック

フレームワーク: React (TSX) + Vite
スタイル: Tailwind CSS
永続化: localStorage
SR アルゴリズム: SM-2ベース（シンプル化）
デプロイ: 静的ファイル（GitHub Pages）

Create a github repository for this using gh command in my local

Use pnpm for package manager.

Use gh command to deploy app.

pnpm deploy should deploy the app to the github page

データモデル
tstype Confidence = "know" | "unsure" | "unknown";

interface Card {
  id: string;           // "solfe-sustenido" など
  pt: string;           // ポルトガル語
  en: string;           // 英語
  ja: string;           // 日本語
  category: Category;
  example?: string;     // 例文
}

interface CardState {
  id: string;
  interval: number;     // 次に出すまでの日数
  nextReview: number;   // Unix timestamp (ms)
  easeFactor: number;   // SM-2のEF (初期値 2.5)
  repetitions: number;  // 連続正解数
  lastConfidence: Confidence | null;
}

Space Repetition ロジック
SM-2をベースに3段階に簡略化：
ボタンSM-2 quality挙動わかる5interval × EF、EF微増不安3interval × 1.2（据え置き気味）、EF現状維持わからない1interval = 1日にリセット、EF減少
初回interval：

わかる → 4日後
不安 → 1日後
わからない → 当日中に再出題


画面構成
Home
├── 達成率バー（今日レビュー済み / 今日の対象）
├── カテゴリフィルター（全選択 / 個別）
├── 「今日の単語を始める」ボタン
└── 統計サマリー（総単語数、習得済み、要復習）

Study（メイン学習画面）
├── プログレスバー（今日の進捗）
├── カード（表: PT → 裏: EN + JA）
│   └── タップ/Spaceで反転
├── 3ボタン（わかる 🟢 / 不安 🟡 / わからない 🔴）
└── 「スキップ」（今日の学習を中断）

Stats（統計画面）
├── カテゴリ別達成率
├── 連続学習日数（streak）
└── 全単語の次回レビュー日一覧

達成率の定義
達成率 = 習得済み枚数 / 全枚数 × 100

習得済み = interval >= 7日 かつ lastConfidence === "know"
ホーム画面に常時表示。カテゴリ別にも出す。

localStorage 設計
ts// キー
"musicpt:cards"   → Record<string, CardState>
"musicpt:streak"  → { lastDate: string, count: number }

カードを追加しても既存のStateは保持
データリセットボタンをStats画面に配置


レスポンシブ対応
幅レイアウト< 640px (mobile)1カラム、カードは全幅、ボタン大きめ640px〜 (tablet+)最大幅 480px でセンタリング
カードのフリップはタップ・クリック・Spaceキーすべてに対応。

単語カテゴリ（55語）
words.txt を参照せよ

フェーズ
フェーズ内容v1上記すべて（MVP）v2音声読み上げ（Web Speech API、PT音声）v3PWA対応（オフライン、ホーム画面追加）
