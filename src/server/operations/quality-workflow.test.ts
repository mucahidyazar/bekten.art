import {readFileSync} from 'node:fs'

import {describe, expect, it} from 'vitest'

const workflow = readFileSync('.github/workflows/quality.yml', 'utf8')

describe('production quality workflow', () => {
  it('runs Playwright against the standalone output', () => {
    expect(workflow).toContain(
      'PLAYWRIGHT_WEB_SERVER_COMMAND: node scripts/start-e2e-production.mjs',
    )
  })

  it('smokes readiness against a real S3-compatible bucket', () => {
    expect(workflow).toContain('quay.io/minio/minio:RELEASE.')
    expect(workflow).toContain('MEDIA_S3_ENDPOINT="https://127.0.0.1:9443"')
    expect(workflow).toContain('NODE_EXTRA_CA_CERTS="/ci-ca.crt"')
    expect(workflow).toContain('/api/ready')
    expect(workflow).not.toContain('/api/health >/dev/null')
    expect(workflow).not.toMatch(/AUTH_GOOGLE_(?:ID|SECRET)/u)
  })
})
