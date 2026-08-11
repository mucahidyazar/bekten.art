import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({refresh: vi.fn()}))

vi.mock('next/navigation', () => ({useRouter: () => mocks}))

import {StudioMediaLibrary} from './studio-media-library'

const media = [
  {
    createdAt: '2026-08-11T08:00:00.000Z',
    filename: 'winter-light.webp',
    height: 1200,
    id: '00000000-0000-4000-8000-000000000002',
    sizeBytes: 204800,
    status: 'READY' as const,
    width: 1600,
  },
] as const

describe('StudioMediaLibrary', () => {
  beforeEach(() => {
    mocks.refresh.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('offers an accessible Garage upload and media overview to editors', () => {
    render(<StudioMediaLibrary canDelete={false} initialMedia={media} />)

    expect(screen.getByLabelText('Choose artwork image')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp,image/avif',
    )
    expect(
      screen.getByRole('img', {name: 'winter-light.webp'}),
    ).toHaveAttribute('src', expect.stringContaining('/api/media/'))
    expect(
      screen.queryByRole('button', {name: /delete/i}),
    ).not.toBeInTheDocument()
  })

  it('uploads through the protected Garage API and refreshes the library', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({success: true}), {status: 200}),
      )

    render(<StudioMediaLibrary canDelete initialMedia={[]} />)

    const input = screen.getByLabelText('Choose artwork image')

    await user.upload(
      input,
      new File(['image'], 'new-work.png', {type: 'image/png'}),
    )
    expect((input as HTMLInputElement).files).toHaveLength(1)
    fireEvent.submit(
      screen.getByRole('button', {name: 'Upload image'}).closest('form')!,
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/uploads',
      expect.objectContaining({body: expect.any(FormData), method: 'POST'}),
    )
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })

  it('shows a safe upload API error without refreshing', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({error: 'Invalid image upload'}), {
        status: 415,
      }),
    )
    render(<StudioMediaLibrary canDelete initialMedia={[]} />)
    const input = screen.getByLabelText('Choose artwork image')

    await user.upload(
      input,
      new File(['image'], 'new-work.png', {type: 'image/png'}),
    )
    fireEvent.submit(
      screen.getByRole('button', {name: 'Upload image'}).closest('form')!,
    )

    expect(await screen.findByText('Invalid image upload')).toBeVisible()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it('deletes Garage media through the owner-only control', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({success: true}), {status: 200}),
      )

    render(<StudioMediaLibrary canDelete initialMedia={media} />)
    await user.click(
      screen.getByRole('button', {name: 'Delete winter-light.webp'}),
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/uploads?id=00000000-0000-4000-8000-000000000002',
      {method: 'DELETE'},
    )
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })

  it('keeps failed Garage deletions visible to owners with an explicit retry', () => {
    render(
      <StudioMediaLibrary
        canDelete
        initialMedia={[
          {
            ...media[0],
            filename: 'failed-delete.webp',
            status: 'FAILED',
          },
        ]}
      />,
    )

    expect(screen.getByText('Deletion needs attention')).toBeVisible()
    expect(
      screen.getByRole('button', {name: 'Retry deletion failed-delete.webp'}),
    ).toBeVisible()
    expect(
      screen.queryByRole('img', {name: 'failed-delete.webp'}),
    ).not.toBeInTheDocument()
  })

  it('rejects an empty upload before network work', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    render(<StudioMediaLibrary canDelete={false} initialMedia={[]} />)
    fireEvent.submit(
      screen.getByRole('button', {name: 'Upload image'}).closest('form')!,
    )

    expect(screen.getByText('Choose an image before uploading.')).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
