#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { copyFile, mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'null'}`))
    })
  })
}

function runCapture(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'inherit'],
    })

    let stdout = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'null'}`))
    })
  })
}

async function main() {
  const repoRoot = process.cwd()
  const tmpRoot = await mkdtemp(path.join(tmpdir(), '3dmotion-clean-build-'))

  try {
    const filesRaw = await runCapture(
      'git',
      ['ls-files', '--cached', '--modified', '--others', '--exclude-standard', '-z'],
      repoRoot,
    )
    const files = filesRaw.split('\0').filter((file) => file.length > 0)

    for (const relativeFile of files) {
      const sourcePath = path.join(repoRoot, relativeFile)
      const targetPath = path.join(tmpRoot, relativeFile)
      await mkdir(path.dirname(targetPath), { recursive: true })
      await copyFile(sourcePath, targetPath)
    }

    await run('npm', ['ci', '--silent'], tmpRoot)
    await run('npm', ['run', 'build'], tmpRoot)
    console.log('[check-clean-build] Clean archive build passed.')
  } finally {
    if (process.env.KEEP_CLEAN_BUILD_TMP === '1') {
      console.log(`[check-clean-build] Kept temp workspace: ${tmpRoot}`)
      return
    }
    await rm(tmpRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('[check-clean-build] Failed.')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
