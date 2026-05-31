import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDisplay, formatSpeech, formatTime } from '../js/dateText.js'

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

// --- formatTime: 12時間制（午前/午後）・分は2桁 ---

test('formatTime: 午後 (14:05 → 午後2時05分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 14, 5)), '午後2時05分')
})

test('formatTime: 深夜0時 (0:00 → 午前0時00分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 0, 0)), '午前0時00分')
})

test('formatTime: 正午 (12:00 → 午後0時00分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 12, 0)), '午後0時00分')
})

test('formatTime: 午前 (9:09 → 午前9時09分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 9, 9)), '午前9時09分')
})

test('formatTime: 午前11時台 (11:00 → 午前11時00分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 11, 0)), '午前11時00分')
})

test('formatTime: 一日の終わり (23:59 → 午後11時59分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 23, 59)), '午後11時59分')
})

test('formatTime: 分は常に2桁ゼロ埋め (午後1時03分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 13, 3)), '午後1時03分')
})
