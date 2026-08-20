import { access, cp, mkdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const PRESET_ID = 'plugin-builder'
const REQUIRED_PRESET_FILES = [
  'preset.yml',
  'agent.cordis.yml',
  path.join('skills', 'plugin-builder-workflow', 'SKILL.md'),
]

export async function validatePackagedPreset({ sourceDir }) {
  for (const relativePath of REQUIRED_PRESET_FILES) {
    try {
      await access(path.join(sourceDir, relativePath))
    } catch (cause) {
      const error = new Error(`Invalid Plugin Builder preset: missing ${relativePath}`, { cause })
      error.code = 'INVALID_PRESET'
      throw error
    }
  }
  return { kind: 'valid-preset', sourceDir: path.resolve(sourceDir) }
}

async function pathExists(target) {
  try {
    await access(target)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

function resolvePresetTarget(dshHome) {
  return path.resolve(dshHome, '.agent-presets', PRESET_ID)
}

export async function getPresetStatus({ dshHome }) {
  const target = resolvePresetTarget(dshHome)
  return { kind: 'status', installed: await pathExists(target), target }
}

export async function uninstallPreset({ dshHome }) {
  const target = resolvePresetTarget(dshHome)
  if (!(await pathExists(target))) return { kind: 'not-installed', target }
  await rm(target, { recursive: true })
  return { kind: 'uninstalled', target }
}

export async function installPreset({ dshHome, sourceDir, replace = false }) {
  await validatePackagedPreset({ sourceDir })
  const presetsRoot = path.resolve(dshHome, '.agent-presets')
  const target = resolvePresetTarget(dshHome)
  const staging = path.join(presetsRoot, `.${PRESET_ID}-${randomUUID()}.staging`)
  const backup = path.join(presetsRoot, `.${PRESET_ID}-${randomUUID()}.backup`)

  await mkdir(presetsRoot, { recursive: true })
  const targetExists = await pathExists(target)
  if (targetExists && !replace) {
    const error = new Error(`Plugin Builder preset already exists at ${target}`)
    error.code = 'PRESET_EXISTS'
    throw error
  }

  let hasBackup = false
  try {
    await cp(sourceDir, staging, { recursive: true, errorOnExist: true })
    if (targetExists) {
      await rename(target, backup)
      hasBackup = true
    }
    await rename(staging, target)
    if (hasBackup) await rm(backup, { recursive: true, force: true })
  } catch (error) {
    await rm(staging, { recursive: true, force: true })
    if (hasBackup && !(await pathExists(target))) await rename(backup, target)
    throw error
  }

  return { kind: 'installed', target, replaced: targetExists }
}
