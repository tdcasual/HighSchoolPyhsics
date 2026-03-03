#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
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

function extractHeadArchive(repoRoot, destinationDir) {
  return new Promise((resolve, reject) => {
    const archive = spawn('git', ['archive', '--format=tar', 'HEAD'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    const unpack = spawn('tar', ['-x', '-C', destinationDir], {
      stdio: ['pipe', 'inherit', 'inherit'],
    })

    let archiveExitCode = null
    let unpackExitCode = null
    let settled = false

    const finish = () => {
      if (settled || archiveExitCode === null || unpackExitCode === null) {
        return
      }
      settled = true
      if (archiveExitCode === 0 && unpackExitCode === 0) {
        resolve()
        return
      }
      reject(
        new Error(
          `git archive/tar extraction failed (git=${archiveExitCode}, tar=${unpackExitCode})`,
        ),
      )
    }

    archive.stdout.pipe(unpack.stdin)
    archive.on('error', reject)
    unpack.on('error', reject)
    archive.on('close', (code) => {
      archiveExitCode = code ?? 1
      finish()
    })
    unpack.on('close', (code) => {
      unpackExitCode = code ?? 1
      finish()
    })
  })
}

async function main() {
  const repoRoot = process.cwd()
  const archiveRoot = await mkdtemp(path.join(tmpdir(), '3dmotion-clean-build-'))

  try {
    await extractHeadArchive(repoRoot, archiveRoot)
    await run('npm', ['ci', '--silent'], archiveRoot)
    await run('npm', ['run', 'build'], archiveRoot)
    console.log('[check-clean-build] Clean archive build passed.')
  } finally {
    if (process.env.KEEP_CLEAN_BUILD_TMP === '1') {
      console.log(`[check-clean-build] Kept temp workspace: ${archiveRoot}`)
      return
    }
    await rm(archiveRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('[check-clean-build] Failed.')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
