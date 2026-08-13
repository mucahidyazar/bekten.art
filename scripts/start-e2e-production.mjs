import {spawn} from 'node:child_process'
import {cp, rm} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

function e2eServerEnvironment(environment = process.env) {
  const rawBaseUrl =
    environment.PLAYWRIGHT_BASE_URL?.trim() || 'http://localhost:3000'
  let baseUrl

  try {
    baseUrl = new URL(rawBaseUrl)
  } catch {
    throw new Error('E2E_SERVER_ORIGIN_INVALID')
  }

  if (
    baseUrl.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(baseUrl.hostname) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.pathname !== '/' ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new Error('E2E_SERVER_ORIGIN_INVALID')
  }

  return Object.freeze({
    ...environment,
    HOSTNAME: baseUrl.hostname,
    NEXTAUTH_URL: baseUrl.origin,
    NEXT_PUBLIC_APP_URL: baseUrl.origin,
    PORT: baseUrl.port || '80',
  })
}

async function prepareStandaloneAssets(rootDirectory = process.cwd()) {
  const standaloneRoot = resolve(rootDirectory, '.next/standalone')
  const standalonePublic = resolve(standaloneRoot, 'public')
  const standaloneStatic = resolve(standaloneRoot, '.next/static')

  await Promise.all([
    rm(standalonePublic, {force: true, recursive: true}),
    rm(standaloneStatic, {force: true, recursive: true}),
  ])
  await Promise.all([
    cp(resolve(rootDirectory, 'public'), standalonePublic, {recursive: true}),
    cp(resolve(rootDirectory, '.next/static'), standaloneStatic, {
      recursive: true,
    }),
  ])
}

async function startE2eProductionServer(environment = process.env) {
  const rootDirectory = process.cwd()
  const serverEnvironment = e2eServerEnvironment(environment)

  await prepareStandaloneAssets(rootDirectory)

  const child = spawn(process.execPath, ['server.js'], {
    cwd: resolve(rootDirectory, '.next/standalone'),
    env: serverEnvironment,
    stdio: 'inherit',
  })
  let shutdownRequested = false

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      shutdownRequested = true
      child.kill(signal)
    })
  }

  return new Promise((resolvePromise, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (shutdownRequested || signal || code === 0) {
        resolvePromise()

        return
      }

      reject(new Error(`E2E_SERVER_EXITED:${code ?? 'unknown'}`))
    })
  })
}

export {
  e2eServerEnvironment,
  prepareStandaloneAssets,
  startE2eProductionServer,
}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (entryUrl === import.meta.url) {
  startE2eProductionServer().catch(error => {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'E2E_SERVER_FAILED'}\n`,
    )
    process.exitCode = 1
  })
}
