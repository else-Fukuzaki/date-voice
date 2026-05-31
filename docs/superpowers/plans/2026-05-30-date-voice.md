# 日付音声告知アプリ（きょう） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 画面をタップすると今日の日付（月・日・曜日）を大きな文字で表示し、音声で「今日は5月30日、土曜日です」と読み上げる静的 Web アプリ（PWA）を作る。

**Architecture:** サーバー不要の静的サイト。日付の文字列生成を純粋関数 `dateText.js`（ESMモジュール）に切り出し、Node 22 内蔵テストランナーで単体テストする。`speak.js` が音声合成を、`main.js` が DOM 配線を担当。`manifest.json` ＋ Service Worker でホーム画面追加・オフライン表示に対応。

**Tech Stack:** HTML / CSS / Vanilla JS（ESM）、Web Speech API（`SpeechSynthesis`）、PWA、テストは `node --test`（依存パッケージなし）。

**作業ディレクトリ:** `/home/fukuzaki/deploy100/date-voice/`（既存の `notice/` とは別プロジェクト）

---

## File Structure

```
date-voice/
├── package.json          test スクリプト定義・"type": "module"
├── index.html            画面（日付表示・大きなボタン）
├── style.css             特大文字・高コントラスト
├── js/
│   ├── dateText.js       日付→表示文/読み上げ文（純粋関数・ESM・テスト対象）
│   ├── speak.js          Web Speech API ラッパー（音声を分離）
│   └── main.js           DOM配線（タップ→表示更新＆発話、SW登録）
├── test/
│   └── dateText.test.js  dateText.js のユニットテスト（node --test）
├── manifest.json         PWA設定
├── service-worker.js     最小キャッシュ
├── icons/
│   ├── icon-192.png      ホーム画面アイコン（192x192）
│   └── icon-512.png      ホーム画面アイコン（512x512）
└── README.md             起動・テスト・公開手順
```

各ファイルは単一責務。`dateText.js` は DOM にも音声にも依存しない純粋関数なので独立してテスト可能。`speak.js` は音声手段を閉じ込め、将来の差し替え（録音音声・LIFF）に備える。

---

## Task 1: プロジェクト初期化（package.json）

**Files:**
- Create: `/home/fukuzaki/deploy100/date-voice/package.json`

- [ ] **Step 1: package.json を作成**

`/home/fukuzaki/deploy100/date-voice/package.json`:

```json
{
  "name": "date-voice",
  "version": "1.0.0",
  "description": "Tap-to-speak date announcer for people with cognitive decline",
  "type": "module",
  "scripts": {
    "test": "node --test",
    "start": "node --version >/dev/null && npx --yes serve ."
  }
}
```

`"type": "module"` により `.js` を ESM として `node --test` から import できる。`start` は確認用の簡易静的サーバー（任意）。

- [ ] **Step 2: テストランナーが動くことを確認**

Run: `cd /home/fukuzaki/deploy100/date-voice && node --test`
Expected: テストファイルが無いので「0 tests」相当で正常終了（エラーにならないこと）。

- [ ] **Step 3: Commit（git未初期化なら先に init）**

```bash
cd /home/fukuzaki/deploy100/date-voice
git init -q 2>/dev/null || true
printf "node_modules/\n.DS_Store\n" > .gitignore
git add package.json .gitignore
git commit -q -m "chore: scaffold date-voice project"
```

---

## Task 2: 日付ロジック `dateText.js`（TDD）

**Files:**
- Create: `/home/fukuzaki/deploy100/date-voice/js/dateText.js`
- Test: `/home/fukuzaki/deploy100/date-voice/test/dateText.test.js`

`Date` の `getMonth()`（0始まり）, `getDate()`, `getDay()`（0=日曜）をローカル時刻で使う。曜日は1つの配列 `['日','月','火','水','木','金','土']` で表示・音声の両方を生成する。

- [ ] **Step 1: 失敗するテストを書く**

