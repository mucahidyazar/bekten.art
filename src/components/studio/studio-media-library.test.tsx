import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({refresh: vi.fn()}))

vi.mock('next/navigation', () => ({useRouter: () => mocks}))

import {StudioMediaLibrary} from './studio-media-library'

const media = [
  {
    createdAt: '2026-08-11T08:00:00.000Z',
    displayName: 'Winter light',
    filename: 'winter-light.webp',
    folderId: null,
    height: 1200,
    id: '00000000-0000-4000-8000-000000000002',
    sizeBytes: 204800,
    status: 'READY' as const,
    version: 1,
    width: 1600,
  },
] as const
const folders = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Portraits',
    parentId: null,
    version: 1,
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
      screen.getByRole('img', {name: 'winter-light.webp'}),
    ).toHaveAttribute('loading', 'eager')
    expect(
      screen.queryByRole('button', {name: /delete/i}),
    ).not.toBeInTheDocument()
    expect(
      within(screen.getByTestId('studio-page-header')).getByText(
        'Drop artwork here',
      ),
    ).toBeVisible()
    expect(screen.getByTestId('media-upload-surface')).toHaveAttribute(
      'data-upload-state',
      'idle',
    )
  })

  it('switches between grid, list and desktop icon views', async () => {
    const user = userEvent.setup()

    render(<StudioMediaLibrary canDelete initialMedia={media} />)

    expect(screen.getByTestId('media-items')).toHaveAttribute(
      'data-view',
      'grid',
    )
    await user.click(screen.getByRole('button', {name: 'List view'}))
    expect(screen.getByTestId('media-items')).toHaveAttribute(
      'data-view',
      'list',
    )
    await user.click(screen.getByRole('button', {name: 'Desktop view'}))
    expect(screen.getByTestId('media-items')).toHaveAttribute(
      'data-view',
      'desktop',
    )
  })

  it('creates a virtual folder through the protected media command API', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({success: true}), {status: 200}),
    )

    render(<StudioMediaLibrary canDelete initialMedia={[]} />)
    await user.click(screen.getByRole('button', {name: 'New folder'}))
    await user.type(screen.getByLabelText('Folder name'), 'Portraits')
    await user.click(screen.getByRole('button', {name: 'Create folder'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/dashboard/media-library',
      expect.objectContaining({
        body: JSON.stringify({
          action: 'folder.create',
          name: 'Portraits',
          parentId: null,
        }),
        method: 'POST',
      }),
    )
  })

  it('opens a keyboard-focused action menu and closes it before rename', async () => {
    const user = userEvent.setup()

    render(<StudioMediaLibrary canDelete initialMedia={media} />)
    await user.click(
      screen.getByRole('button', {name: 'Actions for winter-light.webp'}),
    )
    const rename = screen.getByRole('menuitem', {name: 'Rename'})

    await waitFor(() => expect(rename).toHaveFocus())
    await user.click(rename)

    expect(
      screen.queryByRole('menu', {name: 'Actions for Winter light'}),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', {name: 'Rename item'})).toBeVisible()
  })

  it('moves media to a folder with a keyboard-accessible command', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({success: true}), {status: 200}),
    )

    render(
      <StudioMediaLibrary
        canDelete
        initialFolders={folders}
        initialMedia={media}
      />,
    )
    await user.click(
      screen.getByRole('button', {name: 'Actions for winter-light.webp'}),
    )
    await user.click(screen.getByRole('menuitem', {name: 'Move to folder'}))
    await user.selectOptions(
      screen.getByLabelText('Destination folder'),
      folders[0].id,
    )
    await user.click(screen.getByRole('button', {name: 'Move item'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/dashboard/media-library',
      expect.objectContaining({
        body: JSON.stringify({
          action: 'media.move',
          id: media[0].id,
          parentId: folders[0].id,
          version: 1,
        }),
        method: 'POST',
      }),
    )
  })

  it('loads older media pages instead of silently capping the library', async () => {
    const user = userEvent.setup()
    const older = {
      ...media[0],
      displayName: 'Earlier work',
      filename: 'earlier-work.webp',
      id: '00000000-0000-4000-8000-000000000003',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({items: [older], nextCursor: null, total: 2}),
        {status: 200},
      ),
    )
    render(
      <StudioMediaLibrary
        canDelete
        initialMedia={media}
        initialMediaTotal={2}
        initialNextCursor={media[0].id}
      />,
    )

    expect(screen.getByText('Showing 1 of 2 images')).toBeVisible()
    await user.click(screen.getByRole('button', {name: 'Load older images'}))

    expect(await screen.findByText('Earlier work')).toBeVisible()
    expect(screen.getByText('Showing 2 of 2 images')).toBeVisible()
    expect(
      screen.queryByRole('button', {name: 'Load older images'}),
    ).not.toBeInTheDocument()
  })

  it('reveals the drop surface during a file drag', () => {
    render(<StudioMediaLibrary canDelete initialMedia={[]} />)
    const surface = screen.getByTestId('media-upload-surface')

    fireEvent.dragEnter(surface, {
      dataTransfer: {files: [new File(['image'], 'work.png', {type: 'image/png'})]},
    })

    expect(surface).toHaveAttribute('data-upload-state', 'dragging')
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
