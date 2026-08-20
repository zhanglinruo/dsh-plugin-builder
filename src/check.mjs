#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { validatePackagedPreset } from './preset-manager.mjs'

const REQUIRED_DISTRIBUTION_FILES = [
  'package.json',
  'README.md',
  'LICENSE',
  'src/cli.mjs',
  'src/preset-manager.mjs',
  'preset/plugin-builder/preset.yml',
  'preset/plugin-builder/agent.cordis.yml',
  'preset/plugin-builder/skills/plugin-builder-workflow/SKILL.md',
]

function fail(message) {
  const error = new Error(`Invalid package: ${message}`)
  error.code = 'INVALID_PACKAGE'
  throw error
}

export async function checkPackage({ rootDir }) {
  const resolvedRoot = path.resolve(rootDir)
  for (const relativePath of REQUIRED_DISTRIBUTION_FILES) {
    try {
      await access(path.join(resolvedRoot, relativePath))
    } catch {
      fail(`missing ${relativePath}`)
    }
  }

  const manifest = JSON.parse(await readFile(path.join(resolvedRoot, 'package.json'), 'utf8'))
  if (manifest.name !== 'dsh-plugin-builder') fail('package name must be dsh-plugin-builder')
  if (typeof manifest.version !== 'string' || !manifest.version) fail('version must be present')
  if (manifest.type !== 'module') fail('package must use ESM')
  if (manifest.bin?.['dsh-plugin-builder'] !== './src/cli.mjs') fail('bin must target ./src/cli.mjs')

  for (const requiredEntry of ['src/', 'preset/', 'docs/', 'README.md', 'LICENSE']) {
    if (!manifest.files?.includes(requiredEntry)) fail(`package files must include ${requiredEntry}`)
  }

  const presetRoot = path.join(resolvedRoot, 'preset', 'plugin-builder')
  await validatePackagedPreset({ sourceDir: presetRoot })
  const metadata = await readFile(path.join(presetRoot, 'preset.yml'), 'utf8')
  if (!metadata.includes('name: 插件构建器')) fail('preset metadata must declare 插件构建器')
  const composition = await readFile(path.join(presetRoot, 'agent.cordis.yml'), 'utf8')
  if (!composition.includes('plugin-builder-workflow')) fail('composition must load the workflow skill')
  const skill = await readFile(
    path.join(presetRoot, 'skills', 'plugin-builder-workflow', 'SKILL.md'),
    'utf8',
  )
  if (!/^---\r?\nname: plugin-builder-workflow\r?\n/.test(skill)) {
    fail('workflow skill must have valid identifying frontmatter')
  }

  return {
    kind: 'valid-package',
    name: manifest.name,
    version: manifest.version,
    presetId: 'plugin-builder',
    filesChecked: REQUIRED_DISTRIBUTION_FILES.length,
  }
}

async function main() {
  try {
    const rootDir = fileURLToPath(new URL('../', import.meta.url))
    const result = await checkPackage({ rootDir })
    process.stdout.write(
      `Package ${result.name}@${result.version} is valid (${result.filesChecked} files checked).\n`,
    )
    return 0
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 1
  }
}

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isDirectExecution) process.exitCode = await main()