`/home/fukuzaki/deploy100/date-voice/test/dateText.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDisplay, formatSpeech } from '../js/dateText.js'

// new Date(year, monthIndex, day): monthIndex は 0 始まり（4 = 5月）

test('formatDisplay: 2026-05-30 は土曜日', () => {
  assert.equal(formatDisplay(new Date(2026, 4, 30)), '5月30日（土）')
})

test('formatSpeech: 2026-05-30 は「今日は…土曜日です」', () => {
  assert.equal(formatSpeech(new Date(2026, 4, 30)), '今日は5月30日、土曜日です')
})

test('formatDisplay: 日曜日 (2026-05-31)', () => {
  assert.equal(formatDisplay(new Date(2026, 4, 31)), '5月31日（日）')
})

test('formatSpeech: 日曜日 (2026-05-31)', () => {
  assert.equal(formatSpeech(new Date(2026, 4, 31)), '今日は5月31日、日曜日です')
})

test('formatDisplay: 木曜日・月初 (2026-01-01)', () => {
  assert.equal(formatDisplay(new Date(2026, 0, 1)), '1月1日（木）')
})

test('formatSpeech: 木曜日・月初 (2026-01-01)', () => {
  assert.equal(formatSpeech(new Date(2026, 0, 1)), '今日は1月1日、木曜日です')
})

test('formatDisplay: 年末 (2026-12-31 木)', () => {
  assert.equal(formatDisplay(new Date(2026, 11, 31)), '12月31日（木）')
})

test('全曜日を網羅（2026-05-24〜05-30）', () => {
  const expected = [
    '5月24日（日）',
    '5月25日（月）',
    '5月26日（火）',
    '5月27日（水）',
    '5月28日（木）',
    '5月29日（金）',
    '5月30日（土）',
  ]
  for (let i = 0; i < 7; i++) {
    assert.equal(formatDisplay(new Date(2026, 4, 24 + i)), expected[i])
  }
})

test('数字は半角アラビア数字（全角でない）', () => {
  assert.equal(formatDisplay(new Date(2026, 2, 1)), '3月1日（日）')
})
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `cd /home/fukuzaki/deploy100/date-voice && node --test`
Expected: FAIL（`dateText.js` が存在せず import エラー）。

- [ ] **Step 3: 最小実装を書く**

`/home/fukuzaki/deploy100/date-voice/js/dateText.js`:

```js
// 日付→文字列の純粋関数。DOM にも音声にも依存しない。
// getDay(): 0=日曜 … 6=土曜
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function formatDisplay(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS[date.getDay()]
  return `${month}月${day}日（${weekday}）`
}

export function formatSpeech(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS[date.getDay()]
  return `今日は${month}月${day}日、${weekday}曜日です`
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `cd /home/fukuzaki/deploy100/date-voice && node --test`
Expected: PASS（全テスト pass、tests/pass の数が一致）。

- [ ] **Step 5: Commit**

```bash
cd /home/fukuzaki/deploy100/date-voice
git add js/dateText.js test/dateText.test.js
git commit -q -m "feat: add dateText pure functions with unit tests"
```

---

## Task 3: 音声ラッパー `speak.js`

DOM/ブラウザ API 依存のため Node では単体テストせず、実機で手動確認する（偽テストは書かない）。`SpeechSynthesis` が無い/失敗してもアプリを止めない。

**Files:**
- Create: `/home/fukuzaki/deploy100/date-voice/js/speak.js`

- [ ] **Step 1: speak.js を実装**

`/home/fukuzaki/deploy100/date-voice/js/speak.js`:

```js
// Web Speech API（音声合成）を閉じ込めるラッパー。
// 将来、録音音声や別手段へ差し替えてもここだけ変えれば済む。
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text) {
  if (!isSpeechSupported()) {
    console.warn('SpeechSynthesis 非対応のため音声を再生できません')
    return false
  }
  try {
    // 連打時に前の発話を止めて重なりを防ぐ
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ja-JP'
    utter.rate = 0.95 // ゆっくりめ（高齢者向け）
    window.speechSynthesis.speak(utter)
    return true
  } catch (err) {
    console.error('音声再生に失敗:', err)
    return false
  }
}
```

- [ ] **Step 2: 構文チェック**

Run: `cd /home/fukuzaki/deploy100/date-voice && node --check js/speak.js`
Expected: 出力なし・終了コード0（構文OK）。

- [ ] **Step 3: Commit**

```bash
cd /home/fukuzaki/deploy100/date-voice
git add js/speak.js
git commit -q -m "feat: add speak.js Web Speech API wrapper"
```

---

## Task 4: 画面 `index.html` ＋ `style.css`

**Files:**
- Create: `/home/fukuzaki/deploy100/date-voice/index.html`
- Create: `/home/fukuzaki/deploy100/date-voice/style.css`

- [ ] **Step 1: index.html を作成**

`/home/fukuzaki/deploy100/date-voice/index.html`:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1a3a5c">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <title>きょう</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main id="tap-area" aria-label="画面をタップすると今日の日付を読み上げます">
    <p id="date-display" aria-live="polite">読み込み中…</p>
    <button id="speak-button" type="button">日付を読み上げる</button>
    <p id="hint">画面のどこを押しても読み上げます</p>
  </main>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: style.css を作成**

`/home/fukuzaki/deploy100/date-voice/style.css`:

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body { height: 100%; }

body {
  font-family: system-ui, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  background: #f5f1e8;       /* やわらかい生成り色 */
  color: #1a3a5c;            /* 濃紺：高コントラスト */
  -webkit-user-select: none;
  user-select: none;
}

#tap-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6vh;
  padding: 5vw;
  cursor: pointer;
  text-align: center;
}

