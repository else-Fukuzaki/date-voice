// 日付→文字列の純粋関数。DOM にも音声にも依存しない。
// getDay(): 0=日曜 … 6=土曜
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function formatDisplay(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS[date.getDay()]
  return `${month}月${day}日（${weekday}）`
}

// 音声用：日付＋時刻。時刻は耳に自然なようゼロ埋めしない（24時間制）。
export function formatSpeech(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS[date.getDay()]
  const hour = date.getHours()
  const minute = date.getMinutes()
  return `今日は${month}月${day}日、${weekday}曜日、${hour}時${minute}分です`
}

// 画面表示用：24時間制「◯時◯◯分」。分は2桁ゼロ埋め。
export function formatTime(date) {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const mm = String(minute).padStart(2, '0')
  return `${hour}時${mm}分`
}
