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
