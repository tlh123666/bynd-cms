import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { effectScope } from 'vue'
import { formatDate, formatDateTime } from './shared'
import { useWellnessDetail } from './useWellnessDetail'

test('stat dates preserve the recorded calendar day, including in Portuguese', () => {
  assert.equal(formatDate('2026-11-09T00:00:00+08:00', 'en'), 'Nov 9, 2026')
  assert.equal(formatDate('invalid', 'en'), '—')
  assert.equal(formatDateTime('invalid', 'pt'), '—')
  assert.match(formatDate('2026-11-09', 'pt'), /nov/)
  assert.match(formatDateTime('2026-11-09T23:59:59Z', 'en', 'UTC'), /11:59 PM/)
})

test('changing or closing records prevents stale data and stale errors', async () => {
  let resolveA!: (value: string) => void
  let rejectA!: (error: Error) => void
  const scope = effectScope()
  const detail = scope.run(() =>
    useWellnessDetail((id: string) =>
      id === 'A'
        ? new Promise<string>((resolve, reject) => {
            resolveA = resolve
            rejectA = reject
          })
        : Promise.resolve('B data')
    )
  )!
  const first = detail.openDetail('A')
  await detail.openDetail('B')
  resolveA('A data')
  await first
  assert.equal(detail.detail.value, 'B data')
  assert.equal(detail.detailLoading.value, false)
  const closing = detail.openDetail('A')
  detail.drawerVisible.value = false
  rejectA(new Error('late failure'))
  await closing
  assert.equal(detail.detailError.value, false)
  scope.stop()
})

test('failed details can be retried with the same selected record', async () => {
  let attempts = 0
  const scope = effectScope()
  const detail = scope.run(() =>
    useWellnessDetail(async (id: string) => {
      if (++attempts === 1) throw new Error('offline')
      return id
    })
  )!
  await detail.openDetail('selected-user')
  assert.equal(detail.detailError.value, true)
  await detail.retryDetail()
  assert.equal(detail.detailError.value, false)
  assert.equal(detail.detail.value, 'selected-user')
  scope.stop()
})

test('new wellness labels have matching Chinese, English and Portuguese keys', () => {
  const dicts = ['en', 'zh', 'pt'].map((lang) =>
    JSON.parse(readFileSync(new URL(`../../locales/langs/${lang}.json`, import.meta.url), 'utf8'))
  )
  const keys = (value: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(value)
      .flatMap(([key, item]) =>
        typeof item === 'object' && item !== null
          ? keys(item as Record<string, unknown>, `${prefix}${key}.`)
          : [`${prefix}${key}`]
      )
      .sort()
  for (const locale of dicts) {
    assert.deepEqual(keys(locale.wellness.experience), keys(dicts[0].wellness.experience))
    assert.deepEqual(keys(locale.wellness.vitality), keys(dicts[0].wellness.vitality))
    for (const key of keys(dicts[0].wellness))
      assert.ok(keys(locale.wellness).includes(key), `Missing wellness translation: ${key}`)
    for (const key of Object.keys(dicts[0].menus.wellness))
      assert.ok(locale.menus.wellness[key], `Missing menu translation: ${key}`)
  }
})
