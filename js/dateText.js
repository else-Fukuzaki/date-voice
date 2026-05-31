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

// 12時間制で「午前/午後 ◯時◯◯分」を返す。分は2桁ゼロ埋め。
// 0時=午前0時、12時=午後0時、14時=午後2時。
export function formatTime(date) {
  const hour24 = date.getHours()
  const minute = date.getMinutes()
  const period = hour24 < 12 ? '午前' : '午後'
  const hour12 = hour24 % 12
  const mm = String(minute).padStart(2, '0')
  return `${period}${hour12}時${mm}分`
}
