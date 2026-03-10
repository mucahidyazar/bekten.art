import {NextResponse} from 'next/server'

import {prisma} from '@/lib/db'
import {requireAdmin} from '@/utils/supabase/server'

export async function GET() {
  try {
    await requireAdmin()

    const contactUser = await getPrimaryContactUser()

    return NextResponse.json({
      contactInfo: {
        address: contactUser?.address || '',
        email: contactUser?.email || '',
        instagram_url:
          contactUser?.socials.find(social => social.platform === 'instagram')
            ?.url || '',
        map_embed_url: contactUser?.map_embed_url || '',
        phone: contactUser?.phone || '',
        working_hours: contactUser?.working_hours || '',
      },
    })
  } catch (error) {
    console.error('Contact info API error:', error)

    return NextResponse.json({error: 'Server error'}, {status: 500})
  }
}

async function getPrimaryContactUser() {
  return prisma.user.findFirst({
    include: {
      socials: {
        orderBy: {platform: 'asc'},
      },
    },
    orderBy: [{email: 'asc'}],
    where: {
      OR: [
        {email: 'bekten.usubaliev@gmail.com'},
        {role: 'ADMIN'},
      ],
    },
  })
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const contactInfo = (await request.json()) as {
      address?: string
      email?: string
      instagram_url?: string
      map_embed_url?: string
      phone?: string
      working_hours?: string
    }

    const contactUser = await getPrimaryContactUser()

    if (!contactUser) {
      return NextResponse.json({error: 'Admin user not found'}, {status: 404})
    }

    await prisma.$transaction(async tx => {
      await tx.user.update({
        where: {id: contactUser.id},
        data: {
          address: contactInfo.address || '',
          email: contactInfo.email || contactUser.email,
          map_embed_url: contactInfo.map_embed_url || '',
          phone: contactInfo.phone || '',
          working_hours: contactInfo.working_hours || '',
        },
      })

      const existingInstagram = await tx.social.findFirst({
        where: {
          platform: 'instagram',
          user_id: contactUser.id,
        },
      })

      if (contactInfo.instagram_url) {
        if (existingInstagram) {
          await tx.social.update({
            where: {id: existingInstagram.id},
            data: {url: contactInfo.instagram_url},
          })
        } else {
          await tx.social.create({
            data: {
              platform: 'instagram',
              url: contactInfo.instagram_url,
              user_id: contactUser.id,
            },
          })
        }
      }
    })

    return NextResponse.json({success: true})
  } catch (error) {
    console.error('Contact info save API error:', error)

    return NextResponse.json({error: 'Server error'}, {status: 500})
  }
}

export const dynamic = 'force-dynamic'
