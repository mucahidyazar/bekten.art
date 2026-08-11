import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {afterEach, describe, expect, it} from 'vitest'

import {
  e2eServerEnvironment,
  prepareStandaloneAssets,
} from './start-e2e-production.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(directory =>
      rm(directory, {force: true, recursive: true}),
    ),
  )
})

describe('production E2E server', () => {
  it('uses only a loopback test origin and derives the standalone bind address', () => {
    expect(
      e2eServerEnvironment({
        PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:4310',
      }),
    ).toMatchObject({
      HOSTNAME: '127.0.0.1',
      NEXTAUTH_URL: 'http://127.0.0.1:4310',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:4310',
      PORT: '4310',
    })
    expect(() =>
      e2eServerEnvironment({PLAYWRIGHT_BASE_URL: 'https://example.com'}),
    ).toThrow('E2E_SERVER_ORIGIN_INVALID')
  })

  it('copies public and generated static assets beside the standalone server', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bekten-e2e-'))

    temporaryDirectories.push(root)
    await mkdir(join(root, '.next/static'), {recursive: true})
    await mkdir(join(root, '.next/standalone'), {recursive: true})
    await mkdir(join(root, 'public'), {recursive: true})
    await writeFile(join(root, '.next/static/app.css'), 'css')
    await writeFile(join(root, 'public/logo.svg'), 'logo')

    await prepareStandaloneAssets(root)

    await expect(
      readFile(join(root, '.next/standalone/.next/static/app.css'), 'utf8'),
    ).resolves.toBe('css')
    await expect(
      readFile(join(root, '.next/standalone/public/logo.svg'), 'utf8'),
    ).resolves.toBe('logo')
  })
})
