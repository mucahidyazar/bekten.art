import '@testing-library/jest-dom/vitest'
import {afterEach} from 'vitest'

process.env.DATABASE_URL ??=
  'postgresql://test:test@127.0.0.1:5432/bekten_test'

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  localStorage.clear()
  sessionStorage.clear()
})
