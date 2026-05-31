# きょう（日付音声告知アプリ）

画面をタップすると、今日の日付と曜日を大きな文字で表示し、音声で「今日は◯月◯日、◯曜日です」と読み上げる Web アプリ（PWA）。認知機能が衰えてきた方が、日付・曜日を確認するための補助ツール。

## ローカルで動かす

静的サイトなのでビルド不要。簡易サーバーで開く:

```bash
npx --yes serve .
# 表示された http://localhost:3000 などをスマホ/PCのブラウザで開く
```

（`file://` で直接開くと Service Worker / module が制限されるため、サーバー経由で開くこと。）

## テスト

```bash
node --test
```

日付→文字列ロジック（`js/dateText.js`）の単体テストが走る。

## アイコンの再生成

```bash
node scripts/make-icons.mjs
```

現状は単色のプレースホルダー。本番アイコンに差し替える場合は `icons/icon-192.png` と `icons/icon-512.png` を同サイズで上書きする。

## 公開（例：GitHub Pages）

1. このフォルダを GitHub リポジトリに push
2. Settings → Pages → Branch を `main` / root に設定
3. 発行された URL をご本人の端末で開き、ブラウザの「ホーム画面に追加」でアイコンを設置

Netlify / Vercel でも、フォルダをドラッグ＆ドロップ（または連携）するだけで公開できる。

## 構成

- `index.html` / `style.css` … 画面
- `js/dateText.js` … 日付→表示文/読み上げ文（純粋関数・テスト対象）
- `js/speak.js` … Web Speech API ラッパー
- `js/main.js` … タップ配線・SW登録
- `manifest.json` / `service-worker.js` … PWA

## 将来の拡張

- 薬・予定の通知
- LINE ミニアプリ（LIFF）化：本アプリはそのまま LIFF として載せられる
