import {NextResponse} from 'next/server'

import {z} from 'zod'

import {prisma} from '@/lib/db'
import {
  workshopItemSchema,
  workshopSettingsSchema,
} from '@/schemas/workshop'
import {requireAdmin} from '@/utils/supabase/server'

export async function DELETE(request: Request) {
  try {
    await requireAdmin()

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({error: 'Item ID is required'}, {status: 400})
    }

    await prisma.sectionData.delete({
      where: {id},
    })

    return NextResponse.json({
      message: 'Workshop item deleted successfully',
      success: true,
    })
  } catch (error) {
    console.error('Workshop API DELETE error:', error)

    return NextResponse.json({error: 'Server error'}, {status: 500})
  }
}

const workshopSaveSchema = z.object({
  items: z.array(workshopItemSchema),
  settings: workshopSettingsSchema,
})

export async function GET() {
  try {
    await requireAdmin()

    const [items, settings] = await Promise.all([
      prisma.sectionData.findMany({
        orderBy: {order: 'asc'},
        where: {section_type: 'workshop'},
      }),
      prisma.section.findUnique({
        where: {section_type: 'workshop'},
      }),
    ])

    return NextResponse.json({
      items,
      settings:
        settings || {
          badge_text: 'Behind the Art',
          display_order: 0,
          is_active: true,
          max_items: 6,
          section_description:
            'Step into the creative sanctuary where masterpieces come to life, where tradition meets innovation',
          section_title: 'The Creative Workshop',
          section_type: 'workshop',
        },
    })
  } catch (error) {
    console.error('Workshop API GET error:', error)

    return NextResponse.json({error: 'Server error'}, {status: 500})
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const {items, settings} = workshopSaveSchema.parse(body)

    await prisma.$transaction(async tx => {
      await tx.sectionData.deleteMany({
        where: {section_type: 'workshop'},
      })

      if (items.length > 0) {
        await tx.sectionData.createMany({
          data: items.map((item, index) => ({
            created_at: new Date(),
            data: item.data,
            id:
              item.id && !item.id.startsWith('temp-') ? item.id : undefined,
            is_active: item.is_active,
            order: index,
            section_type: 'workshop',
            updated_at: new Date(),
          })),
        })
      }

      await tx.section.upsert({
        create: {
          ...settings,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: {
          ...settings,
          updated_at: new Date(),
        },
        where: {section_type: 'workshop'},
      })
    })

    return NextResponse.json({
      message: 'Workshop data updated successfully',
      success: true,
    })
  } catch (error) {
    console.error('Workshop API POST error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Server error',
      },
      {status: 400},
    )
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin()

    const body = (await request.json()) as Record<string, unknown> & {id?: string}
    const {id, ...updateData} = body

    if (!id) {
      return NextResponse.json({error: 'Item ID is required'}, {status: 400})
    }

    const data = await prisma.sectionData.update({
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      where: {id},
    })

    return NextResponse.json({
      data,
      message: 'Workshop item updated successfully',
      success: true,
    })
  } catch (error) {
    console.error('Workshop API PUT error:', error)

    return NextResponse.json({error: 'Server error'}, {status: 500})
  }
}

export const dynamic = 'force-dynamic'
