import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
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

test('workflow skill description states its trigger without summarizing the workflow', async () => {
  const rootDir = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
  const skill = await readFile(
    path.join(rootDir, 'preset', 'plugin-builder', 'skills', 'plugin-builder-workflow', 'SKILL.md'),
    'utf8',
  )

  assert.match(
    skill,
    /^---\r?\nname: plugin-builder-workflow\r?\ndescription: Use when a DSH plugin must be created, changed, repaired, packaged, installed, or reviewed\./,
  )
})
