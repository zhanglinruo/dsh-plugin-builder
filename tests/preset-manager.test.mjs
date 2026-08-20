import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import * as presetManager from '../src/preset-manager.mjs'
import { installPreset } from '../src/preset-manager.mjs'

async function createPresetFixture(root) {
  const source = path.join(root, 'source-preset')
  await mkdir(path.join(source, 'skills', 'plugin-builder-workflow'), { recursive: true })
  await writeFile(path.join(source, 'preset.yml'), 'name: 插件构建器\n')
  await writeFile(path.join(source, 'agent.cordis.yml'), '- id: persona\n  name: test-persona\n')
  await writeFile(
    path.join(source, 'skills', 'plugin-builder-workflow', 'SKILL.md'),
    '# Plugin Builder Workflow\n',
  )
  return source
}

test('fresh install publishes the complete preset in the DSH user preset root', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const sourceDir = await createPresetFixture(root)

  const receipt = await installPreset({ dshHome, sourceDir })

  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')
  assert.deepEqual(receipt, { kind: 'installed', target, replaced: false })
  assert.equal(await readFile(path.join(target, 'preset.yml'), 'utf8'), 'name: 插件构建器\n')
  assert.equal(
    await readFile(path.join(target, 'skills', 'plugin-builder-workflow', 'SKILL.md'), 'utf8'),
    '# Plugin Builder Workflow\n',
  )
})

test('install refuses to overwrite an existing preset', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')
  const sourceDir = await createPresetFixture(root)
  await mkdir(target, { recursive: true })
  await writeFile(path.join(target, 'owner-file.txt'), 'keep me\n')

  await assert.rejects(
    installPreset({ dshHome, sourceDir }),
    (error) => error.code === 'PRESET_EXISTS',
  )

  assert.equal(await readFile(path.join(target, 'owner-file.txt'), 'utf8'), 'keep me\n')
})

test('explicit replacement publishes the packaged preset over the previous target', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')
  const sourceDir = await createPresetFixture(root)
  await mkdir(target, { recursive: true })
  await writeFile(path.join(target, 'owner-file.txt'), 'old preset\n')

  const receipt = await installPreset({ dshHome, sourceDir, replace: true })

  assert.deepEqual(receipt, { kind: 'installed', target, replaced: true })
  assert.equal(await readFile(path.join(target, 'preset.yml'), 'utf8'), 'name: 插件构建器\n')
  await assert.rejects(readFile(path.join(target, 'owner-file.txt')), { code: 'ENOENT' })
})

test('status reports whether the Plugin Builder preset is installed', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')

  assert.deepEqual(await presetManager.getPresetStatus({ dshHome }), {
    kind: 'status',
    installed: false,
    target,
  })

  await mkdir(target, { recursive: true })
  assert.deepEqual(await presetManager.getPresetStatus({ dshHome }), {
    kind: 'status',
    installed: true,
    target,
  })
})

test('uninstall removes only the Plugin Builder preset target', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const presetsRoot = path.join(dshHome, '.agent-presets')
  const target = path.join(presetsRoot, 'plugin-builder')
  const sibling = path.join(presetsRoot, 'my-other-preset')
  await mkdir(target, { recursive: true })
  await mkdir(sibling, { recursive: true })
  await writeFile(path.join(sibling, 'keep.txt'), 'keep me\n')

  assert.deepEqual(await presetManager.uninstallPreset({ dshHome }), {
    kind: 'uninstalled',
    target,
  })
  assert.equal((await presetManager.getPresetStatus({ dshHome })).installed, false)
  assert.equal(await readFile(path.join(sibling, 'keep.txt'), 'utf8'), 'keep me\n')
  assert.deepEqual(await presetManager.uninstallPreset({ dshHome }), {
    kind: 'not-installed',
    target,
  })
})

test('preset validation rejects a package missing required workflow files', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const sourceDir = path.join(root, 'incomplete-preset')
  await mkdir(sourceDir, { recursive: true })
  await writeFile(path.join(sourceDir, 'preset.yml'), 'name: incomplete\n')

  await assert.rejects(
    presetManager.validatePackagedPreset({ sourceDir }),
    (error) => error.code === 'INVALID_PRESET'
      && error.message.includes('agent.cordis.yml'),
  )
})

test('the distributed Plugin Builder preset passes lifecycle validation', async () => {
  const sourceDir = path.resolve(fileURLToPath(new URL('../preset/plugin-builder/', import.meta.url)))

  assert.deepEqual(await presetManager.validatePackagedPreset({ sourceDir }), {
    kind: 'valid-preset',
    sourceDir,
  })
})
