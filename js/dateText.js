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