#date-display {
  font-size: clamp(48px, 18vw, 220px);
  font-weight: 800;
  line-height: 1.15;
}

#speak-button {
  font-size: clamp(24px, 7vw, 56px);
  font-weight: 700;
  color: #fff;
  background: #1a3a5c;
  border: none;
  border-radius: 16px;
  padding: 0.6em 1.2em;
  cursor: pointer;
}

#speak-button:active { background: #122a44; }

#hint {
  font-size: clamp(16px, 4vw, 28px);
  color: #5a6a78;
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/fukuzaki/deploy100/date-voice
git add index.html style.css
git commit -q -m "feat: add UI markup and large high-contrast styles"
```

---

## Task 5: 配線 `main.js`

**Files:**
- Create: `/home/fukuzaki/deploy100/date-voice/js/main.js`

タップ（画面全体＋ボタン）で「表示更新→発話」。開きっぱなしで日付が変わっても、タップ時と画面復帰時（`visibilitychange`）に再計算する。

- [ ] **Step 1: main.js を作成**

`/home/fukuzaki/deploy100/date-voice/js/main.js`:

```js
import { formatDisplay, formatSpeech } from './dateText.js'
import { speak } from './speak.js'

const display = document.getElementById('date-display')
const tapArea = document.getElementById('tap-area')
const button = document.getElementById('speak-button')

function renderDate() {
  display.textContent = formatDisplay(new Date())
}

function announce() {
  const now = new Date()
  display.textContent = formatDisplay(now) // タップ時にも最新化
  speak(formatSpeech(now))
}

// 初期表示
renderDate()

// 画面どこでもタップで読み上げ
tapArea.addEventListener('click', announce)
// ボタンは目印（クリックが上の click にも伝播するため二重発話を防ぐ）
button.addEventListener('click', (e) => { e.stopPropagation() })
button.addEventListener('click', announce)

// 画面に戻ってきたら表示を最新化（日付跨ぎ対策）
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderDate()
})

