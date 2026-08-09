import {spawn} from 'node:child_process'

import {
  createProductionStartupPlan,
  validateProductionStartupEnvironment,
} from './lib/production-startup.mjs'

let activeChild = null
let shutdownSignal = null

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    shutdownSignal = signal
    activeChild?.kill(signal)
  })
}

function run({arguments: arguments_, command, label}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      env: process.env,
      stdio: 'inherit',
    })

    activeChild = child

    child.once('error', reject)
    child.once('exit', code => {
      activeChild = null

      if (shutdownSignal) {
        resolve()

        return
      }

      if (code === 0) {
        resolve()

        return
      }

      reject(new Error(`${label} exited with code ${code ?? 'unknown'}`))
    })
  })
}

try {
  validateProductionStartupEnvironment(process.env)

  for (const step of createProductionStartupPlan(process.env)) {
    if (shutdownSignal) {
      break
    }

    await run(step)
  }
} catch (error) {
  console.error(
    JSON.stringify({
      event: 'production_start_failed',
      message: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    }),
  )
  process.exitCode = 1
}
