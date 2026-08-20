#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import path from 'node:path'

import { getPresetStatus, installPreset, uninstallPreset } from './preset-manager.mjs'

const PACKAGED_PRESET = fileURLToPath(new URL('../preset/plugin-builder/', import.meta.url))
const USAGE = 'Usage: dsh-plugin-builder <install|status|uninstall> [--dsh-home <path>] [--replace]\n'

function parseArgs(args, { env, userHome }) {
  const command = args[0]
  if (!['install', 'status', 'uninstall'].includes(command)) return undefined

  let explicitDshHome
  let replace = false
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--dsh-home') {
      const value = args[index + 1]
      if (explicitDshHome || !value || value.startsWith('--')) return undefined
      explicitDshHome = value
      index += 1
      continue
    }
    if (argument === '--replace' && command === 'install' && !replace) {
      replace = true
      continue
    }
    return undefined
  }

  const dshHome = explicitDshHome
    ? path.resolve(explicitDshHome)
    : env.DSH_HOME
      ? path.resolve(env.DSH_HOME)
      : path.join(userHome, '.dsh')
  return { command, dshHome, replace }
}

export async function runCli(args, { env = process.env, userHome = homedir() } = {}) {
  const parsed = parseArgs(args, { env, userHome })
  if (!parsed) return { exitCode: 2, stdout: '', stderr: USAGE }
  const { command, dshHome, replace } = parsed

  if (command === 'status' && dshHome) {
    const status = await getPresetStatus({ dshHome })
    if (!status.installed) {
      return {
        exitCode: 2,
        stdout: `Plugin Builder is not installed at ${status.target}.\n`,
        stderr: '',
      }
    }
    return {
      exitCode: 0,
      stdout: `Plugin Builder is installed at ${status.target}.\n`,
      stderr: '',
    }
  }

  if (command === 'install' && dshHome) {
    let receipt
    try {
      receipt = await installPreset({
        dshHome,
        sourceDir: PACKAGED_PRESET,
        replace,
      })
    } catch (error) {
      if (error.code === 'PRESET_EXISTS') {
        return {
          exitCode: 1,
          stdout: '',
          stderr: `${error.message}. Use --replace to replace it.\n`,
        }
      }
      throw error
    }
    return {
      exitCode: 0,
      stdout: `Plugin Builder ${receipt.replaced ? 'replaced' : 'installed'} at ${receipt.target}. Start a new DSH session and select 插件构建器.\n`,
      stderr: '',
    }
  }

  if (command === 'uninstall' && dshHome) {
    const receipt = await uninstallPreset({ dshHome })
    if (receipt.kind === 'not-installed') {
      return {
        exitCode: 2,
        stdout: `Plugin Builder is not installed at ${receipt.target}.\n`,
        stderr: '',
      }
    }
    return {
      exitCode: 0,
      stdout: `Plugin Builder uninstalled from ${receipt.target}.\n`,
      stderr: '',
    }
  }

  return { exitCode: 0, stdout: '', stderr: '' }
}

export async function main(
  args = process.argv.slice(2),
  { stdout = process.stdout, stderr = process.stderr } = {},
) {
  try {
    const result = await runCli(args)
    if (result.stdout) stdout.write(result.stdout)
    if (result.stderr) stderr.write(result.stderr)
    return result.exitCode
  } catch (error) {
    stderr.write(`Plugin Builder failed: ${error.message}\n`)
    return 1
  }
}

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isDirectExecution) process.exitCode = await main()