// PWA: Service Worker 登録（失敗してもアプリは動く）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((err) => {
      console.warn('Service Worker 登録に失敗:', err)
    })
  })
}
```

- [ ] **Step 2: 構文チェック**

Run: `cd /home/fukuzaki/deploy100/date-voice && node --check js/main.js`
Expected: 出力なし・終了コード0。

> 注: `node --check` は import 先の存在までは見ない。配線の最終確認は Task 8 の実機テストで行う。

- [ ] **Step 3: Commit**

```bash
cd /home/fukuzaki/deploy100/date-voice
git add js/main.js
git commit -q -m "feat: wire tap/button to render and speak"
```

---

## Task 6: PWA（manifest・アイコン・Service Worker）

**Files:**
- Create: `/home/fukuzaki/deploy100/date-voice/manifest.json`
- Create: `/home/fukuzaki/deploy100/date-voice/service-worker.js`
- Create: `/home/fukuzaki/deploy100/date-voice/icons/icon-192.png`
- Create: `/home/fukuzaki/deploy100/date-voice/icons/icon-512.png`

- [ ] **Step 1: manifest.json を作成**

`/home/fukuzaki/deploy100/date-voice/manifest.json`:

```json
{
  "name": "きょう",
  "short_name": "きょう",
  "description": "今日の日付と曜日を音声で知らせます",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#f5f1e8",
  "theme_color": "#1a3a5c",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: service-worker.js を作成**

`/home/fukuzaki/deploy100/date-voice/service-worker.js`:

```js
// 最小キャッシュ。オフラインでも画面表示できるようにする。
const CACHE = 'kyou-v1'
const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'js/main.js',
  'js/dateText.js',
  'js/speak.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  )
})
```

- [ ] **Step 3: アイコンを生成（依存なし・Node でPNG生成）**

下記スクリプトで無地（濃紺背景に白「今」）の正方形 PNG を生成する。`/home/fukuzaki/deploy100/date-voice/scripts/make-icons.mjs` を作成:

```js
// 依存パッケージなしで最小の単色PNGを生成する（zlib同梱）。
// 簡易のためアイコンは単色 #1a3a5c の正方形（後で本番アイコンに差し替え可）。
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8bit, truecolor RGB
  const row = Buffer.alloc(1 + size * 3)
  for (let x = 0; x < size; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b }
  const raw = Buffer.concat(Array.from({ length: size }, () => row))
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(new URL('../icons/', import.meta.url), { recursive: true })
const navy = [0x1a, 0x3a, 0x5c]
writeFileSync(new URL('../icons/icon-192.png', import.meta.url), png(192, navy))
writeFileSync(new URL('../icons/icon-512.png', import.meta.url), png(512, navy))
console.log('icons written')
```

Run: `cd /home/fukuzaki/deploy100/date-voice && node scripts/make-icons.mjs`
Expected: `icons written` と表示され、`icons/icon-192.png` と `icons/icon-512.png` が作成される。

- [ ] **Step 4: アイコンが有効な PNG か確認**

Run: `cd /home/fukuzaki/deploy100/date-voice && file icons/icon-192.png icons/icon-512.png`
Expected: 両方とも `PNG image data, 192 x 192` / `512 x 512` と表示。

- [ ] **Step 5: Commit**

```bash
cd /home/fukuzaki/deploy100/date-voice
git add manifest.json service-worker.js scripts/make-icons.mjs icons/icon-192.png icons/icon-512.png
git commit -q -m "feat: add PWA manifest, service worker, and placeholder icons"
```

---

## Task 7: README（起動・テスト・公開手順）

**Files:**
- Create: `/home/fukuzaki/deploy100/date-voice/README.md`

- [ ] **Step 1: README.md を作成**

`/home/fukuzaki/deploy100/date-voice/README.md`:

```markdown
# きょう（日付音声告知アプリ）

画面をタップすると、今日の日付と曜日を大きな文字で表示し、音声で「今日は◯月◯日、◯曜日です」と読み上げる Web アプリ（PWA）。認知機能が衰えてきた方が、日付・曜日を確認するための補助ツール。

## ローカルで動かす

静的サイトなのでビルド不要。簡易サーバーで開く:

\`\`\`bash
npx --yes serve .
# 表示された http://localhost:3000 などをスマホ/PCのブラウザで開く
\`\`\`

（`file://` で直接開くと Service Worker / module が制限されるため、サーバー経由で開くこと。）

## テスト

\`\`\`bash
node --test
\`\`\`

日付→文字列ロジック（`js/dateText.js`）の単体テストが走る。

## アイコンの再生成

\`\`\`bash
node scripts/make-icons.mjs
\`\`\`

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
```

- [ ] **Step 2: Commit**

```bash
cd /home/fukuzaki/deploy100/date-voice
git add README.md
git commit -q -m "docs: add README with run, test, and deploy steps"
```

---

## Task 8: 実機/ブラウザ手動確認

自動テスト対象外（DOM・音声・PWA）の最終確認。

**Files:** なし（確認のみ）

- [ ] **Step 1: ローカルサーバーで開く**

Run: `cd /home/fukuzaki/deploy100/date-voice && npx --yes serve .`
表示された URL をブラウザで開く。

- [ ] **Step 2: 表示を確認**

- 画面中央に今日の日付が特大で出る（例：今日なら「5月30日（土）」）
- 「日付を読み上げる」ボタンと「画面のどこを押しても…」のヒントが見える

- [ ] **Step 3: 音声を確認**

- 画面の何もない所をタップ → 「今日は◯月◯日、◯曜日です」と発話する
- ボタンをタップ → 同じく一度だけ発話する（二重発話しない）

- [ ] **Step 4: PWA を確認**

- スマホのブラウザで開き「ホーム画面に追加」→ アイコンが追加される
- 追加したアイコンから起動 → アドレスバー無しのアプリ表示で動く
- 機内モード（オフライン）でも画面表示される（Service Worker キャッシュ）

- [ ] **Step 5: 全テスト最終確認**

Run: `cd /home/fukuzaki/deploy100/date-voice && node --test`
Expected: 全テスト PASS。

---

## 完了の定義

- `node --test` が全 PASS
- ローカルでタップ／ボタンの両方で正しい日付を発話
- 大きな日付表示が今日の正しい曜日を出す
- ホーム画面に追加でき、オフラインでも画面が出る
- README に起動・テスト・公開手順が揃っている
