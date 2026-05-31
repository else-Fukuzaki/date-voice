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
