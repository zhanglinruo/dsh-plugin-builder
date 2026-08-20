import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('package checker accepts the complete distributable inventory', async () => {
  const rootDir = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
  const { checkPackage } = await import('../src/check.mjs')

  assert.deepEqual(await checkPackage({ rootDir }), {
    kind: 'valid-package',
    name: 'dsh-plugin-builder',
    version: '0.1.0',
    presetId: 'plugin-builder',
    filesChecked: 8,
  })
})
