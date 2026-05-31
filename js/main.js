import { formatDisplay, formatSpeech, formatTime } from './dateText.js'
import { speak } from './speak.js'

const display = document.getElementById('date-display')
const timeDisplay = document.getElementById('time-display')
const tapArea = document.getElementById('tap-area')
const button = document.getElementById('speak-button')

// 日付と時刻の両方を最新の現在時刻で更新する。
// 値が変わったときだけ DOM に書き込む（aria-live の重複読み上げ・無駄な更新を防ぐ）。
function render() {
  const now = new Date()
  const dateText = formatDisplay(now)
  const timeText = formatTime(now)
  if (display.textContent !== dateText) display.textContent = dateText
  if (timeDisplay.textContent !== timeText) timeDisplay.textContent = timeText
}

function announce() {
  render() // タップ時にも最新化
  speak(formatSpeech(new Date()))
}

// 初期表示
render()

// 動く時計：毎秒チェックし、分が変わったら表示を更新する（日付跨ぎも自動反映）。
setInterval(render, 1000)

// 画面どこでもタップで読み上げ
tapArea.addEventListener('click', announce)
// ボタンは目印（クリックが上の click にも伝播するため二重発話を防ぐ）
button.addEventListener('click', (e) => { e.stopPropagation() })
button.addEventListener('click', announce)

// 画面に戻ってきたら表示を最新化（日付跨ぎ対策）
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render()
})

// PWA: Service Worker 登録（失敗してもアプリは動く）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((err) => {
      console.warn('Service Worker 登録に失敗:', err)
    })
  })
}
