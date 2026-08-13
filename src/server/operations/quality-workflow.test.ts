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
    expect(workflow).toContain(
      'quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z',
    )
    expect(workflow).toContain('MEDIA_S3_ENDPOINT="https://127.0.0.1:9443"')
    expect(workflow).toContain('NODE_EXTRA_CA_CERTS="/ci-ca.crt"')
    expect(workflow).toContain('proxy_set_header Host $http_host;')
    expect(workflow).toContain('/api/ready')
    expect(workflow).toContain(
      'curl --silent --show-error http://127.0.0.1:3000/api/ready || true',
    )
    expect(workflow).toMatch(
      /for attempt in \$\(seq 1 90\); do\n\s+if curl --fail --silent http:\/\/127\.0\.0\.1:3000\/api\/ready/u,
    )
    expect(workflow).not.toContain('/api/health >/dev/null')
    expect(workflow).not.toMatch(/AUTH_GOOGLE_(?:ID|SECRET)/u)
  })
})
