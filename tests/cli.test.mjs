import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

test('status returns exit code 2 when Plugin Builder is absent', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-cli-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const { runCli } = await import('../src/cli.mjs')

  assert.deepEqual(await runCli(['status', '--dsh-home', dshHome]), {
    exitCode: 2,
    stdout: `Plugin Builder is not installed at ${path.join(dshHome, '.agent-presets', 'plugin-builder')}.\n`,
    stderr: '',
  })
})

test('install copies the distributed preset into the selected DSH home', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-cli-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')
  const { runCli } = await import('../src/cli.mjs')

  assert.deepEqual(await runCli(['install', '--dsh-home', dshHome]), {
    exitCode: 0,
    stdout: `Plugin Builder installed at ${target}. Start a new DSH session and select 插件构建器.\n`,
    stderr: '',
  })
  assert.deepEqual(await runCli(['status', '--dsh-home', dshHome]), {
    exitCode: 0,
    stdout: `Plugin Builder is installed at ${target}.\n`,
    stderr: '',
  })
})

test('install returns an actionable error instead of overwriting an existing preset', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-cli-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')
  const { runCli } = await import('../src/cli.mjs')
  await runCli(['install', '--dsh-home', dshHome])

  assert.deepEqual(await runCli(['install', '--dsh-home', dshHome]), {
    exitCode: 1,
    stdout: '',
    stderr: `Plugin Builder preset already exists at ${target}. Use --replace to replace it.\n`,
  })
})

test('install with --replace explicitly replaces an existing preset', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-cli-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')
  const { runCli } = await import('../src/cli.mjs')
  await runCli(['install', '--dsh-home', dshHome])

  assert.deepEqual(await runCli(['install', '--dsh-home', dshHome, '--replace']), {
    exitCode: 0,
    stdout: `Plugin Builder replaced at ${target}. Start a new DSH session and select 插件构建器.\n`,
    stderr: '',
  })
})

test('uninstall reports removal and later reports an absent preset', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-cli-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dshHome = path.join(root, 'dsh-home')
  const target = path.join(dshHome, '.agent-presets', 'plugin-builder')
  const { runCli } = await import('../src/cli.mjs')
  await runCli(['install', '--dsh-home', dshHome])

  assert.deepEqual(await runCli(['uninstall', '--dsh-home', dshHome]), {
    exitCode: 0,
    stdout: `Plugin Builder uninstalled from ${target}.\n`,
    stderr: '',
  })
  assert.deepEqual(await runCli(['uninstall', '--dsh-home', dshHome]), {
    exitCode: 2,
    stdout: `Plugin Builder is not installed at ${target}.\n`,
    stderr: '',
  })
})

test('invalid command usage returns exit code 2 without changing files', async () => {
  const { runCli } = await import('../src/cli.mjs')
  const usage = 'Usage: dsh-plugin-builder <install|status|uninstall> [--dsh-home <path>] [--replace]\n'

  assert.deepEqual(await runCli([]), {
    exitCode: 2,
    stdout: '',
    stderr: usage,
  })
  assert.deepEqual(await runCli(['unknown']), {
    exitCode: 2,
    stdout: '',
    stderr: usage,
  })
})

test('DSH home resolves from DSH_HOME before the platform user home', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-plugin-builder-cli-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const fromEnvironment = path.join(root, 'configured-home')
  const { runCli } = await import('../src/cli.mjs')

  const configured = await runCli(['status'], {
    env: { DSH_HOME: fromEnvironment },
    userHome: path.join(root, 'user-home'),
  })
  assert.equal(
    configured.stdout,
    `Plugin Builder is not installed at ${path.join(fromEnvironment, '.agent-presets', 'plugin-builder')}.\n`,
  )

  const fallbackUserHome = path.join(root, 'fallback-user')
  const fallback = await runCli(['status'], { env: {}, userHome: fallbackUserHome })
  assert.equal(
    fallback.stdout,
    `Plugin Builder is not installed at ${path.join(fallbackUserHome, '.dsh', '.agent-presets', 'plugin-builder')}.\n`,
  )
})

test('invalid options are rejected at the command-line boundary', async () => {
  const { runCli } = await import('../src/cli.mjs')
  const expected = {
    exitCode: 2,
    stdout: '',
    stderr: 'Usage: dsh-plugin-builder <install|status|uninstall> [--dsh-home <path>] [--replace]\n',
  }

  assert.deepEqual(await runCli(['status', '--dsh-home']), expected)
  assert.deepEqual(await runCli(['status', '--replace']), expected)
  assert.deepEqual(await runCli(['install', '--unknown']), expected)
})
