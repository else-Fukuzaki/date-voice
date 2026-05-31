import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDisplay, formatSpeech, formatTime } from '../js/dateText.js'

// new Date(year, monthIndex, day, hour, minute): monthIndex は 0 始まり（4 = 5月）

test('formatDisplay: 2026-05-30 は土曜日', () => {
  assert.equal(formatDisplay(new Date(2026, 4, 30)), '5月30日（土）')
})

test('formatSpeech: 2026-05-30 14:05 は「今日は…土曜日、14時5分です」', () => {
  assert.equal(formatSpeech(new Date(2026, 4, 30, 14, 5)), '今日は5月30日、土曜日、14時5分です')
})

test('formatDisplay: 日曜日 (2026-05-31)', () => {
  assert.equal(formatDisplay(new Date(2026, 4, 31)), '5月31日（日）')
})

test('formatSpeech: 日曜日・深夜0時 (2026-05-31 0:00)', () => {
  assert.equal(formatSpeech(new Date(2026, 4, 31, 0, 0)), '今日は5月31日、日曜日、0時0分です')
})

test('formatDisplay: 木曜日・月初 (2026-01-01)', () => {
  assert.equal(formatDisplay(new Date(2026, 0, 1)), '1月1日（木）')
})

test('formatSpeech: 木曜日・月初 (2026-01-01 9:09)', () => {
  assert.equal(formatSpeech(new Date(2026, 0, 1, 9, 9)), '今日は1月1日、木曜日、9時9分です')
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

// --- formatTime: 24時間制・分は2桁ゼロ埋め（画面表示用） ---

test('formatTime: 午後 (14:05 → 14時05分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 14, 5)), '14時05分')
})

test('formatTime: 深夜0時 (0:00 → 0時00分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 0, 0)), '0時00分')
})

test('formatTime: 正午 (12:00 → 12時00分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 12, 0)), '12時00分')
})

test('formatTime: 午前 (9:09 → 9時09分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 9, 9)), '9時09分')
})

test('formatTime: 一日の終わり (23:59 → 23時59分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 23, 59)), '23時59分')
})

test('formatTime: 分は常に2桁ゼロ埋め (13:03 → 13時03分)', () => {
  assert.equal(formatTime(new Date(2026, 4, 31, 13, 3)), '13時03分')
})
