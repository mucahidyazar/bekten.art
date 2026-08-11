import {describe, expect, it, vi} from 'vitest'

import {createStudioUserService} from './studio-user-service'

const userId = '11111111-1111-4111-8111-111111111111'

function setup() {
  const store = {
    changeRole: vi.fn().mockResolvedValue({id: userId}),
    changeStatus: vi.fn().mockResolvedValue({id: userId}),
    invite: vi.fn().mockResolvedValue({id: userId}),
    list: vi.fn().mockResolvedValue([]),
    resendInvite: vi.fn().mockResolvedValue({id: userId}),
  }

  return {service: createStudioUserService(store), store}
}

describe('Studio user service', () => {
  it('normalizes and validates an owner invitation', async () => {
    const {service, store} = setup()

    await service.command('22222222-2222-4222-8222-222222222222', {
      action: 'user.invite',
      email: ' Editor@Example.COM ',
      name: '  Studio Editor  ',
      role: 'EDITOR',
    })

    expect(store.invite).toHaveBeenCalledWith({
      actorId: '22222222-2222-4222-8222-222222222222',
      email: 'editor@example.com',
      name: 'Studio Editor',
      role: 'EDITOR',
    })
  })

  it('rejects public roles and malformed identifiers before storage work', async () => {
    const {service, store} = setup()

    await expect(
      service.command(
        'actor',
        {
          action: 'user.invite',
          email: 'not-an-email',
          role: 'USER',
        } as never,
      ),
    ).rejects.toThrow('STUDIO_USER_COMMAND_INVALID')
    expect(store.invite).not.toHaveBeenCalled()
  })

  it('passes optimistic role and status commands to the store', async () => {
    const {service, store} = setup()
    const actorId = '22222222-2222-4222-8222-222222222222'

    await service.command(actorId, {
      action: 'user.role',
      id: userId,
      role: 'OWNER',
      version: 3,
    })
    await service.command(actorId, {
      action: 'user.status',
      id: userId,
      status: 'SUSPENDED',
      version: 4,
    })

    expect(store.changeRole).toHaveBeenCalledWith({
      actorId,
      id: userId,
      role: 'OWNER',
      version: 3,
    })
    expect(store.changeStatus).toHaveBeenCalledWith({
      actorId,
      id: userId,
      status: 'SUSPENDED',
      version: 4,
    })
  })

  it('keeps resend restricted to a valid user identifier', async () => {
    const {service, store} = setup()
    const actorId = '22222222-2222-4222-8222-222222222222'

    await service.command(actorId, {action: 'user.resend-invite', id: userId})

    expect(store.resendInvite).toHaveBeenCalledWith({actorId, id: userId})
  })
})
